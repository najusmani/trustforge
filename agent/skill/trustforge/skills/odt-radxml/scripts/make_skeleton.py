"""Build a blank radxml tag skeleton from one or more ODT-saved radxmls.

For every element type the FIRST file that contains it wins (first instance in that file),
so pass the most recent, cleanest ODT save first (ideally a function ODT itself saved as NEW
in this ODT version) and older/larger radxmls after it to fill in element types it lacks
(bind variables, button events, call forms, launch forms ...). All values are blanked.

Usage: python -I make_skeleton.py <out_skeleton.xml> <ODT_saved_RAD.xml> [more_RAD.xml ...]
"""
import sys
import xml.etree.ElementTree as ET

TYPES = ['RAD_DATASOURCES', 'RAD_FIELDS', 'RAD_SCREENS', 'RAD_SECTIONS', 'RAD_PARTITIONS',
         'RAD_LOVS', 'RAD_LOV_DETAILS', 'RAD_SUMMARY', 'SUMMARY_DETAILS', 'RAD_ACTIONS', 'RAD_ACTION',
         'RAD_FUNC_PREFERENCES', 'MENU_DETAILS', 'RAD_DATA_BLOCKS', 'BLK_DATASOURCES', 'RAD_BLK_FIELDS',
         'RAD_RETURN_FIELDS', 'RAD_BIND_VARS', 'RAD_FIELD_CUSTOM_ATTRS', 'RAD_FIELD_EVENTS',
         'RAD_FIELDSETS', 'FIELDSET_FIELDS', 'RAD_CALLFORM', 'RAD_LAUNCHFORM']


def blank(e):
    out = ET.Element(e.tag)
    for c in e:
        if len(c) == 0:
            ET.SubElement(out, c.tag)
    return out


def main(dst, sources):
    roots = [(s, ET.parse(s).getroot()) for s in sources]
    import os
    sk = ET.Element('RADXML_SKELETON', {'sources': ' | '.join(os.path.basename(s) for s in sources)})
    # header: root leaf tags (RAD_KERNEL is written by the generator)
    hdr = ET.SubElement(sk, 'HEADER_TAGS')
    for c in roots[0][1]:
        if len(c) == 0 and not c.tag.startswith('RAD_'):
            ET.SubElement(hdr, c.tag)
    # portions: leaf tags of HEADER/BODY/FOOTER plus the tab template used in each
    port = None
    for src, r in roots:
        scr = next((s for s in r.iter('RAD_SCREENS') if s.find('BODY/RAD_TABS/RAD_SECTIONS') is not None), None)
        if scr is None:
            continue
        port = ET.SubElement(sk, 'PORTION_TAGS')
        for pname in ('HEADER', 'BODY', 'FOOTER'):
            p = scr.find(pname)
            pe = blank(p) if p is not None else ET.Element(pname)
            tab = p.find('RAD_TABS') if p is not None else None
            if tab is not None:
                pe.append(blank(tab))
            port.append(pe)
        break
    missing = []
    for t in TYPES:
        for src, r in roots:
            e = next(r.iter(t), None)
            if e is not None:
                sk.append(blank(e))
                break
        else:
            missing.append(t)
    ET.indent(sk, space='\t')
    ET.ElementTree(sk).write(dst, encoding='utf-8')
    print('skeleton written:', dst)
    if port is None:
        print('WARNING: no screen with BODY/RAD_TABS/RAD_SECTIONS found')
    if missing:
        print('not present in any source (generator cannot emit these):', ', '.join(missing))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2:])
