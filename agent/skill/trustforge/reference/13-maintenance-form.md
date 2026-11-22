# 13 Maintenance Form (worked example STDCIFD)
- Header: New, Function Id with 3rd char D (8 chars), Type Parent, Category Maintenance, Header Template None, Footer Template Maint Audit (master table must have audit columns; don't add them as fields).
- Preferences: control string without REVERSE/ROLLOVER/CONFIRM/LIQUIDATE/HOLD. Browser menu labels required: `LBL_<FID>_MAIN_MENU`, `LBL_<FID>_SUB_MENU_1`, `LBL_<FID>_SUB_MENU_2`, `LBL_<FID>_DESC`.
- PK Cols/Types mandatory else package generation fails. Master DS no parent; DS cannot be own parent. Only Max Length editable on DS columns.
- LOV example with bind: `SELECT cust_ac_no, branch_code, ccy FROM sttms_cust_account WHERE cust_no = ? AND record_stat = 'O' AND once_auth = 'Y' AND ac_stat_de_post = 'Y'`. Redn/Col labels mandatory or LOV errors at runtime.
- Call form button: add UI field (display Button) via Add Fields > UI Fields; Call Form node entry; button event type Call form (button rendered at bottom) or Normal + release JS to place it anywhere.
- Summary: add summary function id row (e.g. STSCIFD) in Preferences menu grid first.
- Amendables: Actions node > Amendables button per action > pick fields per block that are modifiable on unlock.
- Test: deploy, launch in FLEXCUBE, try NEW/MODIFY/QUERY etc.
- **Hook package functions** (Kernel/Cluster/Custom, same structure): `Pr_Skip_Handler`, `Fn_Post_Build_Type_Structure` (adjust incoming values), `Fn_Pre/Post_Check_Mandatory`, `Fn_Pre/Post_Default_and_Validate`, `Fn_Pre/Post_Upload_Db`, `Fn_Pre/Post_Query`.
- **Call flow** (e.g. check mandatory): MAIN.Fn_Check_Mandatory -> CUSTOM.Fn_Pre -> CLUSTER.Fn_Pre -> KERNEL.Fn_Pre -> MAIN.Fn_Sys_Check_Mandatory -> KERNEL.Fn_Check (post) -> CLUSTER -> CUSTOM. Package names `<MODULE>PKS_<FID>_MAIN/_KERNEL/_CLUSTER/_CUSTOM` (e.g. STPKS_STDCIFD_MAIN).
- **Bypass** lower layer hooks: `PR_SET_SKIP_<RELEASE_TYPE>` / `PR_SET_ACTIVATE_<RELEASE_TYPE>` (in main package); generated `FN_SKIP_<RELEASE_TYPE>` decides. Prefer putting validations in Fn_Post_Default_and_Validate, not Pre stages.
- Release JS `<FID>_<RELEASE>.js` e.g. STDCIFD_CLUSTER.js with fnPreLoad_CLUSTER / fnPostLoad_CLUSTER / fnPreNew_CLUSTER / fnPostNew_CLUSTER.
- Menu scripts listed for maintenance: SMTB_MENU, SMTB_FCC_FCJ_MAPPING, SMTB_ROLE_DETAIL (+ function description).

