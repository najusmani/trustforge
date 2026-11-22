# 27 - radxml file format (verified, FCUBS 14.7)

Not in the Oracle guides. Verified on 14.7.0.6.0 against:
- ODT's own code in `RAD.war`: `Script/JS/RadLoadandGen.js` (Loadradxml), `RadDeltaHandler_NonIE.js` (save / layer delta), `RadUtil.js` (fnPrepareConsolDOM, fn_Chekc_RelType, fnvalRel_Raddnode), `RadValidations.js` (fn_Chekc_RadXml).
- An Oracle KERNEL radxml (STDCUSAC) and a CUSTOM-origin radxml written by `gen_radxml.py`, which ODT loaded, saved and generated (STDCURSK). The file ODT saved matched the generated file except for the session values ENV_CODE and USER_ID.

Tooling: `skills/odt-radxml/scripts/gen_radxml.py` (spec -> radxml), `make_skeleton.py` (radxmls -> tag skeleton), `check_radxml.py` (load gate + cross references), and the bundled skeleton `skills/odt-radxml/templates/radxml_skeleton_14.7.xml`.

## File basics
- Root `RAD_FUNCTIONS`. No XML declaration. ODT writes CRLF and tab indentation; any well-formed whitespace loads.
- Every element of a repeating type carries `ID="<name>"` (e.g. `RAD_DATA_BLOCKS ID="BLK_X"`, `RAD_BLK_FIELDS ID="CUSTNO"`, `RAD_PARTITIONS ID="1"`). ODT looks elements up by ID.
- Empty values are empty elements (`<TAB_LABEL/>`). Keep every tag the skeleton has, even when empty, and keep the order.

## Header (root leaf tags, in this order)
`FUNCTION_ID, FUNCTION_TYPE (P parent / C child / S screen child), FUNCTION_CATEGORY (MAINTENANCE, TRANSACTION, ...), FUNCTION_ORIGIN (KERNEL/CLUSTER/CUSTOM), PARENT_FUNC_ID, PARENT_ORIGIN, ACTION (LOAD), GEN_ALL (Y), HEADER_TEMPLATE (NONE), FOOTER_TEMPLATE (MAINTAUDIT / NONE ...), RELEASE_TYPE, CALL_FORM_TYPE (DATA), LANG_CODE (ENG), OPERATION (GENERATE), ORIGINATION_DATE, USER_ID, RELEASE_CODE, SFR_NO, CHECKIN_MODE, SITE_CODE, ENV_CODE, PARENT_MODULE_ID, MODIFIED_IN_KERNEL/CLUSTER/CUSTOM/CUSTOMER (Y/N), PARENT_MODIFIED_IN_* (N), ORDER_CORRECTION_DONE (D), SUB_PROJECT, DELET_OLDNODES_DONE (Y), DDL_REMARKS, SVN_USER, SVN_PASS, XSD_COMMENTS_DEFAULT (D), TEMP_CORRECTION_DONE (Y)`, then the layer sections.
- ODT saves `RELEASE_CODE` blank and fills `USER_ID` and `ENV_CODE` from the session. Each element carries its release in its own `RELEASE_TYPE` and `RELEASE_NAME` (= release code, e.g. `FCUBS_14.7.0.6.0`).
- Footer template value is `MAINTAUDIT`, not "Maint Audit".

## Layer sections
| Function | Layout ODT saves |
|---|---|
| Created in KERNEL | `RAD_KERNEL` with everything |
| Created NEW in a CUSTOM release (FUNCTION_ORIGIN CUSTOM) | empty `<RAD_KERNEL/>` followed by `RAD_CUSTOM` with everything |
| KERNEL function changed in CUSTOM | full `RAD_KERNEL` + `RAD_CUSTOM` holding only the changed/added nodes (preferences, actions and summary are always copied) |
| Child function (C) / screen child (S) | extra `RAD_CHILD_<layer>` / `RAD_SCRCHLD_<layer>` sections |

ODT merges the layers on load (`customOnKernel` etc.) into a consolidated `RAD_KERNEL` working DOM, and on save writes back only the delta of the current release (`fnComparedsn`, `fnComparescreens`, ...).

### Load gate (messages you will see)
| Condition | ODT message |
|---|---|
| no `RAD_FUNCTIONS` | Load Valid RAD xml File |
| no `RAD_KERNEL` anywhere | **Non-Ext RAD xml Cannot Be Loaded** (code shown RD-VALS-00, which is only a default) |
| `RAD_NOTIFICATIONS` / `RAD_PURGE` present | Notification / Purge RAD xml File Cannot Be Loaded |
| `LANDING_PAGE_COMPONENT=Y` | customer landing page cannot be loaded in function generation |
| origin CUSTOM loaded in KERNEL or CLUSTER release | Function Orginated In Custom cannot be loaded in Kernel or Cluster |
| origin CLUSTER loaded in KERNEL release | Function Orginated In Cluster cannot be loaded in Kernel |
| `RAD_CUSTOMER` present in a CUSTOM release (or higher layers in lower releases) | Error in loading XML --Customer Node found in Custom Rad / Radxml Had Been Modified in Other Release |
| KERNEL file loaded in CUSTOM release | info: You are loading KERNEL RAD in CUSTOM Release (OK continues) |
| a header tag missing | Some Header Tags are Missing In Loaded xml Re-Convert the XML |

### Save validation (seen when pressing Save after Load)
| Code | Message | Fix |
|---|---|---|
| RD-VALS-027 | Primay Key Column X of datasource D is not included in datasource fields | every PK column must be a data source field mapped to a block field (hidden if not shown) |
| RD-VALS-60 | Duplicate Xsd Tag Names for Fields A and B in Block X | give every new field its own XSD_TAG |
| RD-SAVE-009 | Failed to process Request | follows the errors above |
`check_radxml.py` flags both. Details and the KERNEL-extension pattern: `28-extending-kernel-function.md`.

Load through **Function Generation > Action = Load** and its file field. The **Parent Xml** field is only for child / screen-child functions.

## Element order inside a layer section (as ODT 14.7 saves)
`RAD_FUNC_PREFERENCES, RAD_DATASOURCES*, RAD_SCREENS*, RAD_DATA_BLOCKS*, RAD_FIELDSETS*, RAD_LOVS*, RAD_ACTIONS, RAD_SUMMARY, RAD_CALLFORM*, RAD_LAUNCHFORM*` (+ `RAD_GLOBAL_LOVS`, `RAD_REST_ACTIONS` when used). Older Oracle files interleave them; order between groups does not matter to the loader.

## Elements and value codes
**RAD_FUNC_PREFERENCES ID="MENU"**: `MODULE_ID, MODULE_DESC, AUTO_AUTH, HO_FUNCTION, LOGGING_REQD, FIELD_LOG_REQD, EXPORT_REQD, MULTI_BRANCH_ACCESS (+TXN_BLOCK_NAME/TXN_FIELD_NAME), TANK_MODIFICATIONS, BRANCH_PROGRAM_ID, PROCESS_CODE, GW_FUNCTION, ELCM_FUNCTION, MODULE_AUTO_AUTH ...`, then one `MENU_DETAILS ID="<fid>"` per menu row (`FUNCTION_ID, FUNC_MODULE_ID, CONTROL_STRING, FUNC_MODULE_DESC, LBL_FUNCTION_DESC ...`). `CONTROL_STRING` is 16 chars of 1/0; Oracle maintenance screens use `1111111100000000`. Add a row for the summary id (`STS....`).

**RAD_DATASOURCES ID="<synonym>"**: names are the synonyms (`STTMS_...`, an S before the first underscore). `MASTER_DATASRC Y/N, PARENT_DATASRC, RELATION_WITH_PARENT ("PARENT.COL = CHILD.COL AND ..."), RELATION_TYPE 1|N, MULTI_RECORD, PK_COLS/PK_TYPES (~), DEFAULT_WHERE, DEFAULT_ORDER_BY, DATASRC_TYPE NORMAL|QUERY|INONLY, IS_MANDATORY, REST_* (REST metadata)`. Children: one `RAD_FIELDS ID="<COLUMN>"` per column used (`COLUMN_NAME, DATATYPE, MAX_LENGTH (NUMBER = 22, DATE = 7), BLOCK_NAME, DBC, FIELD_NAME, MAX_DECIMALS`), placed before the trailing `UPLOAD_TABLE, UP_TBL_PK_COLS, UP_TBL_WHERE_CLAUSE`. Do not list Maint Audit columns.

**RAD_DATA_BLOCKS ID="BLK_..."**: `BLOCK_TYPE NORMAL, MASTER_BLOCK, MULTI_RECORD, BLOCK_PARENT, RELATION_TYPE 1|N, BLK_PK_FLD (~ field names), XSD_NODE (Risk-Master style), BLOCK_TITLE, DATA_BLK_ORDER, NEW_ALLOWED_IN / DELETE_ALLOWED_IN / ALL_RECORDS / MANDATORY_IN` (= `MODIFY` to allow in Modify: these are the block-level amendables). Children: `BLK_DATASOURCES ID=<ds>` (`DATASOURCE_NAME`), then `RAD_BLK_FIELDS`.

**RAD_BLK_FIELDS ID="<FIELD>"**: `FIELD_NAME, XSD_TAG (= field name), LABEL_CODE (LBL_<field>), DATATYPE, MAX_LENGTH, FIELD_SIZE, MAX_DECIMALS, MIN_VAL/MAX_VAL, REQUIRED, DISPLAY_TYPE, ITEM_TYPE, DBT (data source) + DBC (column), FIELDSET_NAME, READ_ONLY, VISIBLE, CHK_UPPERCASE, DEFAULT_VALUE, LOV_NAME, LOV_VAL_REQ, PARENT_FIELD (DESC), RELATED_BLOCK/RELATED_FIELD (AMOUNT currency), TXTAREA_ROWS/COLS, AMENDABLE_IN (MODIFY = amendable on Modify), BLOCK_PK_FLD, NOT_REQD_IN_XSD, BLK_FIELD_ORDER, FLD_ANNOTATION (XSD doc text), FLD_COMMENT_ID ...`
- `DISPLAY_TYPE`: TEXT, LOV, DATE, SELECT, CHECKBOX, RADIO, TEXTAREA, RESTRICTED_TEXT, AMOUNT, BUTTON, LABEL (plus DATETIME, MASK, PASSWORD, FILE ... per guide 04).
- `ITEM_TYPE`: `DBITEM` (database), `DESC` (description: no DBT/DBC, needs PARENT_FIELD whose LOV returns into it), `CONTROL` (UI-only, buttons/labels).
- Nested, after the leaf tags: `RAD_BIND_VARS ID=<name>` (`BIND_VAR_NAME, BIND_VAR_TYPE, BIND_VAR_BLK`, one per `?` in LOV order), `RAD_RETURN_FIELDS ID=<query col>` (`QUERY_COLUMN, RETURN_BLK_NAME, RETURN_FLD_NAME`; a blank target means the column is not returned), `RAD_FIELD_CUSTOM_ATTRS ID=<label>` (`ATTR_NAME` = label code, `ATTR_VALUE` = stored value, `ATTR_POSITION, ACTIVE`; CHECKBOX uses `ON`/`OFF` names with Y/N values), `RAD_FIELD_EVENTS` (`EVENT_NAME, FUNCTION_NAME, EVENTTYPE, BUTTON_SCREEN, CALLFORM_NAME, SCREEN_NAME`).

**RAD_SCREENS ID="CVS_..."**: `SCREEN_TITLE, SCREEN_POSITION TEMPLATE, EXIT_BUTTON_TYPE (1 or 2; main maintenance screens 1), MAIN_SCREEN, SCREEN_SIZE SMALL|MEDIUM|LARGE, SCREEN_VISIBLE, SCREEN_OBIEE, SCREEN_QUERYREQ, IMGFLD_QUERYREQ`, then `HEADER ID=HEADER`, `BODY ID=BODY`, `FOOTER ID=FOOTER`.
- HEADER and BODY carry leaf tags `TAB_VISIBLE Y, DEPENDENT_ON, RELEASE_TYPE, RELEASE_NAME, TAB_TYPE SERVICE, TAB_LABEL, TAB_NAME, SCREEN_NAME` (ODT fills release only on BODY). FOOTER carries only its tab.
- `RAD_TABS ID=TAB_...` (`TAB_NAME, SCREEN_NAME, TAB_LABEL, TAB_INDEX` (running number over header+body tabs), `TAB_ORDER, TAB_VISIBLE, TAB_TYPE DATA|SERVICE, DEPENDENT_ON`). TAB_HEADER and TAB_FOOTER always exist; with a Maint Audit footer TAB_FOOTER has no sections.
- `RAD_SECTIONS ID=SEC_...` (`SECTION_NAME, SCREEN_PORTION, TAB_NAME, SEC_ORDER, SEC_VISIBLE, SECTION_LBL, COLLAPSE, MULTIPLE_SEC`), then `RAD_PARTITIONS ID=1..n` (`PARTITION_SL_NO, PARTITION_NAME, PARTITION_WIDTH, NO_OF_SUBPARTITIONS`) at the end of the section.

**RAD_FIELDSETS ID="FST_..."**: `FIELDSET_SCREEN, FIELDSET_PORTION, FIELDSET_TAB, FIELDSET_SECTION, FIELDSET_PARTITION, FIELDSET_BLOCK, VIEW_TYPE SINGLE|MULTIPLE, MULTI_RECORD, ROWS_PER_PAGE, FIELDSET_LABEL, FIELDSET_VISIBLE, FIELDSET_READ_ONLY, HORIZONTAL_FIELDSET, NAV_BUTTONS_REQ, FIELDSET_ORDER, FIELDSET_TYPE Normal`, then `FIELDSET_FIELDS ID=<field>` (`FIELD_NAME, ACTIVE, FIELD_ORDER, SUBPARTITION_NAME`). Only one MULTIPLE field set per block (ODT save validation).

**RAD_LOVS ID="LOV_..."**: `LOV_NAME, LOV_QUERY (? binds), LOV_STATUS I`, then `RAD_LOV_DETAILS ID=<col>` (`QUERY_COLS, DATATYPE, VISIBLE, REDN_FLD_TYPE TEXT, COL_HEADING (label), REDN_FLD_FLAG, IS_INDEXED, MIN_SEARCH_CHAR_LEN`). Global LOVs used by the function appear as `RAD_GLOBAL_LOVS`.

**RAD_SUMMARY ID="SUMMARY"**: `TITLE, RSLT_DATASRC, RSLT_DATABLK, SUMMARY_TYPE S, SUM_SCREEN_SIZE, SUM_QUERYORDER / SUM_RESULTORDER (~ field names), RAD_SUMMARY_WHERECLAUSE, RAD_SUMMARY_ORDERBY, RAD_MULTIBRN_WHERECLAUSE, NUMBER_OF_ROWS, BLIND_SEARCH, SUMMARY_WEBSERVICE_REQD`, then `SUMMARY_DETAILS ID=<field>` (`FIELD_NAME, QUERY Y/N, LOV_NAME, RETURN_FLDS (FLD~), BIND_FLDS, MIN_CHAR_LEN, LOV_QUERY_REQ`). Fields come from RSLT_DATABLK. Max 12 query fields.

**RAD_ACTIONS**: `REST_ENABLED, REST_MICRO_ENABLED, REST_CACHE_ENABLED, OPERATION_ID, SERVICE_NAME, RAD_XSD_TYPE_NAME, REST_SERVICE_NAME`, then one `RAD_ACTION ID=<code>` per action: QUERY(2) NEW(2) MODIFY(2) AUTHORIZE(1) DELETE(1) CLOSE(1) REOPEN(1) REVERSE(1) ROLLOVER(1) CONFIRM(1) LIQUIDATE(1) SUMMARYQUERY(2) (number = `ACTION_STAGE_TYPE`), with `OPERATION_CODE` (e.g. CreateCustAcc) and `WEBSERVICE_APPLICABLE` Y only when a gateway operation exists.

**RAD_CALLFORM ID=<fid>** (note the Oracle spelling `CALLFORM_FUCNTIONID`): `CALLFORM_RELATION_TYPE 1, CALLFORM_RELATION, CALLFORM_PARENT_DATASRC, CALLFORM_PARENT_BLOCK, CALLFORM_DISPLAY_TYPE BUTTON, SCREEN_ARGS (ARG~BLK__FLD~:ARG2~...), CALLFORM_MST_DATA_SRC, CALLFORM_MST_BLOCK, CALLFORM_MST_XSD_NODE, CALLFORM_MODULE, CALLFORM_ACTIVE`.
**RAD_LAUNCHFORM ID=<fid>**: `LAUNCHFORM_FUCNTIONID, SCREEN_ARGS, LAUNCHFORM_ACTIVE, FORM_TYPE LF`.

## What ODT generates (Generate dialog, new CUSTOM maintenance function)
Tick: Screen Xml, System JS, Main Package Spec/Body, **Custom Package Spec/Body**, Menu, Datasource, LOV, Block, Screen, Amendable, Summary, XSD, Label Details, Block PK Columns, Xsds. Kernel/Cluster packages are greyed out in a CUSTOM release.
The zip holds `INC/` (CSTB_FID_DATA_BLOCKS, CSTB_FID_DATA_SOURCES, CSTB_FID_SCREENS, CSTB_FID_SCR_TABS, CSTB_FIELD_LABELS, CSTB_OTHER_LABELS, CSTB_LOV_INFO, CSTB_SUMMARY_INFO, GWTB_/GWTM_AMEND_*, GWTM_OPERATIONS_MASTER_FG, SMTB_FCC_FCJ_MAPPING, SMTB_FUNCTION_DESCRIPTION, SMTB_MENU, SMTB_ROLE_DETAIL, STTB_AUDIT_PK_COLS), `JS/<FID>_SYS.js`, `RADXML/`, `SPC/` and `SQL/` (`<mod>pks_<fid>_main`, `<mod>pks_<fid>_custom`), `UIXML/ENG/<FID>.xml`.

## Generated PL/SQL facts (use in hook code)
- Record type `<mod>pks_<fid>_Main.ty_<fid>` with one member per data source: `v_<synonym lower case>` (`%ROWTYPE` of the table) for single-record sources, and a PL/SQL table `ty_tb_v_<synonym>` for multi-record sources; plus `Desc_Fields` and `Addl_Info`.
- Hook functions in `<mod>pks_<fid>_custom`: `Fn_Post_Build_Type_Structure, Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Query`, plus `Pr_Skip_Handler(p_Stage)`. Default-and-validate hooks get `p_<fid>` (request), `p_Prev_<fid>` (record before change) and `p_Wrk_<fid>` (working/merged record).
- Action constants: `Cspks_Req_Global.p_New, p_Modify, p_Auth, p_Delete, p_Close, p_Reopen, p_Query, p_Version_Delete`.
- Errors: the generated custom body has `Pr_Log_Error(p_Function_Id, p_Source, p_Err_Code, p_Err_Params)` (wraps `Cspks_Req_Utils.Pr_Log_Error`). Set `p_Err_Code/p_Err_Params`, call `Pr_Log_Error`, then `RETURN FALSE`. The generated `WHEN OTHERS` returns `ST-OTHR-001`. Debug: `Dbg(msg)` / `Debug.Pr_Debug`.
- MAIN calls the custom hook only when `NOT <mod>pks_<fid>_Main.Fn_Skip_Custom`; skip/activate with `Pr_Set_Skip_Custom / Pr_Set_Activate_Custom` (and `_Sys` for the system layer).
- Application date: `Global.Application_Date`.
