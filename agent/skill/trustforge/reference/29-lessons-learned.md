# Lessons learned from real deployments

Problems found when TrustForge output was generated, compiled, deployed or tested in a real FLEXCUBE
environment. **Read this file before delivering any customization and whenever the user reports an error.**
Each lesson says how to recognise it, the cause, the fix, and what now prevents it.

New lessons are added automatically (see "Recording a lesson" at the end). Never put bank names, customer
data, account numbers, environment URLs or credentials in a lesson: only ODT/FLEXCUBE behaviour.

| ID | Symptom (search for this) | Short cause |
|---|---|---|
| L1 | `ST-AMND-002` on Modify, log `Cspks_Req_Utils :: In Pr_Log_Error :FLEXCUBE /ST-AMND-002/@<TABLE>.<COLUMN>` | Amendable INCs not generated: Amendable not ticked, or the CUSTOM layer has no `RAD_ACTIONS` |
| L2 | New CUSTOM validations/defaulting silently do nothing after deploy | ODT's empty CUSTOM body compiled over the hand-written one |
| L3 | `RD-VALS-027` on ODT save | PK column not a field of its data source |
| L4 | `RD-VALS-60` on ODT save | Duplicate XSD tag on a new field |
| L5 | A transaction-time CUSTOM extension (extra charge, extra processing) has no effect, no error | Hook body not deployed, test data outside the design's conditions, or the channel never calls the hook |
| L6 | `PLS-00103: Encountered the symbol "<NAME>" when expecting one of the following: begin end function pragma procedure` compiling a package body | A package-level declaration placed after a procedure/function body |
| L8 | Extra entries added by a CUSTOM hook are logged as added but missing from the final accounting hand-off (teller/ATM) | Kernel writes later entries at fixed hand-off positions and overwrites them |
| L7 | `PLS-00231: function '<NAME>' may not be used in SQL` with `ORA-00904: "<NAME>": invalid identifier` compiling a package body | A function declared only in the body (not the spec) called inside a SQL statement |

---

## L1 - ST-AMND-002 on Modify: amendable INCs not generated
- **Seen:** IFDATMMN (CUSTOM extension of a KERNEL maintenance function), FCUBS 14.7, 2026-11-22.
- **Symptom:** Unlock -> change a new field -> Save fails with `ST-AMND-002`. The debug log lists the amendable
  fields after `Fn_Get_Amendable_Details` (`<TABLE>.<COLUMN>` lines ending with `LAST:FLEXCUBE/<FID>_MODIFY`) and
  the new table's columns are not in that list.
- **Cause:** ODT generated no `GWTM_AMEND_MASTER`, `GWTM_AMEND_NODES`, `GWTM_AMEND_FIELDS`, `GWTB_AMEND_NODES`,
  `GWTB_AMEND_FIELDS` INCs, so the database kept Oracle's amendable list. ODT gives no warning. Two ways this happens:
  1. **Amendable** not ticked on the Generate screen.
  2. **The release layer has no `RAD_ACTIONS` of its own** (found 2026-11-22: a regenerate with Amendable ticked still
     produced no amend INCs). ODT builds the amendable INCs from the `RAD_ACTIONS` of the release being generated.
     `RAD_FUNC_PREFERENCES`, `RAD_ACTIONS` and `RAD_SUMMARY` are copied whole into a layer only when that node is opened
     and saved in that release; for a KERNEL function changed in CUSTOM, `RAD_CUSTOM` therefore lacks `RAD_ACTIONS`
     unless someone opened Actions. The fields' `AMENDABLE_IN = MODIFY` alone is not enough. A new CUSTOM function
     (STDCURSK) always has `RAD_ACTIONS` in `RAD_CUSTOM`, which is why it worked.
- **Fix:** copy the kernel `RAD_ACTIONS` block unchanged into `RAD_CUSTOM` (or open Actions in ODT in the CUSTOM release
  and Save), load, save, regenerate with Amendable ticked. Check `GWTB_AMEND_FIELDS` holds the new
  `<NODE_NAME>, <FIELD_NAME>` rows for `<FID>_MODIFY` **and still holds the kernel fields**, compile the five INCs,
  commit, clear the app cache, retest Modify. No package recompile needed.
- **Prevention:**
  - `../skills/odt-radxml/scripts/check_radxml.py` ERROR: a higher layer adds amendable fields but has no `RAD_ACTIONS`.
  - `../skills/odt-customize/scripts/check_odt_zip.py` (check `amend`) fails when any amendable field has no row in
    GWTB/GWTM_AMEND_FIELDS and names which of the two causes applies.
  - Radxml rule: when a CUSTOM delta on a KERNEL function adds amendable fields, `RAD_CUSTOM` carries a whole copy of
    the kernel `RAD_ACTIONS` (see `28-extending-kernel-function.md`).
- **Not the cause:** `Other Label Not Found in Cstb_Other_Labels` for `@<TABLE>` in the same log is only the error
  message looking up a block label; harmless.

## L2 - Hand-written CUSTOM body replaced by ODT's stub
- **Seen:** STDCURSK and IFDATMMN, 2026-11-20 to 2026-11-22.
- **Symptom:** after deploy, the customization's validations, defaults or extra saves don't run; no error.
- **Cause:** when Custom Package Body is ticked, ODT writes `SQL/<mod>pks_<fid>_custom.sql` as an empty stub (every hook
  just logs and returns TRUE). Compiling it from the zip overwrites the hand-written body.
- **Fix:** compile the generated CUSTOM **spec** from the zip, then the hand-written body from `output/db/packages/`.
- **Prevention:** `check_odt_zip.py` (check `stub`) warns when the zip body is a stub; with `--custom-body` it checks the
  hand-written body implements every routine of the generated spec.

## L3 - RD-VALS-027 on ODT save
- **Cause / fix:** a PK column in `PK_COLS` is not a `RAD_FIELDS` of that data source. Add the column as a field
  (hidden if needed). Details: `28-extending-kernel-function.md`.
- **Prevention:** `check_radxml.py` reports it as an ERROR.

## L4 - RD-VALS-60 on ODT save
- **Cause / fix:** two fields share an `XSD_TAG` (common when cloning a kernel slot). Give each new field a unique tag.
- **Prevention:** `check_radxml.py` reports it as an ERROR.

## L5 - Transaction-time CUSTOM extension does nothing
- **Seen:** IFDATMMN charge 6 (extra ARC charge added through `CSPKS_ARC_CUSTOM` hooks), tested with an ATM cash
  withdrawal through FLEXCUBE Switch, FCUBS 14.7, 2026-11-23. The transaction succeeded; charge 6 was not applied.
- **Symptom:** no error and no trace of the extension in the debug log; the hooks' generic "Start of …" lines appear.
- **Cause:** three independent ones, all visible in one debug log of a real transaction:
  1. The compiled CUSTOM body was not the delivered one (Oracle's empty stub logs the same "Start of …" lines).
  2. The test record did not meet the design's conditions (the ARC record matched had charges 1-3 and netting off;
     the extension needs charges 1-5 and Net Charges).
  3. The channel never called the posting hook: teller and switch transactions build charge entries in
     `DEPKS_RTL_TELLER.PR_BUILD_CHG_ENTRIES` (CUSTOM hooks `pr_pre_build_chg_entries` / `pr_build_chg_entries`),
     not in `CSPKS_ARC.PR_NET_CHARGES`.
  Also: kernel debug text can mislabel hook call ids (`CSPKS_ARC` prints "call id 2" while setting call id 3).
- **Fix:** check deployment with `USER_SOURCE` (marker text), test with data that meets every condition, and put the
  logic in the hook the channel actually calls (trace it in a debug log first).
- **Prevention:**
  - Every hand-written CUSTOM body carries a marker comment (e.g. `--<FID>_<FEATURE>`), always logs one line saying
    what it did or why it skipped, and CHANGES.md gives the `USER_SOURCE` query that proves it is compiled.
  - Before building a transaction-time extension, get a debug log of one real transaction per channel (branch,
    teller, switch/ATM, upload, payments) and list which hooks it calls; design against that list
    (`28-extending-kernel-function.md` section 6).
  - Unit tests for each channel state the exact debug lines expected, and test data that meets every condition.

## L6 - PLS-00103 on a package-level declaration
- **Seen:** `CSPKS_ARC_CUSTOM` body delivered for IFDATMMN charge 6, FCUBS 14.7, 2026-11-23 (first compile attempt;
  the error had been in the delivery since 2026-11-20, which is also why the body was never deployed).
- **Symptom:** `PLS-00103: Encountered the symbol "G_CHG6_TAG" when expecting one of the following: begin end function
  pragma procedure` at the first package variable; the rest of the compiler output is only "Hint: Parameter … is
  declared but never used" (harmless, from Oracle's stub hooks).
- **Cause:** in a package body all declarations (variables, constants, types, cursors) must precede the first
  procedure or function body. A helper procedure (`DBG`) had been placed above the new globals.
- **Fix:** move the declarations above the first procedure/function and compile again.
- **Prevention:** `../skills/odt-hook-code/scripts/check_plsql_body.py` (check `order`) flags any package-level
  declaration after a subprogram body, and checks IF/LOOP/parenthesis balance and `END <name>;` per subprogram.
  The odt-hook-code skill runs it on every package body before delivery. TrustForge cannot compile; the user's
  compile result is the final check.

## L7 - PLS-00231: private function used inside SQL
- **Seen:** `IFPKS_ARC_CHG6` body (new helper package for an extra ARC charge), FCUBS 14.7, 2026-11-23 (first compile).
- **Symptom:** `PLS-00231: function 'FN_SOURCE' may not be used in SQL`, `PL/SQL: ORA-00904: "FN_SOURCE": invalid
  identifier` and `PL/SQL: SQL Statement ignored` on an `INSERT ... VALUES (...)` that called the function.
- **Cause:** SQL runs in the SQL engine, which can only call schema-level functions or functions published in a
  package **spec**. A function declared only in the package body is invisible to it. Package variables are fine
  (they are bound).
- **Fix:** assign the function result to a local variable before the statement and use the variable (or publish the
  function in the spec).
- **Prevention:** `../skills/odt-hook-code/scripts/check_plsql_body.py` (check `sqlfn`) flags a body-only function used
  inside `SELECT` / `INSERT` / `UPDATE` / `DELETE` / `MERGE`; it reads the spec from a `.spc`/`.pks` next to the body.

## L8 - Entries added to the hand-off are overwritten by the kernel
- **Seen:** extra ARC charge posted from a CUSTOM hook in a switch (ATM) cash withdrawal, FCUBS 14.7, 2026-11-23.
- **Symptom:** the hook's debug line says the entries were added, but the kernel's printed accounting table and the
  final hand-off do not contain them; no error.
- **Cause:** `DEPKS_RTL_TELLER.PR_BUILD_CHG_ENTRIES` writes charge entries at **fixed positions** of the hand-off
  table (`J` = 3, 5, 7, ... per charge), not at `COUNT + 1`. Anything appended before the charge loop (for example in
  `PR_BUILD_ACCTNG_ENTRIES` call id 1) is overwritten.
- **Fix:** append extra entries in the last hook before `ACPKS.FN_ACHANDOFF`. For teller/switch this is
  `DEPKS_RTL_TELLER_CUSTOM.FN_SAVE` with call id 7 (the overload with `P_ACC_HAND IN OUT`, logged as `fn_save3`).
  Keep a duplicate-tag guard.
- **Prevention:** `28-extending-kernel-function.md` names call id 7 as the teller posting point. Before adding entries
  from any hook, read how the kernel indexes the table after that hook. If the next kernel step writes `P_ACC_HAND(J)`
  with its own counter, add the entries later. Not mechanically checkable (needs the kernel body); the unit test
  must check the final hand-off table in the debug log, not the hook's own message.

---

## Recording a lesson (automatic)
When the user reports an error from ODT, compilation, deployment or testing:
1. Search this file for the error code or log text first. If a lesson matches, apply its fix.
2. If none matches, diagnose from the user's log and files. Once the root cause is confirmed (by evidence in the
   files, or the user confirms the fix worked), **add a lesson without being asked**:
   - Append a row to the table and a section `## L<n> - <title>` with Seen (function type, release, date),
     Symptom, Cause, Fix, Prevention, in the format above. Generic ODT/FLEXCUBE behaviour only.
   - If the problem can be detected mechanically, add the check to `check_odt_zip.py` or
     `../skills/odt-radxml/scripts/check_radxml.py`, run it on the failing files to prove it fires, and name it
     under Prevention.
   - Add one line to the plugin `CHANGELOG.md` under an "Unreleased" heading.
3. Where to write: this file in the TrustForge **source** folder (the folder that holds
   `.claude-plugin/marketplace.json` and `trustforge/reference/29-lessons-learned.md`) when the workspace has it.
   If it doesn't (an installed copy, or the hosted workspace), write the lesson to `LESSON.md` in the job's
   output folder instead and tell the user it is ready to be added to TrustForge.
4. Tell the user in one line that the lesson was recorded and which check now catches it.
