# 11 Test Case Management (TCM)
- Stores maintenance/online test cases (uploaded Excel), groups into Run Charts, executes against FLEXCUBE or web services. Roles: admin creates release, release admin creates users (same user id must exist in FLEXCUBE), TCM user runs it.
- **Block Detail Upload**: txt list of radxmls (call forms listed ABOVE main function; `DIR /B /S > Files.txt`); fills TCTM_BLOCK_DETAILS, TCTB_BLOCK_DETAILS, TCTM_FID_CALL_FORMS, TCTM_FID_FUNCTIONS, TCTM_BLOCK_IO_TAGS. Redo whenever source changes.
- **Excel Template Generation**: from radxml list (redo after block detail upload when source changes).
- **Test Case Definition** (TCTM_TC_MASTER, TCTB_TC_MASTER): Function Id + Action Code (New/Modify/Reverse/Liquidate/Auth/Close) for FCUBS requests; Service Name + Operation Code for web services.
- **Test Case Upload** (TCTB_BLOCK_DATA, TCTM_BLOCK_DATA): each data column in sheet = one test case (`COUNTRY_CODES_01`, `_02`). Master block Parent Record Id null; non-master not null; all values as strings (prefix apostrophe for dates/numbers, e.g. `'2010/02/02`); .xls (Excel 2003) only.
- **Create Request**: view generated FLEXCUBE / web-service XML (query only).
- **Test Case Execution** (TCTB_TC_EXEC_MASTER, TCTB_TC_CURR_DATA): Source Type FLEXCUBE/Web Services, Action on override (ignore / stop with error), Auto Authorization, status.
- **Run Chart Master** (TCTM_RC_MASTER, TCTM_RC_TCS): sequence numbers mandatory. **Run Chart Execution** (TCTB_RC_EXEC_MASTER + above): auto-auth toggle, view request/response, ~20 test cases at a time.
- **Derivation**: use another test case's output as input: `D:TESTCASENAME:BLOCKNAME:FIELDNAME` (e.g. `D:TC_FXDTRONL_NEW_CONTRACT_FSC2:BLK_CONTRACT_MASTER:CONTREFNNO`).
- **Data migration between releases**: possible non-ext to non-ext and ext to ext, NOT non-ext to ext. Steps: export to Excel in FCUBS, create TCs on release-1 sources + upload, run chart, block-detail-upload release-2 radxmls, fix changed fields, execute. Base release data can be migrated at release creation.

