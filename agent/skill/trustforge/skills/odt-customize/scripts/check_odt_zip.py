"""Check an ODT-generated zip (<FID>_RAD.ZIP) before anything is deployed or compiled.

ODT only generates the units that were ticked on the Generate screen, and it does not warn when one is
missing. A missing unit shows up much later as a runtime error in FLEXCUBE (for example ST-AMND-002 on
Modify when the amendable INCs were not generated). This script reads the radxml inside the zip, works out
which units and rows the change needs, and checks the zip holds them.

Usage:  python3 -I check_odt_zip.py <FID>_RAD.ZIP [--custom-body our_custom.sql]

  --custom-body  the hand-written CUSTOM package body that will be compiled instead of ODT's stub;
                 checked against the custom spec in the zip (every routine present).

Exit code 0 = no errors (warnings may remain), 1 = errors: do not deploy until fixed.
Checks (each maps to a lesson in reference/29-lessons-learned.md):
  units      radxml, UIXML, SYS js, MAIN spec/body, CUSTOM spec present
  amend      every field with AMENDABLE_IN has a GWTB_AMEND_FIELDS + GWTM_AMEND_FIELDS row for that action
  datasrc    every data source is in CSTB_FID_DATA_SOURCES and used by the MAIN package
  lov        every LOV is in CSTB_LOV_INFO
  labels     every new (CUSTOM) field is in CSTB_FIELD_LABELS and the UIXML
  menu       a new function has all four menu INCs
  summary    a function with a summary has CSTB_SUMMARY_INFO
  callform   call forms are in CSTB_FID_CALLFORMS
  pkcols     STTB_AUDIT_PK_COLS present (Block PK Columns ticked)
  stub       the zip's CUSTOM package body is ODT's empty stub -> never compile it over hand-written code
"""
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'odt-radxml', 'scripts'))
from radxml_merge import merge  # noqa: E402

AMEND_INCS = ['GWTM_AMEND_MASTER', 'GWTM_AMEND_NODES', 'GWTM_AMEND_FIELDS', 'GWTB_AMEND_NODES', 'GWTB_AMEND_FIELDS']
MENU_INCS = ['SMTB_MENU', 'SMTB_FUNCTION_DESCRIPTION', 'SMTB_ROLE_DETAIL', 'SMTB_FCC_FCJ_MAPPING']

errors, warnings, oks = [], [], []


def err(check, msg):
    errors.append(f'ERROR [{check}] {msg}')


def warn(check, msg):
    warnings.append(f'WARN  [{check}] {msg}')


def ok(check, msg):
    oks.append(f'OK    [{check}] {msg}')


def txt(e, tag):
    v = e.find(tag)
    return (v.text or '').strip() if v is not None and v.text else ''


def parse_inserts(sql):
    """Rows of every INSERT INTO T(cols) VALUES(...) in an INC, as dicts of upper-cased string values."""
    rows = []
    for m in re.finditer(r'INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)\s*VALUES\s*\((.*?)\)\s*;', sql, re.S | re.I):
        cols = [c.strip().upper() for c in m.group(2).split(',')]
        vals, buf, inq, i, body = [], '', False, 0, m.group(3)
        while i < len(body):
            ch = body[i]
            if inq:
                if ch == "'" and i + 1 < len(body) and body[i + 1] == "'":
                    buf += "'"
                    i += 1
                elif ch == "'":
                    inq = False
                else:
                    buf += ch
            elif ch == "'":
                inq = True
            elif ch == ',':
                vals.append(buf.strip())
                buf = ''
            else:
                buf += ch
            i += 1
        vals.append(buf.strip())
        rows.append({c: (vals[k].upper() if k < len(vals) else '') for k, c in enumerate(cols)})
    return rows


ROUTINE = re.compile(r'\b(FUNCTION|PROCEDURE)\s+(\w+)', re.I)
TRIVIAL = re.compile(
    r"^(BEGIN|END\b.*|RETURN\s+(TRUE|FALSE)\s*;|NULL\s*;|EXCEPTION|WHEN\s+OTHERS\s+THEN|IS|AS|RETURN\s+BOOLEAN"
    r"|DBG\s*\(.*|DEBUG\.PR_DEBUG\s*\(.*|P_ERR_CODE\s*:=.*|P_ERR_PARAMS\s*:=.*|CSPKS_REQ_UTILS\.PR_LOG_ERROR\s*\(.*"
    r"|IF\s+DEBUG\.PKG_DEBUG_ON.*|END\s+IF\s*;)$", re.I)


HELPERS = {'DBG', 'PR_LOG_ERROR', 'PR_SKIP_HANDLER'}


def logic_lines(body_sql):
    """Lines of real logic in a package body: each routine's executable part (BEGIN .. EXCEPTION/END),
    minus ODT's boilerplate (debug calls, RETURN TRUE, error-code assignments) and minus ODT's helper routines."""
    s = re.sub(r'--[^\n]*', '', body_sql)
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    heads = list(ROUTINE.finditer(s))
    out = []
    for i, h in enumerate(heads):
        if h.group(2).upper() in HELPERS:
            continue
        seg = s[h.end(): heads[i + 1].start() if i + 1 < len(heads) else len(s)]
        b = re.search(r'\bBEGIN\b', seg, re.I)
        if not b:
            continue  # declaration only (spec)
        exe = seg[b.end():]
        x = re.search(r'\bEXCEPTION\b', exe, re.I)
        if x:
            exe = exe[:x.start()]
        for raw in exe.splitlines():
            line = raw.strip()
            if line and not TRIVIAL.match(line):
                out.append(line)
    return out


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    body_path = None
    if '--custom-body' in argv:
        i = argv.index('--custom-body')
        body_path = argv[i + 1] if i + 1 < len(argv) else None
        args = [a for a in args if a != body_path]
    if not args:
        raise SystemExit(__doc__)
    zpath = args[0]
    z = zipfile.ZipFile(zpath)
    names = z.namelist()
    upper = {n.upper(): n for n in names}

    def read(n):
        return z.read(n).decode('utf-8', 'ignore')

    # ---- radxml and function id
    rads = [n for n in names if n.upper().startswith('RADXML/') and n.upper().endswith('_RAD.XML')]
    if not rads:
        err('units', 'no RADXML/<FID>_RAD.xml in the zip: tick Screen Xml/Radxml and generate again')
        return report(zpath)
    rad_name = rads[0]
    fid = os.path.basename(rad_name)[:-len('_RAD.xml')].upper()
    raw = z.read(rad_name)
    if b'<!DOCTYPE' in raw[:4096].upper() or b'<!ENTITY' in raw.upper():
        err('units', f'{rad_name} contains a DOCTYPE/ENTITY declaration; ODT never writes one. Not parsing it.')
        return report(zpath)
    root = ET.fromstring(raw)
    origin = txt(root, 'FUNCTION_ORIGIN').upper()
    release = txt(root, 'RELEASE_TYPE').upper()
    new_function = bool(origin) and origin == release
    m = merge(root)
    ok('units', f'function {fid}, origin {origin or "?"}, release {release or "?"}'
                f' ({"new function" if new_function else "change to an existing function"})')

    incs = {}
    for n in names:
        mm = re.match(r'INC/(\w+?)__' + re.escape(fid) + r'\.INC$', n, re.I)
        if mm:
            incs[mm.group(1).upper()] = n

    def inc_text(t):
        return read(incs[t]) if t in incs else ''

    # ---- units
    mod = None
    for n in names:
        mm = re.match(r'SPC/(\w+)pks_' + re.escape(fid.lower()) + r'_main\.spc$', n, re.I)
        if mm:
            mod = mm.group(1).lower()
    need = {f'UIXML/ENG/{fid}.XML': 'UIXML (Screen Xml)', f'JS/{fid}_SYS.JS': 'System JS'}
    # OBPM Java functions (screen Preferences "Java functions" = ELCM_FUNCTION Y): Java classes, no PL/SQL packages
    java_fn = 'Y' in [e.text for e in m.iter('ELCM_FUNCTION')]
    java_src = [n for n in names if n.lower().endswith('.java')]
    if java_fn:
        custom_cls = [n for n in java_src if re.search(r'/src/.*Custom\.java$', n)]
        if custom_cls:
            ok('units', f'Java functions: {len(java_src)} Java sources, hook class {os.path.basename(custom_cls[0])}')
        else:
            err('units', 'Java functions screen but no <Name>Custom.java in the zip: tick Java Classes on Generate')
    elif mod:
        need.update({f'SPC/{mod}PKS_{fid}_MAIN.SPC'.upper(): 'Main Package Spec',
                     f'SQL/{mod}PKS_{fid}_MAIN.SQL'.upper(): 'Main Package Body',
                     f'SPC/{mod}PKS_{fid}_CUSTOM.SPC'.upper(): 'Custom Package Spec'})
    else:
        err('units', 'no SPC/<mod>pks_<fid>_main.spc: tick Main Package Spec/Body')
    for key, label in need.items():
        if key.upper() in upper:
            ok('units', f'{label} present')
        else:
            err('units', f'{label} missing ({key}): tick it on the Generate screen')
    for t, n in incs.items():
        if z.getinfo(n).file_size == 0 and t != 'GWTM_OPERATIONS_MASTER_FG':
            warn('units', f'{n} is empty (0 bytes)')

    # ---- data sources
    ds_names = [txt(d, 'DATASRC_NAME').upper() or (d.get('ID') or '').upper() for d in m.findall('RAD_DATASOURCES')]
    ds_inc = inc_text('CSTB_FID_DATA_SOURCES').upper()
    main_sql = read(upper[f'SQL/{mod}PKS_{fid}_MAIN.SQL'.upper()]).upper() if mod and f'SQL/{mod}PKS_{fid}_MAIN.SQL'.upper() in upper else ''
    if not ds_inc:
        err('datasrc', 'CSTB_FID_DATA_SOURCES INC missing: tick Datasource')
    for ds in ds_names:
        if ds_inc and ds not in ds_inc:
            err('datasrc', f'data source {ds} not in CSTB_FID_DATA_SOURCES INC')
        if main_sql and ds not in main_sql:
            err('datasrc', f'data source {ds} not used by the generated MAIN package body: regenerate Main Package')
    if ds_names and ds_inc:
        ok('datasrc', f'{len(ds_names)} data sources in CSTB_FID_DATA_SOURCES')

    # ---- amendables
    expected = {}  # (action, node, field) -> field name in block
    for blk in m.findall('RAD_DATA_BLOCKS'):
        for f in blk.findall('RAD_BLK_FIELDS'):
            dbt, dbc, am = txt(f, 'DBT').upper(), txt(f, 'DBC').upper(), txt(f, 'AMENDABLE_IN').upper()
            if dbt and dbc and am:
                for act in re.split(r'[~,;\s]+', am):
                    if act:
                        expected[(f'{fid}_{act}', dbt, dbc)] = txt(f, 'FIELD_NAME')
    if expected:
        missing_incs = [t for t in AMEND_INCS if t not in incs]
        if missing_incs:
            layer = root.find('RAD_' + release) if release in ('CLUSTER', 'CUSTOM', 'CUSTOMER') else None
            if not new_function and layer is not None and layer.find('RAD_ACTIONS') is None:
                why = (f'RAD_{release} has no RAD_ACTIONS, so ODT generates no amendables for this release even with '
                       f'Amendable ticked. Copy the kernel RAD_ACTIONS whole into RAD_{release} (or open Actions in ODT '
                       f'in this release and Save), then generate again with Amendable ticked.')
            else:
                why = 'tick Amendable on the Generate screen.'
            err('amend', f'{len(expected)} fields are amendable but the zip has no {", ".join(missing_incs)} INC(s): '
                         f'{why} Without them Modify fails with ST-AMND-002.')
        else:
            gwtb = {(r.get('OPERATION_CODE', ''), r.get('NODE_NAME', ''), r.get('FIELD_NAME', ''))
                    for r in parse_inserts(inc_text('GWTB_AMEND_FIELDS'))}
            gwtm = {(r.get('SOURCE_OPERATION', ''), r.get('NODE_NAME', ''), r.get('FIELD_NAME', ''))
                    for r in parse_inserts(inc_text('GWTM_AMEND_FIELDS'))}
            miss_b = [k for k in expected if k not in gwtb]
            miss_m = [k for k in expected if k not in gwtm]
            for k in miss_b[:15]:
                err('amend', f'{k[1]}.{k[2]} ({expected[k]}) amendable in {k[0]} but not in GWTB_AMEND_FIELDS')
            for k in miss_m[:15]:
                err('amend', f'{k[1]}.{k[2]} ({expected[k]}) amendable in {k[0]} but not in GWTM_AMEND_FIELDS')
            if len(miss_b) > 15 or len(miss_m) > 15:
                err('amend', f'... {max(len(miss_b), len(miss_m)) - 15} more amendable fields missing')
            if not miss_b and not miss_m:
                ok('amend', f'all {len(expected)} amendable fields are in GWTB/GWTM_AMEND_FIELDS')
    else:
        ok('amend', 'no amendable fields in the radxml')

    # ---- LOVs
    lovs = [(l.get('ID') or txt(l, 'LOV_NAME')).upper() for l in m.findall('RAD_LOVS')]
    lov_inc = inc_text('CSTB_LOV_INFO').upper()
    if lovs and not lov_inc:
        err('lov', f'{len(lovs)} LOVs but no CSTB_LOV_INFO INC: tick LOV')
    elif lovs:
        miss = [l for l in lovs if l not in lov_inc]
        for l in miss:
            err('lov', f'LOV {l} not in CSTB_LOV_INFO')
        if not miss:
            ok('lov', f'all {len(lovs)} LOVs in CSTB_LOV_INFO')

    # ---- labels and UIXML for new (CUSTOM-layer) fields
    custom = root.find('RAD_CUSTOM')
    new_fields = []
    if custom is not None:
        for blk in custom.findall('RAD_DATA_BLOCKS'):
            for f in blk.findall('RAD_BLK_FIELDS'):
                if txt(f, 'RELEASE_TYPE').upper() == release and txt(f, 'VISIBLE').upper() != 'N':
                    new_fields.append(txt(f, 'FIELD_NAME').upper())
    lbl_inc = inc_text('CSTB_FIELD_LABELS').upper()
    uix = read(upper[f'UIXML/ENG/{fid}.XML']).upper() if f'UIXML/ENG/{fid}.XML' in upper else ''
    if new_fields:
        if not lbl_inc:
            err('labels', 'CSTB_FIELD_LABELS INC missing: tick Label Details')
        else:
            miss = [f for f in new_fields if f not in lbl_inc]
            for f in miss[:15]:
                warn('labels', f'new field {f} not in CSTB_FIELD_LABELS')
            if not miss:
                ok('labels', f'all {len(new_fields)} new visible fields in CSTB_FIELD_LABELS')
        if uix:
            miss = [f for f in new_fields if f not in uix]
            for f in miss[:15]:
                err('labels', f'new field {f} not in UIXML/ENG/{fid}.xml: regenerate Screen Xml')
            if not miss:
                ok('labels', f'all {len(new_fields)} new visible fields in the UIXML')

    # ---- menu, summary, call forms, pk cols
    if new_function:
        miss = [t for t in MENU_INCS if t not in incs]
        if miss:
            err('menu', f'new function without {", ".join(miss)}: tick Menu (all four are needed to launch it)')
        else:
            ok('menu', 'all four menu INCs present')
    if m.find('RAD_SUMMARY') is not None and len(m.find('RAD_SUMMARY')):
        if 'CSTB_SUMMARY_INFO' in incs:
            ok('summary', 'CSTB_SUMMARY_INFO present')
        else:
            err('summary', 'radxml has a summary but no CSTB_SUMMARY_INFO INC: tick Summary')
    if m.findall('RAD_CALLFORM') and 'CSTB_FID_CALLFORMS' not in incs:
        err('callform', 'radxml has call forms but no CSTB_FID_CALLFORMS INC')
    if 'STTB_AUDIT_PK_COLS' in incs:
        ok('pkcols', 'STTB_AUDIT_PK_COLS present')
    elif new_function:
        err('pkcols', 'STTB_AUDIT_PK_COLS missing: tick Block PK Columns')
    else:
        warn('pkcols', 'STTB_AUDIT_PK_COLS not generated (Block PK Columns not ticked); fine only if the master '
                       'table and its PK did not change')

    # ---- CUSTOM package body
    cust_body = upper.get(f'SQL/{mod}PKS_{fid}_CUSTOM.SQL'.upper()) if mod else None
    if cust_body:
        logic = logic_lines(read(cust_body))
        if len(logic) <= 2:
            warn('stub', f'{cust_body} is ODT\'s empty stub ({len(logic)} logic lines). Compile it only if this '
                         'function has no hand-written CUSTOM code; otherwise compile your own body instead.')
        else:
            ok('stub', f'{cust_body} has {len(logic)} logic lines (hand-written code)')
    cust_spec = upper.get(f'SPC/{mod}PKS_{fid}_CUSTOM.SPC'.upper()) if mod else None
    if body_path:
        body = open(body_path, encoding='utf-8', errors='ignore').read()
        if not cust_spec:
            err('stub', 'no CUSTOM spec in the zip to compare --custom-body with')
        else:
            spec_r = {n.upper() for _, n in ROUTINE.findall(read(cust_spec))}
            body_r = {n.upper() for _, n in ROUTINE.findall(body)}
            pkg = f'{mod}PKS_{fid}_CUSTOM'.upper()
            if pkg not in body.upper():
                err('stub', f'{os.path.basename(body_path)} is not package {pkg}')
            miss = sorted(spec_r - body_r)
            for r in miss:
                err('stub', f'{r} is in the generated CUSTOM spec but not in {os.path.basename(body_path)}')
            if not miss:
                ok('stub', f'{os.path.basename(body_path)} implements all {len(spec_r)} routines of the CUSTOM spec')
            if len(logic_lines(body)) <= 2:
                warn('stub', f'{os.path.basename(body_path)} looks like a stub too')
    return report(zpath)


def report(zpath):
    print(f'check_odt_zip: {zpath}')
    for line in oks + warnings + errors:
        print('  ' + line)
    print(f'{len(errors)} error(s), {len(warnings)} warning(s).',
          'Do not deploy until the errors are fixed.' if errors else 'Zip is complete for this change.')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
