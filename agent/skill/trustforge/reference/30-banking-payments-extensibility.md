# 30 Oracle Banking Payments (OBPM) 14.7 extensibility

This file condenses Oracle's "Extensibility" set for **Oracle Banking Payments 14.7.0.0.0** (Dec 2022,
docs.oracle.com/cd/F74675_01/extensibility.htm). It covers:
- Getting Started;
- Reference Guide;
- Custom RAD Extensibility, Maintenance Screens;
- Custom RAD Extensibility, Transaction Screens;
- Extensibility_Hooks.xlsx.

OBPM sits on the same RAD/ODT framework as FCUBS. The PL/SQL rules below match FCUBS (files 05, 13, 14, 28). The
Java screens and Java hook classes are specific to OBPM. Read this file when the job is on a Payments (PM/PX/PA/PW/PN)
function or the user mentions OBPM.

## 1. Layers and release type
- **Releases.** Development is split into KERNEL (Oracle's base), CLUSTER (a region or feature base) and CUSTOM (one
  bank). The hierarchy is either Kernel -> Cluster -> Custom or Kernel -> Custom.
- **Where code goes.** Each team writes only in its own units. Kernel provides empty Pre/Post placeholders for the
  layers above.
- **Deployed release type.** `SMTB_PARAMETERS`, parameter `RELEASE_TYPE`, holds the deployed release type. At runtime,
  hooks of layers above it are not called: on a KERNEL deployment neither the CLUSTER nor the CUSTOM hooks run; on a
  CLUSTER deployment the CUSTOM hooks do not run.
  - Check it first when a CUSTOM hook never fires (lesson L5).
  - FCUBS shows the same value in debug as `The release type is:CUSTOM` (`CSPKS_REQ_GLOBAL.G_RELEASE_TYPE`).
- **Areas you can extend:** screen design (RAD), front-end JavaScript, the code generator, and back-end PL/SQL.

## 2. Front end (application layer)
- RAD generates the radxml, the UIXML (language XML: screens, sections, partitions, blocks, field sets, fields; rendered
  through XSL) and JavaScript.
- **`<FID>_SYS.js`** is generated and must never be edited. It declares `msgxml` (request XML), `dataSrcLocationArray`
  (blocks), `relationArray`, the data binding, `retflds` / `bndFlds` (LOVs), `CallFormArray` / `CallFormRelat` /
  `CallRelatType`, and `actionsAmmendArray` (fields enabled per action).
- **Release JS** files are `<FID>_KERNEL.js`, `<FID>_CLUSTER.js` and `<FID>_CUSTOM.js`, with layer-suffixed handlers:
  - load events: `fnPreLoad_<LAYER>()` / `fnPostLoad_<LAYER>()`;
  - action events: `fnPreNew_<LAYER>()` / `fnPostNew_<LAYER>()` and the same pattern for other actions.
- A higher layer **overrides** a lower layer's function by defining the same function in its own file. To change a
  KERNEL function, CLUSTER or CUSTOM redefines it.

## 3. Back end, maintenance function IDs (PL/SQL, same as FCUBS)
- **Generated packages.** RAD generates `<MOD>PKS_<FID>_MAIN` plus the hook packages `_KERNEL`, `_CLUSTER` and
  `_CUSTOM`.
  - The template is `<Module>PKS_<FunctionID>_<ReleaseType>`, for example `PAPKS_PADOVIEW_CUSTOM`.
- **MAIN stages:** convert the request to the PL/SQL composite type, check mandatory fields, default and validate,
  upload to the database, query, and convert back.
  - Every stage has Pre and Post hooks in each layer.
  - MAIN is generated code: never edit it.
- **Hook functions** (same in every layer):
  - `Fn_Post_Build_Type_Structure`
  - `Fn_Pre_Check_Mandatory` / `Fn_Post_Check_Mandatory`
  - `Fn_Pre_Default_and_Validate` / `Fn_Post_Default_and_Validate`
  - `Fn_Pre_Upload_Db` / `Fn_Post_Upload_Db`
  - `Fn_Pre_Query` / `Fn_Post_Query`
- **Call order** (example Check Mandatory):
  1. MAIN
  2. CUSTOM.Pre
  3. CLUSTER.Pre
  4. KERNEL.Pre
  5. `MAIN.Fn_Sys_Check_Mandatory`
  6. KERNEL.Post
  7. CLUSTER.Post
  8. CUSTOM.Post
- **Where validations go:** in `Fn_Post_Default_and_Validate`, not in Pre stages.
- **Ownership:** each team edits only its own layer's package.
- **Helper functions:** never change the generated structure of a hook package. Put helpers in a new package (Oracle's
  example is `STPKS_STDCIFCR_UTILS`) and call it from the hook.
- **Skipping a parent layer:** the generated `FN_SKIP_<RELEASE>` functions decide whether a layer's hook runs.
  - Call `PR_SET_SKIP_KERNEL` / `PR_SET_SKIP_CLUSTER` (in MAIN) to bypass a parent layer.
  - **The skip stays on until `PR_SET_ACTIVATE_<LAYER>` is called.** Activating it again after skipping, for
    example, KERNEL `Fn_Pre_Default_and_Validate` still skips KERNEL `Fn_Post_Default_and_Validate` for that stage
    pair. If only the Pre logic should go, call the parent's Post function explicitly from your own layer.
  - CUSTOM may skip both KERNEL and CLUSTER.
- **Field paths in hooks:** `p_wrk_<fid>.v_<data source>.<column>`, for example
  `p_wrk_stdcifcr.v_sttms_customer.CUSTOMER_NAME1`. Read the block and field names from the radxml in ODT.
  - The example in Oracle's guide assigns `p_Wrk := p_<fid>` before it validates. Do that only when you mean to
    discard the merged working record.

## 4. OBPM-specific: Java screens (Custom RAD extensibility)
OBPM screens (for example maintenance `PMDHSTPR`, Fedwire transaction `PWDOTONL`) also have a Java layer. Oracle's
example adds a custom table to an existing screen:
1. In ODT, User Preferences: set the **Custom** release and the environment.
2. Function Generation: load the screen's radxml.
3. Create the custom table. Add it as a new data source with a relationship to the master, for example
   `STTMS_HOST_PARAM.HOST_CODE = CUSTOM_TEST.FIELD1` or `PWTBS_BRANCH_OUT_TXN.TXN_REF_NO = CUSTOM_TEST.NUM1`.
4. Add a block with the fields.
   - The key column that links to the parent must be a block field **and** in a field set. It may be hidden.
   - It must be listed in **Block PK Columns**.
5. Add a field set and place it in a section (header or body).
6. Generate with **Java functions** ticked in Preferences and **Java Classes** ticked on Generate. The local RAD
   utility can also be used.
7. Add the generated artifacts to the project and deploy the Java classes, UIXML and JS.

The generated Java:
- **Common and entity classes** replace the kernel ones.
- **Custom classes** get their own names (for example `HstParamCustomSys.java` beside `HstParamSys.java`, and
  `BrnFwOutTxnCustomSys.java`). They extend the kernel classes, so kernel behaviour is kept.
- **Business logic and validations** go in `<MasterBlockName>Custom.java` (for example `HstParamCustom.java`,
  `BrnFwOutTxnCustom.java`).

This is the OBPM counterpart of the FCUBS 1:1 custom table pattern (file 28). The same rules apply: the key column is
present as a field, the Block PK Columns are generated, and only the custom layer is edited.

## 5. OBPM-specific: Java processing hooks (`PMTM_EXTENSION_CLASSES`)
- **Mechanism.** Payment processing calls Java extension points by **KEY**. The table `PMTM_EXTENSION_CLASSES (KEY,
  CLASS_NAME)` maps a key to the implementing class.
  - The bank writes a class implementing the hook interface. The shipped example is
    `com.ofss.pmts.dispatcher.ExtAccCheckReqHandlerCustom` for `EXTACC_CHECK_REQD`.
  - Register the class against the key; the kernel then calls it instead of, or in addition to, its default.
- **Hooks in the workbook.** Each key's interface is `I<Name>.java`.

| KEY | Module | Interface | Purpose (inputs -> output) |
|---|---|---|---|
| MT_POPULATE_FIELD21 | PM | IPopulateField21 | Outgoing MT910 field 21 from incoming MT103 field 70 |
| MT_BLOCK3_DERIVE | PM | IPopulateMTBlock3 | Extra block 3 fields (host, network, priority, date, dcn -> block 3 text) |
| MT_POPULATE_ORD_CUST | PM | IPopulateOrderingCustomer | Outgoing 50K from incoming MT101 50H |
| MT_ENRICH_AWI | PM | IAcctWithInstEnrich | Account-with institution enrichment (field 72 BIC) |
| BEN_DEFAULT / MT_DERIVE_MSG_TYPE / MT_SNDR_RCVR_INFO | PX | IBenInstDerive / IMTDeriveMsgType / IPopulateMTSndrRcvrInfo | Beneficiary institution defaulting, message type derivation, field 72 |
| MT_ORD_INST | PX | IPopulateMTOrderingInst | Ordering institution when missing in incoming message |
| ADVICE_GEN | PM | IAdviceGenerationService | Extra confirmation advice |
| ADVICE_POPULATE | PX | IAdvicePopulateService | Custom tags in advices (with `PMTM_ADV_FORMAT_DET`) |
| ACHOUT_ENRICH_VAL | PM | IAchOutTxnEnrichValidator | Validation on Enrich in `PADOTONL` |
| PXOUTENRICHVAL | PM | IXborderOutTxnValidator | Defaulting/validation on Enrich in cross-border outgoing |
| MT202COV_GENERATE | PM | IMT202CovGenerator | Force MT202 COV generation (dcn, transfer type -> cover, cover network) |
| DERIVE_CHARGE_WHOM | PM | IDeriveChargeWhom | Charge bearer (e.g. charges on MT202) |
| REPAIR_CHARGE_SKIP | PM | IRepairChargeSkipService | Waive repair-queue charges (pricing inputs -> boolean) |
| SANCTION_CHECK_REQD | PX | ISanctionCheckReqdHandler | Decide whether sanctions check runs |
| COVER_MATCH | PX | ICoverMatchHandler | Move a contract to the cover match queue by rule |
| BIC_CUTOFF_CHECK | PX | IBicCutOffHandler | Skip the network cut-off check / queue move |
| MSG_PROCESSING_SKIP | - | IMessageProcessingSkipService | Skip message processing and dispatch (DispatchDto -> boolean) |
| TXN_REF_GENERATE | PX | ITxnRefGenerationService | Custom transaction reference for non-UI channels |
| VIRTUAL_ACC_DERIVE | - | IVirtualAccountDeriveXborder | Derive the credit account (virtual accounts) |
| COID_DEFAULT | - | ICoIdDeriveService | Derive company id |
| RTGS_SKIP_VAL | PM | IRtgsSkipValidationService | Skip RTGS validations by payment type |
| BO_VALIDATION | - | IBOValidationHandler | Business-override validations, book transfer |
| BO_EXT_VALIDATION | - | IExtBOValdiationHandler | External business-override validation, cross-border |
| BEN_DERIVE | - | IBeneficiaryDeriveService | Beneficiary / credit account derivation |
| NONSTP_KEY | - | INonStpHandlerService | Non-STP queue decision |
| BLOCK3_SKIP | PX | IBlock3SkipService | Remove block 3 (txn ref, msg type, network -> boolean) |
| EXTACC_CHECK_REQD | - | (class ExtAccCheckReqHandlerCustom) | External account check required |

Other keys in `PMTM_EXTENSION_CLASSES` without a documented interface: `ACCOUNTING`, `FX_LIMIT`,
`CNAPS_BEN_VALIDATE`, `ACH_OUT_RETURN_VALIDATION`, `ACH_IN_RETURN_VALIDATION`, `NARRATIVE`.

Interfaces and parameters vary by patch set: the workbook names the version each hook arrived in, from 14.2.0.2.1 to
14.3.0.4.3. Confirm against the user's OBPM jars before writing a class.

## 6. Other OBPM extension options (no code)
- **UDF fields** (function `UDDMAINT`): extra data on maintenance screens without table changes. Bank users configure
  them.
- **ISO8583 protocol definition** in an XML configuration file. Administrators change it; it may need an application
  restart.
- **Style editor:** CSS changes for page and dialog templates, form elements, fonts, tables and colours.
- **Language** versions of screens.
- **Screen changes in RAD:** hide fields, move fields between tabs, add LOVs, change data types, add enumerations, and
  add repeated fields (for example address line 5).
- **Field attribute changes:** default value, min/max value, precision.

## 7. Extensibility life cycle (Oracle's recommended steps)
1. Define the requirement: module, function ID, why base functionality is not enough, alternatives considered.
2. Identify the area:
   - function ID (new or changed screen);
   - processing logic (defaulting, enrichment, validation);
   - UDF;
   - accounting interface;
   - batch (EOD or intraday);
   - report;
   - interface.
3. Pick the tool: RAD and the style editor; PL/SQL on the generated or core packages; BIP for reports; the generic
   interface framework.
4. Identify the layers and file types:
   - client: JS;
   - application: UIXML, plus Java on OBPM;
   - database: CUSTOM/CLUSTER packages and core packages;
   - reports: RTF.
5. Develop, deploy to a test environment (installation guides) and test.

TrustForge maps these steps to the odt-customize skill steps 1-9.
