-- =====================================================================
-- Fallback template. Prefer filling the ODT-generated <mod>pks_<fid>_custom
-- body (Generate > Custom Package Spec/Body). Signatures below match the
-- FCUBS 14.7 generated maintenance custom package; diff against the
-- generated spec once it exists.
-- Placeholders: <mod> module (2 chars lower), <fid> function id lower,
--               <ds> master data source synonym lower (e.g. sttms_cust_risk_profile)
-- =====================================================================

CREATE OR REPLACE PACKAGE BODY <mod>pks_<fid>_custom AS

  PROCEDURE Dbg(p_Msg VARCHAR2) IS
  BEGIN
    IF Debug.Pkg_Debug_On <> 2 THEN
      Debug.Pr_Debug('**', '<mod>pks_<fid>_custom ==> ' || p_Msg);
    END IF;
  END Dbg;

  PROCEDURE Pr_Log_Error(p_Function_Id IN VARCHAR2,
                         p_Source      IN VARCHAR2,
                         p_Err_Code    IN VARCHAR2,
                         p_Err_Params  IN VARCHAR2) IS
  BEGIN
    Cspks_Req_Utils.Pr_Log_Error(p_Source, p_Function_Id, p_Err_Code, p_Err_Params);
  END Pr_Log_Error;

  PROCEDURE Pr_Skip_Handler(p_Stage IN VARCHAR2) IS
  BEGIN
    -- Example: skip kernel post default-and-validate
    -- IF p_Stage = 'POSTDEFAULTANDVALIDATE' THEN
    --   <mod>pks_<fid>_Main.Pr_Set_Skip_Kernel;
    -- END IF;
    NULL;
  END Pr_Skip_Handler;

  FUNCTION Fn_Post_Default_And_Validate(p_Source           IN VARCHAR2,
                                        p_Source_Operation IN VARCHAR2,
                                        p_Function_Id      IN VARCHAR2,
                                        p_Action_Code      IN VARCHAR2,
                                        p_Child_Function   IN VARCHAR2,
                                        p_<fid>            IN <mod>pks_<fid>_Main.Ty_<fid>,
                                        p_Prev_<fid>       IN OUT <mod>pks_<fid>_Main.Ty_<fid>,
                                        p_Wrk_<fid>        IN OUT <mod>pks_<fid>_Main.Ty_<fid>,
                                        p_Err_Code         IN OUT VARCHAR2,
                                        p_Err_Params       IN OUT VARCHAR2)
    RETURN BOOLEAN IS
  BEGIN
    Dbg('In Fn_Post_Default_And_Validate..');
    IF p_Action_Code NOT IN (Cspks_Req_Global.p_New, Cspks_Req_Global.p_Modify) THEN
      RETURN TRUE;
    END IF;

    -- R1: <requirement text>
    -- IF p_Wrk_<fid>.v_<ds>.<column> IS NULL THEN
    --   p_Err_Code   := '<MOD>-XXXX-001';   -- add to error-message maintenance
    --   p_Err_Params := NULL;
    --   Pr_Log_Error(p_Function_Id, p_Source, p_Err_Code, p_Err_Params);
    --   RETURN FALSE;
    -- END IF;

    -- Multi-record child: FOR i IN 1 .. p_Wrk_<fid>.v_<child_ds>.COUNT LOOP ... END LOOP;

    Dbg('Returning Success From Fn_Post_Default_And_Validate..');
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      Debug.Pr_Debug('**', 'In When Others of <mod>pks_<fid>_custom.Fn_Post_Default_And_Validate ..');
      Debug.Pr_Debug('**', SQLERRM);
      p_Err_Code   := 'ST-OTHR-001';
      p_Err_Params := NULL;
      RETURN FALSE;
  END Fn_Post_Default_And_Validate;

  -- Remaining hooks (Fn_Post_Build_Type_Structure, Fn_Pre/Post_Check_Mandatory,
  -- Fn_Pre_Default_And_Validate, Fn_Pre/Post_Upload_Db, Fn_Pre/Post_Query)
  -- exactly as generated, returning TRUE.

END <mod>pks_<fid>_custom;
/
