# 25 Gateway Screen and LOV Enhancer
- **Gateway screen**: design like a normal maintenance screen but tick "gateway screen" in Preferences; generation offers only front-end units, XSDs and INCs; code must be written in the gateway flow.
- **LOV Enhancer**: map screen LOVs to External (data entirely from external system) or Combined (external + internal; specify external LOV bind variables and reduction fields). Generates INC like: `UPDATE CSTB_LOV_INFO SET LOV_TYPE='E' ...` (external), `LOV_TYPE='C'` (combined), and rows in `CSTB_CMB_LOV_INFO (FUNCTION_ID, LOV_ID, EXTERNAL_LOV_ID, LOV_FUNCTION, REDUCTION_LIST, BIND_LIST)`, e.g. `('STDCIF','LOV_AML_CUST_GRP','LOV_EXT_AML_CUST','fn_function()','','1~')`.

