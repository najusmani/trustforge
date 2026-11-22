"""Merge radxml layers the way ODT does on load (RadDeltaHandler_NonIE.js customOnKernel and friends).

Layer order: RAD_KERNEL <- RAD_CLUSTER <- RAD_CUSTOM <- RAD_CUSTOMER.
For each element of a higher layer, matched by tag + ID:
  * not in the lower layer      -> appended
  * already in the lower layer  -> every leaf tag present in the higher node is copied over the lower
                                   node (so an empty leaf BLANKS the kernel value), then child nodes are
                                   merged: new IDs appended, existing IDs replaced as a whole
                                   (HEADER/BODY/FOOTER and RAD_TABS are merged recursively)
  * RAD_FUNC_PREFERENCES, RAD_ACTIONS, RAD_SUMMARY: ODT copies these whole into each layer -> replaced

Library use:  from radxml_merge import merge;  kern = merge(root)   (returns the consolidated layer element)
CLI:          python -I radxml_merge.py <RAD.xml> [out_consolidated.xml]
              prints how many kernel elements/leaf values the higher layers change or remove
              (0 changed = the customization only adds to the kernel).
"""
import copy
import sys
import xml.etree.ElementTree as ET

LAYERS = ['RAD_KERNEL', 'RAD_CLUSTER', 'RAD_CUSTOM', 'RAD_CUSTOMER']
CHILDREN = {'RAD_DATASOURCES': ['RAD_FIELDS'], 'RAD_DATA_BLOCKS': ['RAD_BLK_FIELDS', 'BLK_DATASOURCES'],
            'RAD_SCREENS': ['SCREEN_ARGS', 'HEADER', 'BODY', 'FOOTER'], 'HEADER': ['RAD_TABS'],
            'BODY': ['RAD_TABS'], 'FOOTER': ['RAD_TABS'], 'RAD_TABS': ['RAD_SECTIONS'],
            'RAD_FIELDSETS': ['FIELDSET_FIELDS'], 'RAD_LOVS': ['RAD_LOV_DETAILS']}
RECURSE = {'HEADER', 'BODY', 'FOOTER', 'RAD_TABS'}
WHOLE = {'RAD_FUNC_PREFERENCES', 'RAD_ACTIONS', 'RAD_SUMMARY'}


def _key(e):
    return e.tag, e.get('ID')


def _find(parent, tag, id_):
    for c in parent.findall(tag):
        if c.get('ID') == id_:
            return c
    return None


def _copy_leaves(low, high):
    for ch in high:
        if len(ch) == 0 and ch.get('ID') is None:
            t = low.find(ch.tag)
            if t is None:
                t = ET.SubElement(low, ch.tag)
            t.text = ch.text


def _merge_children(low, high, tag):
    for kind in CHILDREN.get(tag, []):
        for hc in high.findall(kind):
            lc = _find(low, kind, hc.get('ID'))
            if lc is None:
                low.append(copy.deepcopy(hc))
            elif kind in RECURSE:
                _copy_leaves(lc, hc)
                _merge_children(lc, hc, kind)
            else:
                idx = list(low).index(lc)
                low.remove(lc)
                low.insert(idx, copy.deepcopy(hc))


def merge(root):
    """Return a new element holding the consolidated view of all layers of a RAD_FUNCTIONS root."""
    out = ET.Element('RAD_CONSOLIDATED')
    for lay in LAYERS:
        sec = root.find(lay)
        if sec is None:
            continue
        for h in sec:
            low = _find(out, h.tag, h.get('ID'))
            if low is None:
                out.append(copy.deepcopy(h))
            elif h.tag in WHOLE:
                idx = list(out).index(low)
                out.remove(low)
                out.insert(idx, copy.deepcopy(h))
            else:
                _copy_leaves(low, h)
                _merge_children(low, h, h.tag)
    return out


def _flat(e, path=''):
    p = path + '/' + e.tag + ('[' + e.get('ID') + ']' if e.get('ID') else '')
    if len(e) == 0:
        yield p, (e.text or '').strip()
    for c in e:
        yield from _flat(c, p)


def kernel_impact(root):
    """(changed, removed, added) leaf paths of the kernel after merging the higher layers."""
    k = root.find('RAD_KERNEL')
    if k is None or not len(k):
        return [], [], []
    base = dict(_flat(k, ''))
    m = merge(root)
    m.tag = 'RAD_KERNEL'
    after = dict(_flat(m, ''))
    changed = [p for p in base if p in after and after[p] != base[p]]
    removed = [p for p in base if p not in after]
    added = [p for p in after if p not in base]
    return changed, removed, added


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    r = ET.parse(sys.argv[1]).getroot()
    ch, rm, ad = kernel_impact(r)
    print(f'kernel leaf values changed: {len(ch)}  removed: {len(rm)}  added: {len(ad)}')
    for p in ch[:40]:
        print('  CHANGED', p)
    for p in rm[:40]:
        print('  REMOVED', p)
    if len(sys.argv) > 2:
        c = merge(r)
        c.tag = 'RAD_KERNEL'
        new = ET.Element(r.tag)
        for e in r:
            if e.tag not in LAYERS:
                new.append(e)
        new.append(c)
        ET.ElementTree(new).write(sys.argv[2], encoding='utf-8')
        print('consolidated view written:', sys.argv[2])
