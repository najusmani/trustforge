# 28 - Extending an Oracle (KERNEL) function in the CUSTOM layer (field-tested)

Not in the Oracle guides. Learned on FCUBS 14.7 while adding a 6th charge to IFDATMMN (ARC maintenance, 5 charges in the kernel). The ODT save errors below were hit and fixed in that work.

## 1. Questions to settle before building
1. **Scope:** maintained only (screen + table), or also *processed* at transaction time? A new column the kernel batch/online code never reads does nothing. Ask this first - it decides whether backend packages are needed.
2. **Storage:** prefer a new custom table keyed 1:1 on the kernel table's PK (`<KERNEL_TABLE>_CUSTOM`) over `ALTER` of the kernel table (safer on upgrade).
3. **Behaviour:** "same as charge/slot N" or different.
4. **Conventions:** CUSTOM release code, element/label prefix, custom error-code range, label texts.
5. **Files:** the kernel radxml; `<MOD>PKS_<FID>_MAIN.spc`, `_KERNEL` spc/sql (signatures + kernel validations to mirror); `<FID>_SYS.js`, `<FID>_KERNEL.js` (field events to mirror); existing `_CUSTOM` units to merge with.

## 2. Radxml delta rules (how ODT merges CUSTOM onto KERNEL)
See `radxml_merge.py` (port of `customOnKernel` in `RadDeltaHandler_NonIE.js`).
- Keep `RAD_KERNEL` byte-for-byte as received. Add `RAD_CUSTOM` after it; header `RELEASE_TYPE` CUSTOM, `FUNCTION_ORIGIN` stays KERNEL.
- New element (new data source, LOV, screen, field set...) -> put it whole in `RAD_CUSTOM`; ODT appends it.
- Adding children to an existing kernel node (fields to a block, a tab to `CVS_MAIN/BODY`, columns to a data source) -> repeat the parent node in `RAD_CUSTOM` with the same ID **and its kernel leaf values unchanged**, plus only the new children. ODT copies every leaf present in the CUSTOM node over the kernel node, so an empty or different leaf silently changes the kernel. Same for `HEADER/BODY/FOOTER` and `RAD_TABS`, which merge recursively.
- A child with an existing ID is replaced whole.
- `RAD_FUNC_PREFERENCES`, `RAD_ACTIONS`, `RAD_SUMMARY` are copied whole into each layer.
- **New amendable fields need `RAD_ACTIONS` in the layer.** ODT generates the amendable INCs from the `RAD_ACTIONS` of the release being generated, so a CUSTOM delta that adds amendable fields must carry a whole, unchanged copy of the kernel `RAD_ACTIONS` in `RAD_CUSTOM`. Without it, Modify fails with ST-AMND-002 (lesson L1 in `29-lessons-learned.md`).
- Verify "nothing broken": `python -I radxml_merge.py <out>_RAD.xml` must report `kernel leaf values changed: 0 removed: 0`. `check_radxml.py` runs the same merge and warns on any change.

## 3. ODT save errors seen and their causes
| Code | Message | Cause / fix |
|---|---|---|
| RD-VALS-027 | Primay Key Column X of datasource D is not included in datasource fields | every PK column of every data source must be a `RAD_FIELDS` entry mapped to a block field. For a 1:1 custom child source, add hidden, read-only, non-amendable block fields for its PK columns (no field set needed) and copy the values from the master record in `Fn_Pre_Check_Mandatory` of the CUSTOM package (not on screen -> generated mandatory check fails on New). Oracle's STDCUSAC does the same for its 1:1 child source (hidden BRN/ACC fields). |
| RD-VALS-60 | Duplicate Xsd Tag Names for Fields A and B in Block X | cloned field kept the source field's `XSD_TAG`. Every cloned field needs its own tag. Kernel files contain duplicates between old kernel fields; ODT tolerates those but rejects a new one. |
| RD-SAVE-009 | Failed to process Request | follows any validation error above; fix those. |
`check_radxml.py` reports both 027 and 60 as ERRORs.

## 4. Cloning "slot N" to "slot N+1" (charges, slabs, limits ...)
- Build an explicit map per element: field -> new field, column, XSD tag, label, event function. Kernel numbering is often inconsistent (some columns 0-based `...4` for slot 5, others 1-based `...5`); never derive names with a regex alone, list them.
- Clone: block fields (DB items, DESC fields, buttons), data source columns, field sets, tab and sub-screens, field events (rename JS functions), custom attributes; reuse LOVs when the query is identical for every slot.
- New labels for the tab/sub-screen titles; reuse field labels.
- Mirror every kernel validation for slot N in the CUSTOM hook (same error codes -> no new messages), and the kernel JS behaviour in `<FID>_CUSTOM.js`.
- Write the builder as a script (input kernel radxml -> output radxml with `--release CODE`) so the user can rebuild with their release code; make it stop on duplicate XSD tags.

## 5. Custom extension table pattern
- `CREATE TABLE <T>_CUSTOM AS SELECT <pk cols>, <slot N cols renamed> FROM <T> WHERE 1=0` copies exact types/lengths from the user's environment; then add the PK constraint. Check copied NOT NULL constraints.
- Backfill one row per existing kernel row so existing records can be modified; give a rollback script.
- Data source: child of the master, `RELATION_TYPE 1`, relation on all PK columns, synonym name (`<MOD>TMS_...`).

## 6. Backend impact analysis (when the new data must be processed)
Run in the FLEXCUBE schema and ask the user for the output:
```sql
-- who reads the table
SELECT DISTINCT name, type FROM user_dependencies
WHERE referenced_name IN ('<T>', '<T_SYNONYM>') AND type LIKE 'PACKAGE%';
-- who hard-codes slot N columns (fixed-slot designs)
SELECT name, type, line, TRIM(text) FROM user_source
WHERE REGEXP_LIKE(UPPER(text), '<slot-N column regex>') ORDER BY name, type, line;
-- wrapped (unreadable) kernel bodies
SELECT name, type, SUBSTR(text,1,80) FROM user_source WHERE line = 1 AND name IN (...);
```
- Then ask for the spec + body of the core package and its `_CLUSTER` / `_CUSTOM` layers.
- **Trace the channels before designing hooks** (lesson L5): ask for a debug log of one real transaction per channel
  that must use the new data (branch screen, teller, switch/ATM, upload, payments) and list the CUSTOM hooks each one
  calls. The same calculation can be posted by different code per channel: teller and switch build charge entries in
  `DEPKS_RTL_TELLER.PR_BUILD_CHG_ENTRIES` (hooks `pr_pre_build_chg_entries` / `pr_build_chg_entries`), while other
  callers net charges through `CSPKS_ARC.PR_NET_CHARGES`. Kernel debug text can mislabel call ids; read the code.
- Every hand-written CUSTOM body gets a marker comment and always logs what it did or why it skipped; CHANGES.md
  gives the `USER_SOURCE` query that proves the delivered body is the one compiled.
- Look for **fixed slots** after the calculation: records with columns 1..5, globals `g_x1..g_x5`, procedure parameters per slot, teller/transaction table columns per slot, accounting amount tags per slot. Each one is a place a new slot is dropped.
- If the kernel is fixed-slot, say so plainly and give options: (A) Oracle SR to extend the kernel (clean), (B) CUSTOM workaround through existing hooks with stated limits (not shown on screens, not waivable, posts only in some flows ...), (C) business workaround. Let the user choose.

## 7. Non-maintenance kernel package layering (e.g. CSPKS_ARC)
- Kernel calls `<PKG>_CLUSTER.<proc>` with a call id (`L_FN_CALL_ID`) and a `GLOBAL.TY_TB_CUSTOM_DATA` key/value table; the cluster body forwards to `<PKG>_CUSTOM` **only when `CSPKS_REQ_GLOBAL.G_RELEASE_TYPE` is CLUSTER/CUSTOM**. If the environment runs as KERNEL, no custom hook runs. Read the cluster body to confirm each hook is forwarded and which keys it copies.
- Older kernel code uses `STPKS_FCMAINT_SERVICE.P_NEW/P_MODIFY`; generated 14.x code uses `Cspks_Req_Global.p_New/...` - same values.
- Package variables survive between requests in pooled DB sessions. When a value captured in one hook is used in a later hook, key it to the transaction (account, reference) and drop it if it does not match, so a stale value can never post on another transaction.

## 8. Proving nothing broke
- `RAD_KERNEL` of output identical to input; `radxml_merge.py` reports 0 changed / 0 removed kernel values.
- No kernel/MAIN/SYS unit edited; CUSTOM packages changed by adding code only, marked with a search string (e.g. `--<FID>_<CHANGE> starts/ends`).
- List regression tests for existing slots 1..N, plus the new slot.
