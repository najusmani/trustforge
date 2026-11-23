"""Check a radxml in ODT 14.7 format (as saved by ODT or written by gen_radxml.py).

Checks the load gate ODT applies (RadLoadandGen.js Loadradxml), the release layout, and
cross references inside the release section(s): block <-> data source columns, field sets,
LOVs and their return fields, DESC parent fields, summary fields, menu, naming rules.

Usage: python -I check_radxml.py <FID>_RAD.xml
Exit code 1 when errors are found.
"""
import os
import re
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from radxml_merge import merge, kernel_impact  # noqa: E402

path = sys.argv[1]
raw = open(path, encoding='utf-8', errors='replace').read()
errs, warns = [], []

# ---- ODT load gate (Loadradxml)
if 'RAD_FUNCTIONS' not in raw:
    errs.append('no RAD_FUNCTIONS: ODT says "Load Valid RAD xml File"')
if 'RAD_KERNEL' not in raw:
    errs.append('no RAD_KERNEL node: ODT says "Non-Ext RAD xml Cannot Be Loaded" (add an empty <RAD_KERNEL/>)')
for bad, msg in (('RAD_NOTIFICATIONS', 'Notification RAD xml'), ('RAD_PURGE', 'Purge RAD xml')):
    if bad in raw:
        warns.append(f'{bad} present: ODT refuses to load a {msg} in Function Generation')

root = ET.fromstring(raw)
origin = root.findtext('FUNCTION_ORIGIN')
fid = root.findtext('FUNCTION_ID') or ''
for t in ('FUNCTION_ID', 'FUNCTION_TYPE', 'FUNCTION_CATEGORY', 'FUNCTION_ORIGIN', 'PARENT_FUNC_ID', 'RELEASE_TYPE'):
    if root.find(t) is None:
        errs.append(f'header tag {t} missing: ODT says "Some Header Tags are Missing"')
if len(fid) != 8:
    warns.append(f'function id {fid!r} is not 8 characters')
elif fid[2] not in 'DCRSNG':
    warns.append(f'function id {fid}: 3rd char {fid[2]!r} is not D/C/R/S/N/G')

layers = [c for c in root if c.tag in ('RAD_KERNEL', 'RAD_CLUSTER', 'RAD_CUSTOM', 'RAD_CUSTOMER')]
if origin in ('CLUSTER', 'CUSTOM') and root.find('RAD_' + origin) is None:
    errs.append(f'FUNCTION_ORIGIN {origin} but no RAD_{origin} section')
if origin in ('CLUSTER', 'CUSTOM'):
    k = root.find('RAD_KERNEL')
    if k is not None and len(k):
        warns.append(f'FUNCTION_ORIGIN {origin} but RAD_KERNEL is not empty (ODT saves it empty for new functions)')

# consolidated view, merged the way ODT merges layers on load (radxml_merge.py)
cons = merge(root)
if origin == 'KERNEL' and root.find('RAD_KERNEL') is not None and len(layers) > 1:
    ch, rm, _ = kernel_impact(root)
    for p in ch[:20]:
        warns.append(f'higher layer changes kernel value {p} (an empty leaf in a repeated node blanks the kernel value)')
    for p in rm[:20]:
        warns.append(f'higher layer removes kernel element {p}')


def all_of(tag):
    return cons.findall(tag)


ds = {d.get('ID'): d for d in all_of('RAD_DATASOURCES')}
blocks = {b.get('ID'): b for b in all_of('RAD_DATA_BLOCKS')}
bfields = {bn: {f.get('ID'): f for f in b.findall('RAD_BLK_FIELDS')} for bn, b in blocks.items()}
lovs = {l.get('ID'): l for l in all_of('RAD_LOVS')}
global_lovs = {l.get('ID'): l for l in all_of('RAD_GLOBAL_LOVS')}
fsets = all_of('RAD_FIELDSETS')
screens = {s.get('ID'): s for s in all_of('RAD_SCREENS')}

# ---- data sources
masters = [n for n, d in ds.items() if d.findtext('MASTER_DATASRC') == 'Y']
if len(masters) != 1:
    errs.append(f'exactly one master data source expected, found {masters}')
for n, d in ds.items():
    if not re.match(r'^[A-Z0-9]{4}S?_', n):
        warns.append(f'data source {n}: expected the synonym form XXXXS_... ')
    if d.findtext('MASTER_DATASRC') != 'Y':
        if not d.findtext('PARENT_DATASRC'):
            errs.append(f'data source {n}: no parent')
        rel = d.findtext('RELATION_WITH_PARENT') or ''
        if d.findtext('PARENT_DATASRC') and d.findtext('PARENT_DATASRC') + '.' not in rel:
            warns.append(f'data source {n}: relation does not reference parent {d.findtext("PARENT_DATASRC")}')
    pkc = (d.findtext('PK_COLS') or '').split('~')
    pkt = (d.findtext('PK_TYPES') or '').split('~')
    if len(pkc) != len(pkt):
        errs.append(f'data source {n}: PK_COLS/PK_TYPES count differ')
    dsf = {c.get('ID') for c in d.findall('RAD_FIELDS')}
    for col in filter(None, pkc):
        if col not in dsf:
            errs.append(f'data source {n}: PK column {col} is not a data source field '
                        f'(ODT save RD-VALS-027; map it to a block field, hidden if needed)')
    for col in d.findall('RAD_FIELDS'):
        b, f = col.findtext('BLOCK_NAME'), col.findtext('FIELD_NAME')
        if b and f not in bfields.get(b, {}):
            warns.append(f'data source {n}.{col.get("ID")} maps to missing field {b}.{f}')

# ---- blocks
mblocks = [n for n, b in blocks.items() if b.findtext('MASTER_BLOCK') == 'Y']
if len(mblocks) != 1:
    errs.append(f'exactly one master block expected, found {mblocks}')
in_fs = {}
for fs in fsets:
    b = fs.findtext('FIELDSET_BLOCK')
    if b not in blocks:
        (errs if b and fs.findtext('FIELDSET_VISIBLE') != 'N' else warns).append(f'field set {fs.get("ID")}: block {b!r} missing')
    scr = fs.findtext('FIELDSET_SCREEN')
    if scr and scr not in screens:
        errs.append(f'field set {fs.get("ID")}: screen {scr} missing')
    for f in fs.findall('FIELDSET_FIELDS'):
        fn = f.findtext('FIELD_NAME')
        if fn not in bfields.get(b, {}):
            errs.append(f'field set {fs.get("ID")}: field {fn} not in {b}')
        if f.findtext('ACTIVE') != 'N' and fs.findtext('FIELDSET_VISIBLE') != 'N':
            if (b, fn) in in_fs:
                warns.append(f'{b}.{fn} in two visible field sets ({in_fs[(b, fn)]}, {fs.get("ID")})')
            in_fs[(b, fn)] = fs.get('ID')

AUDIT = {'MAKER', 'MAKERSTAMP', 'CHECKER', 'CHECKERSTAMP', 'MODNO', 'RECSTAT', 'ONCEAUTH', 'AUTHSTAT'}
for bn, b in blocks.items():
    if not bn.startswith('BLK_'):
        errs.append(f'block {bn} must start with BLK_')
    par = b.findtext('BLOCK_PARENT')
    if par and par not in blocks:
        errs.append(f'block {bn}: parent {par} missing')
    for d in b.findall('BLK_DATASOURCES'):
        if d.get('ID') not in ds:
            errs.append(f'block {bn}: data source {d.get("ID")} missing')
    for pk in filter(None, (b.findtext('BLK_PK_FLD') or '').split('~')):
        if pk not in bfields[bn]:
            errs.append(f'block {bn}: PK field {pk} missing')
    tags = {}
    for fn, f in bfields[bn].items():
        t = f.findtext('XSD_TAG')
        if t:
            if t in tags:
                cur = root.findtext('RELEASE_TYPE')
                new = cur in (f.findtext('RELEASE_TYPE'), bfields[bn][tags[t]].findtext('RELEASE_TYPE'))
                (errs if new else warns).append(
                    f'{bn}: fields {tags[t]} and {fn} share XSD tag {t} (ODT save RD-VALS-60'
                    + (')' if new else '; both from an earlier release, ODT tolerates it)'))
            tags[t] = fn
    for fn, f in bfields[bn].items():
        if '_' in fn:
            warns.append(f'{bn}.{fn}: field names should not contain "_"')
        if fn in AUDIT and root.findtext('FOOTER_TEMPLATE') == 'MAINTAUDIT':
            errs.append(f'{bn}.{fn}: audit fields are added by the MAINTAUDIT template; do not define them')
        it = f.findtext('ITEM_TYPE')
        dbt = f.findtext('DBT')
        if it == 'DBITEM':
            if dbt not in ds:
                errs.append(f'{bn}.{fn}: DBT {dbt} is not a data source')
            elif f.findtext('DBC') not in {c.get('ID') for c in ds[dbt].findall('RAD_FIELDS')}:
                errs.append(f'{bn}.{fn}: column {dbt}.{f.findtext("DBC")} not in data source')
        if it == 'DESC':
            pf = f.findtext('PARENT_FIELD')
            if pf not in bfields[bn]:
                warns.append(f'{bn}.{fn}: DESC parent field {pf} missing')
            else:
                rets = {(r.findtext('RETURN_BLK_NAME'), r.findtext('RETURN_FLD_NAME'))
                        for r in bfields[bn][pf].findall('RAD_RETURN_FIELDS')}
                if (bn, fn) not in rets:
                    warns.append(f'{bn}.{fn}: DESC field is not a return field of parent {pf}\'s LOV')
        lv = f.findtext('LOV_NAME')
        if lv:
            if lv in global_lovs:
                pass  # function-level copy of a global LOV
            elif lv not in lovs:
                errs.append(f'{bn}.{fn}: LOV {lv} missing')
            else:
                cols = {c.get('ID') for c in lovs[lv].findall('RAD_LOV_DETAILS')}
                for r in f.findall('RAD_RETURN_FIELDS'):
                    if r.findtext('QUERY_COLUMN') not in cols:
                        errs.append(f'{bn}.{fn}: return column {r.findtext("QUERY_COLUMN")} not in {lv}')
                nb = lovs[lv].findtext('LOV_QUERY', '').count('?')
                if nb != len(f.findall('RAD_BIND_VARS')):
                    warns.append(f'{bn}.{fn}: {lv} has {nb} bind(s) but field maps {len(f.findall("RAD_BIND_VARS"))}')
        for r in f.findall('RAD_RETURN_FIELDS'):
            if not r.findtext('RETURN_FLD_NAME'):
                continue  # column not returned to any field: allowed
            if r.findtext('RETURN_FLD_NAME') not in bfields.get(r.findtext('RETURN_BLK_NAME'), {}):
                errs.append(f'{bn}.{fn}: return target {r.findtext("RETURN_BLK_NAME")}.{r.findtext("RETURN_FLD_NAME")} missing')
        if f.findtext('DISPLAY_TYPE') in ('SELECT', 'RADIO', 'CHECKBOX') and not f.findall('RAD_FIELD_CUSTOM_ATTRS'):
            warns.append(f'{bn}.{fn}: {f.findtext("DISPLAY_TYPE")} without custom attributes')
        if f.findtext('DISPLAY_TYPE') == 'AMOUNT' and not f.findtext('RELATED_FIELD'):
            warns.append(f'{bn}.{fn}: AMOUNT field needs RELATED_BLOCK/RELATED_FIELD (currency)')
        if (bn, fn) not in in_fs:
            warns.append(f'{bn}.{fn} is not in any visible field set (it will not be in the HTML)')

# ---- LOVs
for n, l in lovs.items():
    if not n.startswith('LOV_'):
        warns.append(f'LOV {n} must start with LOV_')
    q = (l.findtext('LOV_QUERY') or '').upper()
    if ' ORDER BY ' in q:
        warns.append(f'LOV {n}: avoid ORDER BY in LOV queries')
    for c in l.findall('RAD_LOV_DETAILS'):
        if not c.findtext('COL_HEADING'):
            warns.append(f'LOV {n}.{c.get("ID")}: column heading label missing')

# ---- OBPM (Oracle Banking Payments) screens: OBPM's own tables, not the FCUBS ones (reference 30, 4.1)
module = (root.findtext('.//MODULE_ID') or '').upper()
if module in ('PM', 'PX'):
    obpm_tables = (
        (r'\bCYTMS?_CCY_DEFN\b', 'CYTM_CCY_DEFN_MASTER (OBPM currency table)'),
        (r'\bSTTMS?_CUSTOMER\b', 'STTM_CORE_CUSTOMER (OBPM customer table; category = customer service model)'),
        (r'\bSTTMS?_CUSTOMER_CAT\b', 'PMTM_CUST_SERVICE_MODEL (OBPM customer category = customer service model)'),
    )
    for n, l in lovs.items():
        q = (l.findtext('LOV_QUERY') or '').upper()
        for pat, use in obpm_tables:
            if re.search(pat, q):
                warns.append(f'LOV {n}: OBPM module {module} - FCUBS table in the query, use {use}')

# ---- screens
mains = [n for n, s in screens.items() if s.findtext('MAIN_SCREEN') == 'Y']
if len(mains) != 1:
    errs.append(f'exactly one main screen expected, found {mains}')
for n, s in screens.items():
    for p in ('HEADER', 'BODY', 'FOOTER'):
        if s.find(p) is None:
            errs.append(f'screen {n}: {p} portion missing')
    for sec in s.iter('RAD_SECTIONS'):
        parts = sec.findall('RAD_PARTITIONS')
        lim = 2 if s.findtext('SCREEN_SIZE') in ('SMALL', 'MEDIUM') else 3
        if len(parts) > lim:
            errs.append(f'screen {n} section {sec.get("ID")}: {len(parts)} partitions (max {lim})')
    for fs in fsets:
        if fs.findtext('FIELDSET_SCREEN') != n or fs.findtext('FIELDSET_VISIBLE') == 'N':
            continue
        port = s.find(fs.findtext('FIELDSET_PORTION') or '')
        tab = port.find(f'RAD_TABS[@ID="{fs.findtext("FIELDSET_TAB")}"]') if port is not None else None
        sec = tab.find(f'RAD_SECTIONS[@ID="{fs.findtext("FIELDSET_SECTION")}"]') if tab is not None else None
        if not (fs.findtext('FIELDSET_TAB') and fs.findtext('FIELDSET_SECTION')):
            warns.append(f'field set {fs.get("ID")}: not placed on a tab/section (not shown on {n})')
        elif sec is None:
            errs.append(f'field set {fs.get("ID")}: {fs.findtext("FIELDSET_PORTION")}/{fs.findtext("FIELDSET_TAB")}/'
                        f'{fs.findtext("FIELDSET_SECTION")} not found on {n}')
        elif fs.findtext('FIELDSET_PARTITION') not in {p.findtext('PARTITION_NAME') for p in sec.findall('RAD_PARTITIONS')}:
            errs.append(f'field set {fs.get("ID")}: partition {fs.findtext("FIELDSET_PARTITION")} not in section')

# ---- summary
for sm in all_of('RAD_SUMMARY'):
    blk = sm.findtext('RSLT_DATABLK')
    if blk not in blocks:
        errs.append(f'summary block {blk} missing')
    q = [d for d in sm.findall('SUMMARY_DETAILS') if d.findtext('QUERY') == 'Y']
    if len(q) > 12:
        warns.append(f'summary has {len(q)} query fields (guide max 12)')
    for d in sm.findall('SUMMARY_DETAILS'):
        if d.findtext('FIELD_NAME') not in bfields.get(blk, {}):
            errs.append(f'summary field {d.findtext("FIELD_NAME")} not in {blk}')

# ---- preferences / menu
prefs = all_of('RAD_FUNC_PREFERENCES')
if not prefs:
    errs.append('RAD_FUNC_PREFERENCES missing')
else:
    menu = {m.get('ID') for m in prefs[-1].findall('MENU_DETAILS')}
    if fid not in menu:
        errs.append(f'menu row for {fid} missing')
    if root.findtext('FUNCTION_CATEGORY') == 'MAINTENANCE':
        cs = [m.findtext('CONTROL_STRING') for m in prefs[-1].findall('MENU_DETAILS')]
        if any(c and len(c) != 16 for c in cs):
            warns.append('CONTROL_STRING should be 16 characters')

# ---- amendables need the Actions node in the layer being generated (lesson L1)
# ODT generates the amendable INCs (GWTM_/GWTB_AMEND_*) from the RAD_ACTIONS of the release being generated. A higher
# layer that adds amendable fields but has no RAD_ACTIONS of its own gets NO amend INCs, even with Amendable ticked,
# and Modify then fails with ST-AMND-002 on every new field.
release = (root.findtext('RELEASE_TYPE') or '').strip()
top = root.find('RAD_' + release) if release in ('CLUSTER', 'CUSTOM', 'CUSTOMER') else None
if top is not None and origin != release:
    new_amend = [f.get('ID') for b in top.findall('RAD_DATA_BLOCKS') for f in b.findall('RAD_BLK_FIELDS')
                 if (f.findtext('AMENDABLE_IN') or '').strip() and (f.findtext('DBT') or '').strip()]
    if new_amend and top.find('RAD_ACTIONS') is None:
        errs.append(f'RAD_{release} adds {len(new_amend)} amendable field(s) ({", ".join(new_amend[:3])}...) but has no '
                    f'RAD_ACTIONS: ODT will not generate the amendable INCs and Modify fails with ST-AMND-002. Copy the '
                    f'kernel RAD_ACTIONS whole into RAD_{release} (or open Actions in ODT in this release and Save).')

print(f'file: {path}')
print(f'function {fid}  origin {origin}  layers {[l.tag for l in layers]}')
print('blocks:', {k: sorted(v) for k, v in bfields.items()})
print('errors:', 'none' if not errs else '')
for e in errs:
    print('  ERROR', e)
for w in warns:
    print('  warn ', w)
sys.exit(1 if errs else 0)
