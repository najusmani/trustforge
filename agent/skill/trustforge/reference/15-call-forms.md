# 15 Call Forms
- Common processing reusable across screens (tax, charges, settlement); not launchable alone. Types: Maintenance (attach only to maintenance) and Transaction (only to transaction) — hook arguments differ.
- Header: 3rd char C (e.g. CFCTRCHG, ISCTRSTL), category Maintenance/Transaction, footer NONE for transaction unless process. Parent/child supported.
- Preferences: only SMTB_MENU and SMTB_FCC_FCJ_MAPPING needed; no browser menu labels / SMTB_FUNCTION_DESCRIPTION.
- Main screen needs Screen Arguments (usually master PK fields from caller); relationship with caller on master PKs. Arg fields not shown must still be in an invisible field set.
- Only Type XSD, named with `SubSys` prefix e.g. `SubSysTxnChgDtls-Types.xsd`; included in caller's type XSD; no Operation Id/Code. Amendables still maintained. No summary. Nested call/launch forms possible but rare.
- Deploy CSTB_CALL_FORM_NODES + SMTB_MENU scripts before attaching to main function.
- Main package: type conversion, fn_main, fn_check_mandatory, fn_default_and_validate, fn_query (each called by the CALLER's main package at the respective stage); uncalled fn_sys_* helpers.
- Hooks: Pr_Skip_Handler, Fn_Main, Fn_Pre/Post_Query, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Default_And_Validate, Fn_Pre/Post_Check_Mandatory, Fn_Pre/Post_Process (transaction call forms; called from caller's fn_process).

