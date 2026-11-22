# 14 Online (Transaction) Forms
- Contract screens, launched independently. Example LC module: LCDTRONL contract input, LCDAMEND amend confirmation, LCDAVMNT availment, LCDTRPAY payment, LCDTRANF transfer, LCDEPMNT manual liquidation, LCDTREAS reassign, LCDTRAUT authorization. User actions like Product Default, Enrich, Subsystem Pickup, then Save.
- Header: 3rd char D, Category Transaction, Footer Template NONE (design footer manually with TXNSTAT, AUTHSTAT) or PROCESS for online process-flow screens. Parent/Child supported.
- Preferences: module mandatory; SMTB_MENU type string `O`; tick transaction actions in control string (LIQUIDATE, ROLLOVER, REVERSAL...).
- Master DS single-entry; minimize views; for transactions `fn_sys_upload_db` is NOT called automatically (don't use it if views are data sources). Summary typically uses a dedicated view e.g. `LCVWS_FCJ_CONTRACT_SUMMARY`.
- Reserved master block fields: CONTRACT_STATUS=TXNSTAT, AUTH_STATUS=AUTHSTAT, SUBSYSTEM_STAT=SUBSYSSTAT (TXNSTAT/AUTHSTAT usually in footer).
- Multi-tab: TAB_HEADER = header info, TAB_MAIN first body tab. Hidden-but-defaulted fields must still be in a (invisible-field) field set or JS errors occur.
- XSDs: Type + operation message XSDs, e.g. `LC-Contract-Types.xsd`, `LC-CreateContract-Req-Full-MSG.xsd`, `-Req-IO-MSG`, `-Res-Full-MSG`, `-Res-PK-MSG`. Operation Id/Code needed.
- Call forms: map Parent Data Block/Source + relation; screen arguments; dependent fields; subsystem pickup coded by developer in hook packages and invoked from main form package.
- **SUBSYSSTAT** protocol: string like `MICTRMIS:D;ISCTRSTL:D;TACTRTAX:D;CSCTRUDF:D;CFCTROCH:D;CSCTRADV:D;FTCCGCLM:D;`. `D` = default (first visit, action code SUBSYSPKP defaults ALL subsystems; code in Fn_Post_Subsys_Pickup; save without visiting also defaults all), `U` = user modified, upload, `R` = dependent field changed, re-default (user edits lost).
- Generated: `LCDTRONL.xml`, `LCDTRONL_SYS.js`, hand-written `LCDTRONL_KERNEL/CLUSTER/CUSTOM.js`; `Lcpks_Lcdtronl_Main.spc/.sql`, `Lcpks_Lcdtronl_Kernel/Cluster/Custom.spc/.sql`.
- Online main package functions (each calls hooks; NO business logic or inserts generated): type conversion, fn_main, fn_resolve_ref_numbers, fn_check_mandatory, fn_product_default, fn_subsys_pickup, fn_enrich, fn_default_and_validate, fn_upload_db, fn_process, fn_query. Also uncalled helpers fn_sys_check_mandatory, fn_sys_default_and_validate, fn_sys_upload_db, fn_sys_query — call explicitly from hooks if wanted.
- Online flow: upload to base tables first, then process inserted data, then build response.
- Online hook functions: Pr_Skip_Handler, Fn_Main, Fn_Pre/Post_Resolve_Ref_Numbers, Fn_Pre/Post_Unlock (validations/modification of existing contract), Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Query, Fn_Pre/Post_Product_Default, Fn_Pre/Post_Subsys_Pickup, Fn_Pre/Post_Enrich, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Process (call server processing functions).

