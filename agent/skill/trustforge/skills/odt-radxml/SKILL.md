---
name: odt-radxml
description: Design, edit and review FLEXCUBE ODT radxml (<FUNCTION_ID>_RAD.xml) screen definitions - data sources, blocks, fields, screens/tabs/sections/partitions, field sets, LOVs, call/launch forms, actions, summary, preferences. Use when designing a new FLEXCUBE screen, customizing an existing radxml, producing ODT click-by-click steps, or reviewing a radxml against ODT rules.
---

# Radxml design, edit and review

Reference: `../../reference/04-screen-development-core.md` (primary), plus the category file (13 maintenance, 14 online, 15 call form, 16 launch/others, 17 report, 18 dashboard, 12 child/screen child, 22 LOV high volume, 23 upload).

## A. Designing (new screen or new elements)

Work in ODT's order and produce a design table for each step:

1. **Header** - Function Id (8 chars; module + D/C/R/N), Function Type, Category, Header/Footer template (Maintenance: Maint Audit; Online: NONE with manual TXNSTAT/AUTHSTAT footer, or PROCESS for process flow).
2. **Preferences** - module, flags (HO, logging, auto auth, tank, field log, excel export, multi-branch + txn block/field), menu rows (detail + summary + gateway ids), control string (no REVERSE/ROLLOVER/CONFIRM/LIQUIDATE/HOLD for maintenance), menu labels `LBL_<FID>_MAIN_MENU`, `_SUB_MENU_1`, `_SUB_MENU_2`, `_DESC`.
3. **Data sources** - table, alias, master, parent, relation (parent first, `=` only), relation type, multi record, PK cols/types `~`, where/order by (no keywords), type (Normal/Query/InOnly/Summary), mandatory, upload table; columns + max length.
4. **Blocks** - `BLK_` name without table name, parent, XSD node (name minus BLK_, `_`->`-`), multi record, PK fields, relation type, master, type, data sources attached; fields: name (no `_`, not column name), label `LBL_<XSDTAG>`, display type, item type (DATABASE/CONTROL/DESC), LOV, related block/field for amounts, required, visible, read only, max/min, custom attributes, events.
5. **Screens** - `CVS_` name, main, size, exit button type, args; tabs (`TAB_`), sections (`SEC_`), partitions within limits (large: body/header 3, footer 4; medium/small 2).
6. **Field sets** - `FST_` name, block, placement (screen/portion/tab/section/partition), view type, rows, horizontal, read only, ordered fields.
7. **Call/launch forms** - function id, parent block, relation (1:1), screen, display type, screen args, dependent fields/services.
8. **LOVs** - `LOV_` name, query with `?`, columns, reduction fields + labels, mandatory/min chars (>=3), binds (in order) and return fields.
9. **Summary** - block, data source, type, where/order, result fields, query fields (max 12), custom buttons; add summary function id to menu.
10. **Actions** - XSD type identifier, service, operation id, action codes, operation codes, amendables per action (all records/new/delete/mandatory), REST flag/service if needed.

Always also write `odt-steps.md`: numbered click-by-click steps in ODT (node -> right-click Add -> field values -> Save), so the user can reproduce the change in the tool even if the radxml edit is not used.

## B. Generating a NEW function's radxml (verified: loads in ODT 14.7 first time)

Format facts: `../../reference/27-radxml-format.md`. Tools in `scripts/` (run with `python -I`):

1. Write a spec JSON from the design (copy `templates/spec_example_STDCURSK.json`). Upper-case keys are ODT tag names/values; lower-case keys are structure (`menu`, `datasources`, `lovs[columns]`, `blocks[datasources, fields[return_fields, bind_vars, custom_attrs, events]]`, `screens[body_tabs[sections[partitions]]]`, `fieldsets[fields]`, `summary[fields]`, `callforms`, `launchforms`, `web_service`). Data source columns are derived from block fields (DBT/DBC); do not list Maint Audit columns.
2. `python -I scripts/gen_radxml.py <spec.json> output/radxml/<FID>_RAD.xml` - builds from the skeleton `templates/radxml_skeleton_14.7.xml`, writes empty `<RAD_KERNEL/>` + `RAD_CUSTOM` for a CUSTOM release, every element tagged with the release. It refuses tags not in the skeleton.
3. `python -I scripts/check_radxml.py output/radxml/<FID>_RAD.xml` - fix every ERROR; review WARNINGs.
4. User: ODT > Function Generation, in a **CUSTOM** release, **Action = Load** (not Parent Xml), browse the file, then Save. Open each node once to confirm, then Generate (tick Custom Package Spec/Body; see reference 27 for the list).
5. Keep the ODT-saved radxml from the generated zip as the master copy from then on (edit that, section C).

Other ODT versions: rebuild the skeleton from the user's own ODT saves, freshest NEW function first, then a large Oracle radxml for missing element types:
`python -I scripts/make_skeleton.py templates/radxml_skeleton_<ver>.xml <ODT_saved>_RAD.xml <other>_RAD.xml` and pass `--skeleton` to the generator. Never ship Oracle radxmls inside the plugin - only the blanked skeleton.

## C. Editing an existing radxml directly

1. Run `check_radxml.py` on the input first and read its layers: KERNEL function changed in CUSTOM keeps full `RAD_KERNEL` + a `RAD_CUSTOM` delta; a CUSTOM-origin function has empty `RAD_KERNEL`.
2. Add new elements inside `RAD_CUSTOM` (create it after `RAD_KERNEL` if absent), copying a sibling of the same kind (or the skeleton template) and setting `RELEASE_TYPE`/`RELEASE_NAME` like existing CUSTOM elements. Element type not in the file or the skeleton: do NOT invent it, give ODT steps.
   - To add children to a kernel node (fields to a block, tab to a screen), repeat that node in `RAD_CUSTOM` with its kernel leaf values copied unchanged plus only the new children - ODT copies every CUSTOM leaf over the kernel (reference 28 section 2).
   - Every data source PK column must be a data source field (RD-VALS-027): map it to a hidden block field and default it in the CUSTOM hook.
   - Every new field gets its own XSD_TAG (RD-VALS-60) - cloned fields must not keep the source tag.
   - For repetitive clones (slot N -> N+1) write a builder script with an explicit name map and `--release` option (reference 28 section 4).
3. Never delete or rename elements owned by an earlier release; set visible/active off instead.
4. Keep references consistent (field set -> block fields, LOV binds/returns -> fields, screen args -> blocks/fields, summary -> block fields, amendables -> fields).
5. Keep no XML declaration, tab indentation, CRLF. Run `check_radxml.py` again (it merges layers like ODT) and `python -I scripts/radxml_merge.py <file>`: kernel values changed and removed must both be 0.
6. User loads in the CUSTOM release (Action = Load), opens each changed node, Save, Generate - ODT is the final validator.

Always also write `odt-steps.md` so the change can be reproduced by hand.

## D. Review checklist

Run `python -I scripts/check_radxml.py <file>` first and include its ERRORs. Then report each as PASS / FAIL / N/A with element names:

Load format
- [ ] Root `RAD_FUNCTIONS` with all header tags; `RAD_KERNEL` present (empty for CUSTOM origin); no RAD_NOTIFICATIONS/RAD_PURGE
- [ ] FUNCTION_ORIGIN matches the release the user will load into (CUSTOM origin loads only in a CUSTOM release)
- [ ] Every CUSTOM element has RELEASE_TYPE=CUSTOM and RELEASE_NAME=<release>
- [ ] Value codes: FOOTER_TEMPLATE MAINTAUDIT, ITEM_TYPE DBITEM/DESC/CONTROL, RELATION_TYPE 1/N, 16-char CONTROL_STRING

Naming
- [ ] Function id 8 chars, module prefix, correct 3rd char for category
- [ ] Blocks `BLK_`, not containing table names; screens `CVS_`; tabs `TAB_`; sections `SEC_`; field sets `FST_`; LOVs `LOV_`; labels `LBL_`
- [ ] Field names differ from column names, no underscores/special chars; audit field names (MAKER, MAKERSTAMP, CHECKER, CHECKERSTAMP, MODNO, RECSTAT, ONCEAUTH, AUTHSTAT) not reused
- [ ] Custom elements do not clash with kernel/cluster/parent names
Data model
- [ ] Exactly one master data source (single record, no parent) and one master block
- [ ] Every non-master data source has parent + relation (parent on left, `=` only, no third table)
- [ ] PK cols/types present, counts match, 1:N children have more PK cols than parent
- [ ] Views not used as NORMAL data sources
- [ ] Multi-record data source attached to only one block; multi-source blocks are strictly 1:1
- [ ] Maint Audit template: audit columns NOT added manually
Fields and layout
- [ ] Amount fields have related block/field (currency field above)
- [ ] DESC fields have a parent field with LOV returning them; LOVs avoid control-item binds
- [ ] LOV queries: `?` binds, no ORDER BY / inline views, reduction labels present, binds mapped in order
- [ ] TAB_HEADER/TAB_MAIN/TAB_FOOTER present; no multiple footer tabs; partition limits respected
- [ ] Every field that must exist in HTML (incl. hidden defaulted/screen-arg fields) is in a field set; no field in two visible field sets
- [ ] Exactly one main screen; NORMAL buttons placed in field sets
Category-specific
- [ ] Maintenance: control string has no transaction-only actions; menu labels exist
- [ ] Online: TXNSTAT / AUTHSTAT / SUBSYSSTAT fields; transaction actions in control string
- [ ] Call form: 1:1 relation, screen args on main screen, same category as host screen
- [ ] Launch form: ACTION_CODE=EXECUTEQUERY + PKs; manual CSTB_CALL_FORM_NODES row planned
- [ ] Summary: max 12 query fields; maintenance summary/master PK field names match
- [ ] Actions/amendables set for every web-service action; operation id sentence case
Release safety
- [ ] No deletes/renames of earlier-release elements (hide/deactivate instead)
- [ ] Changes compatible with future source refresh (see 09-source-upgrade.md limits)
