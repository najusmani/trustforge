---
name: odt-hook-code
description: Write FLEXCUBE ODT release-specific code - CUSTOM (or KERNEL/CLUSTER) hook packages <MOD>PKS_<FID>_CUSTOM spc/sql and release JavaScript <FID>_CUSTOM.js - for validations, defaulting, query changes, upload logic, subsystem pickup, custom action codes and skipping lower-layer logic. Use when a FLEXCUBE customization needs backend PL/SQL or front-end JS.
---

# Hook packages and release JavaScript

> **Lessons first:** before delivering, and first whenever the user reports an ODT save, compile, deploy or test error, read `../../reference/29-lessons-learned.md`; when a new root cause is confirmed, record it as that file describes (automatically).

Reference: `../../reference/05-generation-deployment.md`, `13-maintenance-form.md`, `14-online-forms.md`, `15-call-forms.md`, `16-launch-forms-and-others-screens.md`, `23-upload-framework.md`.

## Ground rules (from the guides)
- Edit ONLY the layer package: `<MOD>PKS_<FID>_CUSTOM` (`.spc` + `.sql`) and `<FID>_CUSTOM.js`. Never modify `_MAIN`, `_SYS.js`, generated INCs.
- Do not change the generated structure of the hook package (function list and signatures). Extra helpers go into a NEW package `<MOD>PKS_<FID>_UTILS` (or the user's equivalent) called from the hook.
- Put user validations in `Fn_Post_Default_and_Validate`; avoid code in Pre stages unless needed.
- Skip lower-layer logic with `PR_SET_SKIP_KERNEL` / `PR_SET_SKIP_CLUSTER` (and re-enable with `PR_SET_ACTIVATE_<LAYER>`) from the MAIN package, typically inside `Pr_Skip_Handler`.
- Call order per stage: MAIN -> CUSTOM.pre -> CLUSTER.pre -> KERNEL.pre -> MAIN.sys -> KERNEL.post -> CLUSTER.post -> CUSTOM.post.
- Non-maintenance kernel packages (e.g. `CSPKS_ARC`) call `<PKG>_CLUSTER` with a call id and `GLOBAL.TY_TB_CUSTOM_DATA`; the cluster body forwards to `<PKG>_CUSTOM` only when `CSPKS_REQ_GLOBAL.G_RELEASE_TYPE` is CLUSTER/CUSTOM. Read the cluster body to confirm a hook reaches CUSTOM before relying on it (reference 28 section 7).
- Package variables persist across requests in pooled sessions: key any value carried between hooks to the transaction and discard on mismatch (under-charge, never double-post).
- Changing an existing CUSTOM body: add code only, wrapped in a search string (`--<FID>_<CHANGE> starts` / `ends`), keep the original in `input/` as the rollback.
- Fields not on screen (e.g. hidden PK fields of a 1:1 custom data source) are defaulted from the master record in `Fn_Pre_Check_Mandatory`.
- Child functions: parent hooks run before child hooks; use `Pr_convert_child_to_master` / `Pr_convert_master_to_child` when calling parent packages.

## Hook functions by category
- Maintenance: Pr_Skip_Handler, Fn_Post_Build_Type_Structure, Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Query.
- Online/transaction: Pr_Skip_Handler, Fn_Main, Fn_Pre/Post_Resolve_Ref_Numbers, Fn_Pre/Post_Unlock, Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Query, Fn_Pre/Post_Product_Default, Fn_Pre/Post_Subsys_Pickup (SUBSYSSTAT D/U/R), Fn_Pre/Post_Enrich, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Process. Generated `fn_sys_*` helpers are NOT called automatically for online - call them explicitly if needed.
- Call form: Pr_Skip_Handler, Fn_Main, Fn_Pre/Post_Query, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Process (transaction call forms).
- OTHERS: business logic and custom action codes (e.g. `NET_BATCH`) handled in Fn_Main.
- Report: bind-derivation function (e.g. `Afterpform`) and helper functions used by the XDO.
- Launch form: query changes in Fn_Post_Query.

## Signatures and types (verified on 14.7 generated code, see `reference/27-radxml-format.md`)
1. Best: fill the bodies of the ODT-generated `<mod>pks_<fid>_custom.sql` (Generate with "Custom Package Spec/Body" ticked). Never change its spec.
2. Otherwise copy hook declarations from the user's `_KERNEL`/`_CLUSTER` spec, renaming the package.
3. Otherwise use `templates/custom_package_skeleton.sql` - its maintenance signatures match 14.7 generated code; still diff against the generated spec once it exists.

Verified facts for maintenance functions:
- Record type `<mod>pks_<fid>_Main.ty_<fid>`; one member per data source named `v_<synonym in lower case>` (e.g. `p_Wrk_stdcursk.v_sttms_cust_risk_profile.review_date`). Multi-record sources are PL/SQL tables (`ty_tb_v_<synonym>`): use `.COUNT` and loop `1..COUNT`.
- Default-and-validate hooks receive `p_<fid>` (request as sent), `p_Prev_<fid>` (record before the change) and `p_Wrk_<fid>` (merged working record - validate this one).
- Action codes: compare with `Cspks_Req_Global.p_New / p_Modify / p_Auth / p_Delete / p_Close / p_Reopen / p_Query`, never string literals.
- Errors: the generated body contains a local `Pr_Log_Error(p_Function_Id, p_Source, p_Err_Code, p_Err_Params)`. Pattern: set `p_Err_Code`/`p_Err_Params`, call `Pr_Log_Error(...)`, `RETURN FALSE`. Keep the generated `WHEN OTHERS` (ST-OTHR-001).
- Debug: `Dbg('...')`. Dates: `Global.Application_Date`; branch: `Global.Current_Branch`.
- Every new error code (e.g. `ST-CRSK-001`) needs an error-message maintenance entry - list them for the user (odt-static-data skill).

Prefer the user's existing idioms from their kernel/cluster code where they differ.

## Code quality checklist
- Every hook returns TRUE on success, FALSE with error populated on failure; WHEN OTHERS logs and returns FALSE.
- Respect the action code (NEW, MODIFY, AUTHORIZE, DELETE, CLOSE, REOPEN, QUERY...) - validate only where relevant.
- Multi-record blocks: loop the collection; handle empty collections.
- No COMMIT/ROLLBACK inside hooks (the framework controls transactions) unless the user's code base does it.
- Use bind-safe SQL, no dynamic SQL from user input.
- In a package body, every package-level variable, constant, type and cursor goes **before** the first procedure or
  function (otherwise PLS-00103 at compile time).
- Mark every hand-written addition (`--<FID>_<FEATURE>`), log one line saying what the code did or why it skipped, and
  give the `USER_SOURCE` query that proves the delivered body is the compiled one (lessons L5, L6).
- **Before delivering any package body, run** `python3 -I scripts/check_plsql_body.py <body.sql>` and fix every ERROR:
  declaration order, IF/LOOP/parenthesis balance per subprogram, matching `END <name>;`. It does not replace the
  compiler; say so, and ask the user for the compile result.

## Release JavaScript `<FID>_CUSTOM.js`
- Not generated; developer creates it. Functions are named with the layer suffix: `fnPreLoad_CUSTOM()`, `fnPostLoad_CUSTOM()`, `fnPreNew_CUSTOM()`, `fnPostNew_CUSTOM()` and other `fnPre<Action>_CUSTOM` / `fnPost<Action>_CUSTOM` handlers; CUSTOM overrides same-named KERNEL/CLUSTER functions.
- Button events of type NORMAL call the function named in the field event.
- Custom action codes (OTHERS screens / batch buttons): set the action code, build request XML, send, process response - copy the exact helper calls from the user's existing JS (the guides show the pattern but not the API names).
- Field ids follow `BLK_<BLOCK>__<FIELD>` style in FLEXCUBE HTML; confirm from the user's `_SYS.js` / UIXML before using.

Templates: `templates/custom_package_skeleton.sql`, `templates/custom_js_skeleton.js`.
