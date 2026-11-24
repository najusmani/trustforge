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
| L9 | OBPM: the **Java Classes** check box on Generate is disabled (greyed out) | "Java functions" not ticked in the screen's Preferences (`ELCM_FUNCTION` not `Y` in the radxml) |
| L10 | OBPM: a LOV on a new screen opens but lists nothing (no error) | LOV bound to the read-only HOST_CODE field, which is empty on New; host not filled with `POPULATE_HOST` |
| L11 | OBPM: a LOV lists nothing (bad table/column) or only `ALL` / the default value | LOV query guessed instead of read from OBPM; FCJ searches the LOV with the field's current value |
| L12 | Screen title / menu shows `<Fid>_Desc`, `<Fid>_Main_Menu` | `LBL_<FID>_*` labels missing when ODT generated `SMTB_FUNCTION_DESCRIPTION` |
| L13 | LOV window shows `No Records Found for the Specified Criteria` although the table has rows for the bind values | Description column is a LOV search field: `LIKE '%'` drops rows whose description is NULL |
| L14 | OBPM: Authorize / Delete give `ST-COM036 Response is empty`; server log `PMRequestParser-->some values are null --> 19~21`, `ArrayIndexOutOfBoundsException` in `getActualFieldValues` | A block field with no data source column (DESC field) in a Java-functions screen |
| L15 | OBPM: a Java processing hook does nothing (payment not stopped, no error); log `LOOKUP_KEY -- <KEY>` then `Class Name not found return NULL` | Hook class not registered in `PMTM_EXTENSION_CLASSES` (key exists, CLASS_NAME empty); hook logging with `java.util.logging` never shows in the OBPM debug |
| L16 | OBPM BO_VALIDATION hook runs but checks nothing; its debug shows amount / currency `null` for a book transfer | Book transfer fills the pain fields (`Instdamt`, `Instdamtccy`, `Eqvtamt`), not `getxfrAmt` / `getTxfrCcy` / `getLcyAmt` / `getBookDate` |
| L17 | OBPM: a business-override hook shows its message but `Failed to Save the Record` (payment not in the BO queue); message text keeps `$4` | Message type `E` rolls the transaction back (overrides must be `O`); OBPM stops substituting at the first `$n` missing from the text |
| L18 | OBPM: rows written by a Java hook stay after the payment is rolled back (`Failed to Save`) | Hook used a JNDI data-source connection, which is not in the payment's transaction |
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

## L9 - OBPM: Java Classes disabled on Generate
- **Seen:** new OBPM 14.7 maintenance (CUSTOM release, Java back end) loaded from a generated radxml, 2026-11-23.
- **Symptom:** on Generate the **Java Classes** check box is disabled, so no Java classes can be generated.
- **Cause:** ODT enables it only when the function's own **Preferences** node has **Java functions** ticked. ODT saves
  that tick as `RAD_FUNC_PREFERENCES/ELCM_FUNCTION = Y` (and sets `MODULE_GROUP_ID = FCPMTS`); it is a screen
  preference, not a User Preferences setting. `JAVA_PAYEMNTS_FUNCTION` is a different tag: setting it to `Y` does
  not enable Java Classes (first fix attempt; ODT saved it empty again).
- **Fix:** tick **Java functions** in the screen's Preferences, Save, then Generate with Java Classes ticked. In a
  spec: `"preferences": {"ELCM_FUNCTION": "Y", "MODULE_GROUP_ID": "FCPMTS"}`, then rerun `gen_radxml.py`.
- **Prevention:** `../skills/odt-radxml/scripts/check_radxml.py` warns for an OBPM module (PM/PX) radxml whose
  `ELCM_FUNCTION` is not `Y` (proven: fires on the radxml first loaded, silent on the ODT-saved one). Reference 30
  sections 4 and 4.1 and the odt-radxml skill name the tag.

## L10 - OBPM: host-bound LOV returns nothing on New
- **Seen:** new OBPM 14.7 maintenance (CUSTOM, Java functions), 2026-11-23, after deployment.
- **Symptom:** the customer and customer-service-model LOVs open but show no rows; no error.
- **Cause:** their queries filter `HOST_CODE = ?` with the bind on the screen's read-only HOSTCODE field. A LOV bind
  takes its value only from a screen field (`lovInfoFlds` in `<FID>_SYS.js`); the front end has no host-code global
  (only `mainWin.CurrentBranch`). The field was filled only on Save, so the LOV ran with a null host.
- **Fix (OBPM's own pattern, e.g. PBDOTONL, DirectDebitOut, PositivePayMaster):**
  - release JS `fnPostNew_CUSTOM` sends action `POPULATE_HOST` and loads the reply:
    `appendData(); fcjRequestDOM = buildUBSXml(); fcjResponseDOM = fnPost(fcjRequestDOM, servletURL, functionId);`
    then on `fnProcessResponse()` SUCCESS:
    `setDataXML(getXMLString(fnGetDataXMLFromFCJXML(fcjResponseDOM, 1))); showData();`, then restore `gAction`.
  - `<Name>Custom.preCheckMandatory`: `if ("POPULATE_HOST".equals(profile.getAction())) { dto.setHostcode(profile.getHostCode()); return true; }`.
    The generated `<Name>CustomSys` neither checks mandatory fields nor saves for this action.
  - Deploy `<FID>_CUSTOM.js` next to `<FID>_SYS.js`; the launcher loads `Script/JS/<FID>_CUSTOM.js`.
- **Prevention:** `../skills/odt-radxml/scripts/check_radxml.py` warns when a field's LOV binds a read-only
  `HOST_CODE` field (it cannot see the JS, so it stays as a reminder). Reference 30 section 4.1 describes the
  pattern.

## L11 - OBPM: LOV lists nothing, or only the default value
- **Seen:** new OBPM 14.7 maintenance, 2026-11-23, first test.
- **Symptoms:** Source Code and Network Code LOVs empty; the Customer Service Model LOV showed only `ALL`.
- **Causes:**
  - the source / network queries used guessed objects (`PMTM_NETWORK_CODES`, `PMTM_SOURCE.SOURCE_DESC`). OBPM has
    `PMTM_SOURCE (SOURCE_CODE, DESCRIPTION, HOST_CODE)` and `PMTM_NETWORK (NETWORK_CODE, NETWORK_DESCRIPTION,
    HOST_CODE)`. A failing LOV query shows an empty list, not an error.
  - FCJ sends the field's current value as the LOV search (`rednFldval` in `ExtUIUtil.js disp_lov`). A field
    pre-filled with `ALL` lists only codes starting with ALL.
- **Fix:** take every LOV table and column from the OBPM entities (`PMEntities.jar`, `@Table`/`@Column` names; reference
  30 section 4.1 lists the common ones) and filter per `HOST_CODE`. For a pre-filled field, clear it before opening the
  LOV, or leave it blank and default on save (the user's choice).
- **Prevention:** `check_radxml.py` warns on the known wrong OBPM objects and on any LOV field with a default value.

## L12 - Screen title and menu show label codes
- **Seen:** new OBPM 14.7 maintenance (same applies to FCUBS), 2026-11-23.
- **Symptom:** the window title shows `Pmdclmts_Desc`; the menu shows `Pmdclmts_Main_Menu` / `_Sub_Menu_1/2`.
- **Cause:** ODT writes `SMTB_FUNCTION_DESCRIPTION` from the labels `LBL_<FID>_MAIN_MENU`, `_SUB_MENU_1`, `_SUB_MENU_2`
  and `_DESC`. If they are not maintained before Generate, it writes the codes themselves as text.
- **Fix:** update the texts (for OBPM, copy MAIN_MENU / SUB_MENU_1 from a sibling screen such as PMDCSMLK so the
  function sits in the same menu), and maintain the labels (Fetch Missing Labels) before the next Generate. The INC
  only INSERTs: on an existing function it fails with ORA-00001 and changes nothing.
- **Prevention:** `../skills/odt-customize/scripts/check_odt_zip.py` reports it (error for a new function, warning
  for an existing one). Maintain the menu labels before the first Generate.

## L13 - LOV finds nothing because of a NULL description
- **Seen:** new OBPM 14.7 maintenance, 2026-11-23: the source and network LOVs were empty while the tables had 17
  and 9 open, authorised rows for the user's host. Confirmed: their descriptions are NULL.
- **Symptom:** LOV window opens with `%` in every search box; Fetch gives `No Records Found for the Specified Criteria`.
- **Cause:** every LOV column marked as a reduction (search) field gets a `LIKE '%'` condition. `NULL LIKE '%'` is not
  true, so a nullable description column hides those rows. ODT and `gen_radxml.py` (before 0.6.8) made every column a
  search field.
- **Fix:** make only the code column a search field (`REDN_FLD_FLAG = N` on description / name columns), or select
  `NVL(<desc>, ' ')` with the same alias. Quick test: clear `%` from the description box and Fetch.
- **Prevention:** `gen_radxml.py` now makes only the first column a search field unless the spec sets
  `REDN_FLD_FLAG`. `check_radxml.py` warns about a searchable DESC/NAME column on LOVs of a function created in the
  current (non-KERNEL) release (proven: 5 warnings on the deployed radxml, none on the fixed one).

## L14 - OBPM: Authorize / Delete fail with ST-COM036 (field count mismatch)
- **Seen:** new OBPM 14.7 maintenance (CUSTOM, Java functions), 2026-11-23: New and Modify worked; Authorize and
  Delete showed `ST-COM036 Response is empty`.
- **Log:** `PMRequestParser-->some values are null --> 19~21`, then `java.lang.ArrayIndexOutOfBoundsException: 19 at
  PMRequestParser.getActualFieldValues`. The request's `<FN>` lists 21 block fields; the record has 19 values.
- **Cause:** two display-only DESC fields (customer name, service model description) had no column. New / Modify send
  the screen's values, but Authorize / Delete send the queried record, which has no values for non-database fields,
  so the OBPM parser runs out of values.
- **Fix:** store every block field in a column, as OBPM's own screens do (PMDCSMLK keeps `CUSTOMER_NAME` and
  `CUSTOMER_SERVICE_MODEL_DESC` in its table and fills them from the LOV). ALTER the table, map the fields (DBT/DBC,
  read only), regenerate (new DTO/entity), redeploy. Alternative: remove the fields.
- **Prevention:** `../skills/odt-radxml/scripts/check_radxml.py` reports an ERROR for a field without a data source
  column in an OBPM Java-functions radxml (ELCM_FUNCTION = Y). Proven on the deployed radxml (2 errors) and the
  fixed one (none). Reference 30 section 4.1 says to store descriptions.

## L15 - OBPM: processing hook never runs
- **Seen:** customer payment limit hook (`BO_VALIDATION`), OBPM 14.7, 2026-11-23: a 5,000 book transfer against a
  100 per-transaction limit was saved and authorised; no override, no error.
- **Log (user debug):** `AbstractBookTransferProcessor--> LOOKUP_KEY -- BO_VALIDATION`, then `Class Name not found
  return NULL`, `No Lookup Handler Class Found.` The key exists but `PMTM_EXTENSION_CLASSES.CLASS_NAME` is empty, so
  the kernel default runs. (`No record found # {Extension.findByPk ...}` means the key itself is missing.)
- **Cause:** the registration script was not run after deploying the jar. Also, the hook classes logged with
  `java.util.logging`, which never appears in OBPM's per-user debug file, so there was no sign they were skipped.
- **Fix:** run the registration (`UPDATE pmtm_extension_classes SET class_name = '<class>' WHERE key = '<KEY>'`),
  check with `SELECT key, class_name FROM pmtm_extension_classes WHERE key IN (...)`. Log from hooks with
  `com.ofss.pmts.logger.Logger.logDebug("<Class>-->" + msg, DebugLevels.INFO)`, as Oracle's classes do.
- **Prevention:** deployment steps put registration and its check SELECT right after the EAR deploy; reference 30
  section 5 names the log lines and the logger. Not mechanically checkable from the radxml or zip.

## L16 - OBPM: business-override hook sees no amount on book transfers
- **Seen:** `BO_VALIDATION` hook (customer payment limits), OBPM 14.7, 2026-11-23, book transfer (PBDOTONL): hook
  loaded and called (`Custom class initialised successfully`), but its debug showed `... INTERNALTF null null lcy
  null` and the 500 payment was not checked.
- **Cause:** `BookTransferTxnDetailAssembler.populateSanctionsPainDto` (read with `javap -c`) sets
  `Instdamt` = transfer amount, `Instdamtccy` and `Ccyoftrf` = transfer currency, `Eqvtamt` / `Eqvtamtccy` = debit
  amount / debit account currency, plus txn ref, customer, source, network and host. It does not set `xfrAmt`,
  `TxfrCcy`, `LcyAmt`, `lCcy` or `BookDate`.
- **Fix:** read `getxfrAmt() ?: getInstdamt()`, `getTxfrCcy() ?: getInstdamtccy() ?: getCcyoftrf()`; booking date from
  `HostCodeService.getHostDate(host)` (host business date, not the server date). LCY amount: the transfer amount
  when its currency is the host's local currency (`STTM_CORE_BRANCH.BRANCH_LCY` for the host), else the debit amount
  when the debit currency is local; otherwise fail safe.
- **Prevention:** reference 30 section 5.1 lists, per flow, which `CommonSchemaPainDto` fields are filled. Before
  using a DTO field in a hook, check the flow's assembler setters with `javap -c`. Log every input the hook uses, so
  a null shows up in the first test. Not mechanically checkable.

## L17 - OBPM: override message fails the save, and `$n` left in the text
- **Seen:** `BO_VALIDATION` limit hook, OBPM 14.7, 2026-11-23, book transfer of 400 against a 100 limit. Screen:
  `Payment amount $4 LCY exceeds the customer per-transaction limit 100 LCY  PM-CLMT-101`, `Failed to Save the Record`.
- **Log:** `message.getType():E`, `Final Error Type = E` (although `populateOverrideQueue` had started);
  `Substitutions Content:: [100, LCY, 0, 400]`, `Substitution length==>4`, yet `$4` stayed.
- **Causes:**
  - `PMMessageService.scanError` rolls the whole transaction back for any message of type `E`. The hook built
    `new Message(code, params)` with `setType(Message.ERROR)`.
  - `PMMessageService.replaceSubstitutions` turns `$1`, `$2`, `$3` ... into `{0}`, `{1}` ... in order and **stops at
    the first `$n` not found in the text**. The message used `$1 $2 $4` (no `$3`), so `$4` was never replaced.
- **Fix:** overrides from processing hooks use `setType(Message.WARNING)` (= `"O"`). The payment then goes to the
  business-override queue and the save succeeds. Number message parameters from `$1` without gaps; order the
  hook's parameters so every message uses a prefix (`$1..$k`).
- **Prevention:** reference 30 section 5.1 and the odt-static-data message rules. Before writing a message, check that
  its `$n` run without gaps. Not checked by a script (messages are SQL text).

## L18 - OBPM: hook writes survive a rolled-back payment
- **Seen:** `BO_VALIDATION` limit hook, OBPM 14.7, 2026-11-23: the payment failed to save (rolled back), but the usage
  row the hook wrote (`PMTB_CUST_PMT_LIMIT_USAGE`, status A) was still there, so it would count against the limits.
- **Cause:** the hook took its connection from the data source by JNDI (`jdbc/fcjdevDS`). OBPM runs the payment on the
  thread's EntityManager (`com.ofss.pmts.common.ThreadLocalEntityManager`: begin / commit / rollback), so a separate
  data-source connection is not in that transaction and commits on its own.
- **Fix:** use the payment's connection,
  `ThreadLocalEntityManager.getInstance().getEntityManager().unwrap(java.sql.Connection.class)`, as Oracle's own
  `EmsFileHandoffHelper` does; never close or commit it. Keep JNDI only as a logged fallback. Release the stray rows.
- **Prevention:** reference 30 section 4.1 ("Database access from Java") now says this. Test a rolled-back payment and
  check the hook's table. Not mechanically checkable.

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
