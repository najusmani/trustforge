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
