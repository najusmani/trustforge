---
name: odt-customize
description: Main entry point for Oracle FLEXCUBE UBS ODT / RAD Tool / Development Workbench customization. Use when a user provides existing FLEXCUBE artifacts (radxml *_RAD.xml, table DDL or DB object names, generated or hook PL/SQL packages, *_SYS.js / release JS, UIXML, INC scripts, service XML) together with a requirement, and wants the customized screen, fields, validations, LOVs, call/launch forms, summary, upload, notification, purge, REST/SOAP or any other RAD artifact produced. Also use for "add a field to STDCIFD", "custom validation on FTDTRONL", "new maintenance screen for table X", "make this field mandatory", etc.
---

# FLEXCUBE ODT customization workflow

You act as a FLEXCUBE ODT developer. The user gives you existing objects plus a requirement; you deliver the customized artifacts and exact instructions to finish them in ODT.

Knowledge base: `../../reference/` (relative to this skill folder). Always read `../../reference/00-cheat-sheet.md`, then the files `../../reference/INDEX.md` points to for the task. Follow the guides' rules; when a rule comes from the docs, keep it, and when something is NOT in the docs (radxml XML schema, exact hook signatures, INC column lists, error-code conventions), take it from the user's own files and say so.

Default layer: **CUSTOM** (unless the user states KERNEL or CLUSTER, or the radxml shows another release type).

## Step 1 - Intake and workspace

1. Create `odt-work/<FUNCTION_ID>/input/` and `odt-work/<FUNCTION_ID>/output/` in the current project (use `odt-work/<SHORT_NAME>/` for new or multi-function work). Copy or save every artifact the user gives into `input/` unchanged. Never edit inputs in place.
2. Identify from the inputs:
   - Function id, module (chars 1-2), category (header of radxml, else 3rd char: D, C, R, N...), function type (Parent/Child/Screen Child), parent function if any.
   - Release type and release code in the radxml, and which elements belong to which release.
   - Tables/views involved, PK columns, existing blocks/fields/screens/field sets/LOVs/call forms.
3. Restate the requirement as numbered, testable items (R1, R2...).

## Step 2 - Check what you still need

Use this table. Ask the user only for items that are missing AND needed; batch all questions in one message. If something is optional, proceed and state the assumption.

| Requirement involves | Needed inputs |
|---|---|
| Any change to an existing screen | Its `<FID>_RAD.xml` (latest release version); for child screens also the parent radxml |
| New/changed DB columns or tables | DDL or `DESC` output of the tables (columns, types, lengths, PK); STTB_PK_COLS rows if known |
| Backend logic (validation, defaulting, processing) | Generated `<MOD>PKS_<FID>_MAIN.spc` (for type names and hook signatures) and the current `_CUSTOM` spc/sql if it exists; `_KERNEL`/`_CLUSTER` if logic must be skipped or reused |
| Front-end behaviour | `<FID>_SYS.js` and existing `<FID>_CUSTOM.js` if any |
| LOV | Source table/columns and filter conditions; existing LOVs in radxml |
| Call form / launch form | The call/launch form radxml, or at least its function id, screen args and CSTB_CALL_FORM_NODES row |
| Upload | Base tables, whether upload tables exist, source system details |
| Web service / REST | Service name (GWTM_SERVICES_MASTER), existing .sxml |
| Error messages | Desired message text; the bank's custom error-code range (else propose one and flag it) |
| Labels | Desired label texts; language code (default ENG) |
| Adding to an Oracle (KERNEL) function | Scope: maintained only, or also processed at transaction/batch time? If processed: run the impact queries in `../../reference/28-extending-kernel-function.md` section 6 and get the core package spec/body and its `_CLUSTER`/`_CUSTOM` layers. Storage choice (custom 1:1 table recommended). "Same as existing slot N?" |

Always ask for the CUSTOM release code - the radxml must be tagged with it (use a `--release` option in any builder so the user can rebuild).

For a NEW function no radxml is needed: generate it with `../odt-radxml/scripts/gen_radxml.py` (odt-radxml section B). For changes to an existing function its radxml is required; without it deliver the design, ODT steps, DDL, hook code, JS and labels.

## Step 3 - Analyse

- Parse the radxml and build an inventory (data sources, columns, blocks, fields with display/item types, screens/tabs/sections/partitions, field sets, LOVs, call/launch forms, actions, summary). Element names, layers and release tagging are in `../../reference/27-radxml-format.md`; run `../odt-radxml/scripts/check_radxml.py` on the input first.
- Find where the requirement fits: which data source/block/field set/tab, which hook stage, which JS event.
- Check immutability: elements created in earlier releases (kernel/cluster) cannot be deleted or renamed in CUSTOM; plan Visible=false / Active=false instead.

## Step 4 - Design (write before building)

Write `output/DESIGN.md` (start from `templates/DESIGN.md`):
- Summary of requirement items R1..Rn.
- Change table: `# | Requirement | ODT element / artifact | Change | Layer | Reference rule`.
- Data changes: new columns/tables (custom tables follow FLEXCUBE naming: 5th char `_`, no double `_`; prefer a separate custom table linked 1:1 by PK over altering kernel tables unless the user says otherwise).
- Which hook stages get code and why (prefer `Fn_Post_Default_and_Validate` for validations; online screens use their own stages - see `14-online-forms.md`).
- Risks: refresh/upgrade limits (`09-source-upgrade.md`), naming conflicts (use a custom prefix, e.g. `FST_U...`, `BLK_U...` style only if the user's convention allows; never reuse kernel names).

For large or ambiguous requirements, show the design to the user and wait for agreement before building.

## Step 5 - Build artifacts

Use the specialised skills' instructions (read their SKILL.md):
- Radxml design/edit/review: `../odt-radxml/SKILL.md`
- Hook packages and release JS: `../odt-hook-code/SKILL.md`
- Labels, DDL, manual static data (CSTB_LABELS, CSTB_CALL_FORM_NODES for launch forms, upload tables): `../odt-static-data/SKILL.md`
- Silent ODT / bulk generation / refresh / SOAP / REST generation configs: `../odt-silent/SKILL.md`

Output layout:
```
output/
  DESIGN.md
  CHANGES.md                 deploy + test guide (Step 7)
  radxml/<FID>_RAD.xml       new (gen_radxml.py from a spec) or customized radxml
  odt-steps.md               click-by-click ODT instructions for every radxml change (always)
  db/ddl/*.sql               new tables/columns, upload tables
  db/packages/<mod>pks_<fid>_custom.spc / .sql
  db/static/*.sql            label and other manual scripts
  js/<FID>_CUSTOM.js
  silent/*.properties        when bulk/refresh/service generation is needed
```

Hard rules:
- Never hand-write or edit generated units: `_MAIN` packages, `_SYS.js`, UIXML/screen XML, generated INCs, XSDs, upload adapter packages. Tell the user to regenerate them in ODT (or Silent ODT) from the customized radxml.
- Only write code in the CUSTOM hook package and `<FID>_CUSTOM.js` (or the layer the user works in).
- Keep everything the user's existing files show: indentation, debug style, error handling idiom, naming.

## Step 6 - Validate

Run the review checklist in `../odt-radxml/SKILL.md` against the customized radxml and design. Also check PL/SQL compiles logically: every function in the spec exists in the body with the same signature as the MAIN spec expects; every branch returns; error codes populated on failure. Fix issues before delivering.

## Step 7 - Deliver

Write `output/CHANGES.md` (start from `templates/CHANGES.md`) with:
1. Files delivered and what each does.
2. Deployment order: DDL -> load radxml in ODT (Function Generation, CUSTOM release, Action = Load), Save -> Generate (list the exact units to tick; for a new maintenance function see reference 27) -> Deploy front-end (UIXML, SYS js, CUSTOM js) -> compile DB units (MAIN spc/sql, CUSTOM spc/sql, INCs incl. labels/menu/LOV/amend/summary) -> manual scripts.
3. Unit test cases per requirement (action, input, expected result), including negative cases.
4. Assumptions and open points.

Then reply to the user with a short summary and the path to `output/`.
