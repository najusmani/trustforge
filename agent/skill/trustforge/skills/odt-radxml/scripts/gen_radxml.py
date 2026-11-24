"""Generate an ODT-loadable radxml from a JSON design spec.

Tags, tag order and section layout come from a skeleton (templates/radxml_skeleton_14.7.xml,
or one built from the user's own ODT-saved radxmls with make_skeleton.py), so the output
matches what ODT itself writes. Verified on FCUBS 14.7: ODT loaded the output, saved it and
generated all units; the ODT-saved file matched the generated one except header bookkeeping.

Usage:
  python -I gen_radxml.py <spec.json> <out_RAD.xml> [--skeleton <skeleton.xml>]

Spec keys: UPPER-CASE keys are ODT tag names with their values; lower-case keys are structure
(lists of child elements). Example: ../templates/spec_example_STDCURSK.json
"""
import json
import os
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SKELETON = os.path.join(HERE, '..', 'templates', 'radxml_skeleton_14.7.xml')

# Action list and stage types exactly as ODT writes them for a maintenance function.
ACTIONS = [('QUERY', '2'), ('NEW', '2'), ('MODIFY', '2'), ('AUTHORIZE', '1'), ('DELETE', '1'),
           ('CLOSE', '1'), ('REOPEN', '1'), ('REVERSE', '1'), ('ROLLOVER', '1'), ('CONFIRM', '1'),
           ('LIQUIDATE', '1'), ('SUMMARYQUERY', '2')]

BLK_FIELD_DEFAULTS = {
    'BLOCK_PK_FLD': 'N', 'REQUIRED': 'N', 'DISPLAY_TYPE': 'TEXT', 'POPEDIT_REQUIRED': 'N',
    'INPUT_ONLY_BY_LOV': 'N', 'READ_ONLY': 'N', 'SUBSYSTEM_DEPENDANT': 'N', 'CHECKED': 'N',
    'ITEM_TYPE': 'DBITEM', 'VISIBLE': 'Y', 'CHK_UPPERCASE': 'N', 'NOT_REQD_IN_XSD': 'N',
    'LOV_VAL_REQ': 'Y', 'REPORT_PARAMETER': 'N', 'CALENDAR_TEXT': 'N', 'FORMAT_REQD': 'N',
    'HOTKEYREQ': 'N', 'FOCUSREQ': 'N', 'EXACT_FETCH': 'N', 'HOTKEYREQJA': 'N', 'CHK_TRIM': 'N'}

PREF_DEFAULTS = {'GW_FUNCTION': 'N', 'EXPORT_REQD': 'Y', 'AUTO_AUTH': 'N', 'HO_FUNCTION': 'N',
                 'LOGGING_REQD': 'Y', 'FIELD_LOG_REQD': 'N', 'MULTI_BRANCH_ACCESS': 'N',
                 'ELCM_FUNCTION': 'N', 'MODULE_AUTO_AUTH': 'N', 'TANK_MODIFICATIONS': 'N'}

# Order of element groups inside the release section, as ODT 14.7 saves them.
SECTION_ORDER = ['RAD_FUNC_PREFERENCES', 'RAD_DATASOURCES', 'RAD_SCREENS', 'RAD_DATA_BLOCKS',
                 'RAD_FIELDSETS', 'RAD_LOVS', 'RAD_ACTIONS', 'RAD_SUMMARY', 'RAD_CALLFORM', 'RAD_LAUNCHFORM']


def upper(d):
    return {k: v for k, v in d.items() if k.isupper()}


class Gen:
    def __init__(self, skeleton_path):
        self.sk = ET.parse(skeleton_path).getroot()

    def tmpl(self, path):
        e = self.sk.find(path)
        if e is None:
            raise SystemExit(f'skeleton has no {path}; rebuild it (make_skeleton.py) from a radxml that has one')
        return e

    def make(self, tag, vals, ident=None, rel=None, tmpl=None):
        """New element with the template's leaf tags in order; values from vals, then rel."""
        e = ET.Element(tag)
        if ident is not None:
            e.set('ID', str(ident))
        known = set()
        for c in (tmpl if tmpl is not None else self.tmpl(tag)):
            if len(c):
                continue
            known.add(c.tag)
            v = vals.get(c.tag)
            if v is None and rel and c.tag in rel:
                v = rel[c.tag]
            ET.SubElement(e, c.tag).text = None if v in (None, '') else str(v)
        extra = {k for k in vals if k.isupper()} - known
        if extra:
            raise SystemExit(f'{tag} {ident}: tags not in skeleton: {sorted(extra)}')
        return e

    # ------------------------------------------------------------------ build
    def build(self, spec):
        rt = spec.get('RELEASE_TYPE', 'CUSTOM')
        rel = {'RELEASE_TYPE': rt, 'RELEASE_NAME': spec['RELEASE_CODE']}
        parts = {k: [] for k in SECTION_ORDER}

        root = ET.Element('RAD_FUNCTIONS')
        hdr = {'FUNCTION_TYPE': 'P', 'FUNCTION_ORIGIN': rt, 'ACTION': 'LOAD', 'GEN_ALL': 'Y',
               'HEADER_TEMPLATE': 'NONE', 'CALL_FORM_TYPE': 'DATA', 'LANG_CODE': 'ENG',
               'OPERATION': 'GENERATE', 'PARENT_MODULE_ID': spec['MODULE_ID'],
               'MODIFIED_IN_KERNEL': 'Y' if rt == 'KERNEL' else 'N',
               'MODIFIED_IN_CLUSTER': 'Y' if rt == 'CLUSTER' else 'N',
               'MODIFIED_IN_CUSTOM': 'Y' if rt == 'CUSTOM' else 'N', 'MODIFIED_IN_CUSTOMER': 'N',
               'PARENT_MODIFIED_IN_KERNEL': 'N', 'PARENT_MODIFIED_IN_CLUSTER': 'N',
               'PARENT_MODIFIED_IN_CUSTOM': 'N', 'PARENT_MODIFIED_IN_CUSTOMER': 'N',
               'ORDER_CORRECTION_DONE': 'D', 'DELET_OLDNODES_DONE': 'Y', 'XSD_COMMENTS_DEFAULT': 'D',
               'TEMP_CORRECTION_DONE': 'Y'}
        hdr.update(upper(spec))
        hdr['RELEASE_CODE'] = None  # ODT saves it blank; elements carry the release in RELEASE_NAME
        for c in self.tmpl('HEADER_TAGS'):
            v = hdr.get(c.tag)
            ET.SubElement(root, c.tag).text = None if v in (None, '') else str(v)
        # A function created in a CLUSTER/CUSTOM release is saved by ODT as an empty RAD_KERNEL plus
        # RAD_<release type>. Loadradxml rejects files without RAD_KERNEL ("Non-Ext RAD xml Cannot Be Loaded").
        if rt == 'KERNEL':
            sec = ET.SubElement(root, 'RAD_KERNEL')
        else:
            ET.SubElement(root, 'RAD_KERNEL')
            sec = ET.SubElement(root, 'RAD_' + rt)

        blocks = spec['blocks']
        fs_of = {}
        for fs in spec.get('fieldsets', []):
            for f in fs['fields']:
                fs_of[(fs['FIELDSET_BLOCK'], f)] = fs['FIELDSET_NAME']

        # preferences + menu
        pv = {**PREF_DEFAULTS, 'MODULE_ID': spec['MODULE_ID'], 'MODULE_DESC': spec.get('MODULE_DESC'),
              **spec.get('preferences', {})}
        pref = self.make('RAD_FUNC_PREFERENCES', pv, 'MENU')
        for m in spec['menu']:
            mv = {'FUNC_MODULE_ID': spec['MODULE_ID'], 'FUNC_MODULE_DESC': spec.get('MODULE_DESC'),
                  'CONTROL_STRING': spec.get('CONTROL_STRING', '1111111100000000'), **m}
            pref.append(self.make('MENU_DETAILS', mv, m['FUNCTION_ID']))
        parts['RAD_FUNC_PREFERENCES'].append(pref)

        # data sources; columns derived from block fields whose DBT is the data source
        for ds in spec['datasources']:
            name = ds['DATASRC_NAME']
            vals = {'IS_MANDATORY': 'N', 'DATASRC_TYPE': 'NORMAL', 'CHILD_DATASRC': 'N', 'MULTI_RECORD': 'N',
                    'MASTER_DATASRC': 'N', 'RELATION_TYPE': '1', **upper(ds)}
            d = self.make('RAD_DATASOURCES', vals, name, rel)
            seen = set()
            for b in blocks:
                for f in b['fields']:
                    if f.get('DBT') != name or f['DBC'] in seen:
                        continue
                    seen.add(f['DBC'])
                    col = self.make('RAD_FIELDS', {
                        'COLUMN_NAME': f['DBC'], 'DATATYPE': f.get('DATATYPE'), 'MAX_LENGTH': f.get('MAX_LENGTH'),
                        'BLOCK_NAME': b['BLOCK_NAME'], 'DBC': f['DBC'], 'FIELD_NAME': f['FIELD_NAME'],
                        'NOT_REQD_IN_UPLOAD_PKGS': 'N', 'MAX_DECIMALS': f.get('MAX_DECIMALS')}, f['DBC'], rel)
                    # columns sit before the trailing upload-table tags
                    idx = next((i for i, c in enumerate(d) if c.tag == 'UPLOAD_TABLE'), len(d))
                    d.insert(idx, col)
            parts['RAD_DATASOURCES'].append(d)

        for s in spec['screens']:
            parts['RAD_SCREENS'].append(self.screen(s, rel))

        # data blocks
        for order, b in enumerate(blocks, 1):
            bv = {'BLOCK_TYPE': 'NORMAL', 'MULTI_RECORD': 'N', 'MASTER_BLOCK': 'N', 'RELATION_TYPE': '1',
                  'DATA_BLK_ORDER': order, **upper(b)}
            e = self.make('RAD_DATA_BLOCKS', bv, b['BLOCK_NAME'], rel)
            for ds in b['datasources']:
                e.append(self.make('BLK_DATASOURCES', {'DATASOURCE_NAME': ds}, ds))
            for fo, f in enumerate(b['fields'], 1):
                fv = {**BLK_FIELD_DEFAULTS, 'XSD_TAG': f['FIELD_NAME'], 'LABEL_CODE': 'LBL_' + f['FIELD_NAME'],
                      'BLK_FIELD_ORDER': fo, 'FIELDSET_NAME': fs_of.get((b['BLOCK_NAME'], f['FIELD_NAME'])),
                      **upper(f)}
                fe = self.make('RAD_BLK_FIELDS', fv, f['FIELD_NAME'], rel)
                for x in f.get('bind_vars', []):
                    fe.append(self.make('RAD_BIND_VARS', x, x['BIND_VAR_NAME']))
                for x in f.get('return_fields', []):
                    fe.append(self.make('RAD_RETURN_FIELDS', x, x['QUERY_COLUMN']))
                for pos, x in enumerate(f.get('custom_attrs', []), 1):
                    fe.append(self.make('RAD_FIELD_CUSTOM_ATTRS', {'ATTR_POSITION': pos, 'ACTIVE': 'Y', **x},
                                        x['ATTR_NAME'], rel))
                for x in f.get('events', []):
                    fe.append(self.make('RAD_FIELD_EVENTS', x, x.get('EVENT_NAME'), rel))
                e.append(fe)
            parts['RAD_DATA_BLOCKS'].append(e)

        # field sets
        for order, fs in enumerate(spec.get('fieldsets', []), 1):
            fv = {'NAV_BTN_FULL_WIDTH': 'N', 'FIELDSET_READ_ONLY': 'N', 'FIELDSET_PORTION': 'BODY',
                  'VIEW_TYPE': 'SINGLE', 'HORIZONTAL_FIELDSET': 'N', 'MULTI_RECORD': 'N', 'NAV_BUTTONS_REQ': 'N',
                  'FIELDSET_VISIBLE': 'Y', 'FIELDSET_ORDER': order, 'FIELDSET_IMAGE': 'N', 'FIELDSET_TYPE': 'Normal',
                  **upper(fs)}
            e = self.make('RAD_FIELDSETS', fv, fs['FIELDSET_NAME'], rel)
            for i, f in enumerate(fs['fields'], 1):
                e.append(self.make('FIELDSET_FIELDS', {'FIELD_NAME': f, 'ACTIVE': 'Y', 'FIELD_ORDER': i}, f, rel))
            parts['RAD_FIELDSETS'].append(e)

        # LOVs
        for lv in spec.get('lovs', []):
            e = self.make('RAD_LOVS', {'LOV_STATUS': 'I', **upper(lv)}, lv['LOV_NAME'], rel)
            for ci, col in enumerate(lv['columns']):
                # lesson L11: only the first (code) column is a search field by default. A search field on a nullable
                # description column (LIKE '%') hides every row whose description is NULL.
                det = self.make('RAD_LOV_DETAILS', {'DATATYPE': 'VARCHAR2', 'VISIBLE': 'Y', 'REDN_FLD_TYPE': 'TEXT',
                                                    'REDN_FLD_FLAG': 'Y' if ci == 0 else 'N', 'IS_INDEXED': 'N', **col},
                                col['QUERY_COLS'])
                # LOV details sit before LOV_STATUS
                idx = next((i for i, c in enumerate(e) if c.tag == 'LOV_STATUS'), len(e))
                idx = max(idx, max((i + 1 for i, c in enumerate(e) if c.tag == 'RAD_LOV_DETAILS'), default=idx))
                e.insert(idx, det)
            parts['RAD_LOVS'].append(e)

        # actions
        ws = spec.get('web_service', {})
        acts = self.make('RAD_ACTIONS', {'REST_CACHE_ENABLED': 'N', 'REST_MICRO_ENABLED': 'N', 'REST_ENABLED': 'N',
                                         **upper(ws)})
        ops = ws.get('operations', {})
        for code, stage in ACTIONS:
            op = ops.get(code)
            acts.append(self.make('RAD_ACTION', {'ACTION_CODE': code, 'OPERATION_CODE': op,
                                                 'WEBSERVICE_APPLICABLE': 'Y' if op else 'N',
                                                 'ACTION_STAGE_TYPE': stage, 'REST_OPERATION_ENABLED': 'N'}, code))
        parts['RAD_ACTIONS'].append(acts)

        # summary
        if spec.get('summary'):
            sm = spec['summary']
            e = self.make('RAD_SUMMARY', {'SUMMARY_WEBSERVICE_REQD': 'N', 'NUMBER_OF_ROWS': '1', 'SUMMARY_TYPE': 'S',
                                          'BLIND_SEARCH': 'N', **upper(sm)}, 'SUMMARY')
            for f in sm['fields']:
                e.append(self.make('SUMMARY_DETAILS', {'LOV_QUERY_REQ': 'N', **f}, f['FIELD_NAME']))
            parts['RAD_SUMMARY'].append(e)

        # call forms / launch forms (values as given; see reference/27-radxml-format.md)
        for cf in spec.get('callforms', []):
            parts['RAD_CALLFORM'].append(self.make('RAD_CALLFORM', {'CALLFORM_ACTIVE': 'Y', **cf},
                                                   cf['CALLFORM_FUCNTIONID'], rel))
        for lf in spec.get('launchforms', []):
            parts['RAD_LAUNCHFORM'].append(self.make('RAD_LAUNCHFORM', {'LAUNCHFORM_ACTIVE': 'Y', 'FORM_TYPE': 'LF',
                                                                        **lf}, lf['LAUNCHFORM_FUCNTIONID'], rel))

        for k in SECTION_ORDER:
            for e in parts[k]:
                sec.append(e)
        return root

    # ------------------------------------------------------------------ screens
    def screen(self, s, rel):
        name = s['SCREEN_NAME']
        sv = {'SCREEN_POSITION': 'TEMPLATE', 'EXIT_BUTTON_TYPE': '1', 'MAIN_SCREEN': 'N', 'SCREEN_SIZE': 'LARGE',
              'SCREEN_VISIBLE': 'Y', 'SCREEN_OBIEE': 'N', 'SCREEN_QUERYREQ': 'Y', 'IMGFLD_QUERYREQ': 'N', **upper(s)}
        e = self.make('RAD_SCREENS', sv, name, rel)
        tabs = {'HEADER': s.get('header_tabs') or [{'TAB_NAME': 'TAB_HEADER'}],
                'BODY': s['body_tabs'],
                'FOOTER': s.get('footer_tabs') or [{'TAB_NAME': 'TAB_FOOTER'}]}
        # portion values as ODT 14.7 saves them
        pvals = {'HEADER': {'TAB_VISIBLE': 'Y', 'TAB_TYPE': 'SERVICE'},
                 'BODY': {'TAB_VISIBLE': 'Y', 'TAB_TYPE': 'SERVICE', **rel},
                 'FOOTER': {}}
        idx = 0
        for portion in ('HEADER', 'BODY', 'FOOTER'):
            pt = self.tmpl('PORTION_TAGS/' + portion)
            p = self.make(portion, pvals[portion], portion, tmpl=pt)
            tab_t = pt.find('RAD_TABS')
            for order, t in enumerate(tabs[portion], 1):
                if portion != 'FOOTER':
                    idx += 1
                tv = {'TAB_TYPE': 'DATA', 'SCREEN_NAME': name, 'TAB_INDEX': idx if portion != 'FOOTER' else None,
                      'TAB_VISIBLE': 'Y', 'TAB_ORDER': order, **upper(t)}
                tv = {k: v for k, v in tv.items() if tab_t.find(k) is not None or k in upper(t)}
                te = self.make('RAD_TABS', tv, t['TAB_NAME'], rel, tmpl=tab_t)
                for so, sc in enumerate(t.get('sections', []), 1):
                    scv = {'SCREEN_PORTION': portion, 'TAB_NAME': t['TAB_NAME'], 'SEC_ORDER': so, 'SEC_VISIBLE': 'Y',
                           'COLLAPSE': 'N', 'MULTIPLE_SEC': 'N', **upper(sc)}
                    se = self.make('RAD_SECTIONS', scv, sc['SECTION_NAME'], rel)
                    for pi, (pname, width) in enumerate(sc['partitions'], 1):
                        se.append(self.make('RAD_PARTITIONS', {'PARTITION_SL_NO': pi, 'PARTITION_NAME': pname,
                                                               'PARTITION_WIDTH': width}, pi, rel))
                    te.append(se)
                p.append(te)
            e.append(p)
        return e


def main():
    args = sys.argv[1:]
    skeleton = DEFAULT_SKELETON
    if '--skeleton' in args:
        i = args.index('--skeleton')
        skeleton = args[i + 1]
        del args[i:i + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    spec_path, out = args
    with open(spec_path, encoding='utf-8') as fh:
        spec = json.load(fh)
    root = Gen(skeleton).build(spec)
    ET.indent(root, space='\t')
    xml = ET.tostring(root, encoding='unicode')
    with open(out, 'w', encoding='utf-8', newline='\r\n') as fh:  # ODT writes CRLF and no XML declaration
        fh.write(xml)
    print('written', out)


if __name__ == '__main__':
    main()
