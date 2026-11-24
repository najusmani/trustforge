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
OBPM's own `PMD*` maintenances are Java functions: for a new OBPM screen see 4.1 first.
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
6. Tick **Java functions** in the screen's own **Preferences** node (saved as radxml `ELCM_FUNCTION = Y`, `MODULE_GROUP_ID = FCPMTS`), then
   Generate with **Java Classes** ticked. Without the preference the Java Classes box is disabled (lesson L9). The local RAD
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

### 4.1 New OBPM maintenance: Java back end (seen in the OBPM 14.7 jars)
OBPM's own maintenances (`PMD*`) are Java functions, not PL/SQL. **Design a new OBPM maintenance with Java
functions** and put its validations in Java; offer the PL/SQL hook package of section 3 only as an alternative the
user chooses. Copy the pattern of a similar shipped screen (for a customer-keyed rule: `PMDCSMLK`).
- **Switch it on:** screen Preferences > **Java functions** (saved as `RAD_FUNC_PREFERENCES/ELCM_FUNCTION = Y`, not
  `JAVA_PAYEMNTS_FUNCTION`); only then is **Java Classes** enabled on Generate (lesson L9).
- **Generated units, Oracle's KERNEL screens** (shipped jars): def class `com.ofss.pmts.pm.def.<FID>`, DTO
  `<Name>Dto`, entity `<Name>`, `<Name>Kernel`, `<Name>KernelSys`, `<Name>KernelSysDao`, `<Name>Assembler`.
- **Generated units, a NEW screen in a CUSTOM release** (seen in ODT's generated zip): there is **no Kernel class**.
  - `PMKernel/src/com/ofss/pmts/pm/<Name>Custom.java` (implements `IExtensible`) and `<Name>CustomSys.java`
    (implements `ISys`: mandatory checks `MAND-001`, `EXISTS`, `NO-SOURCE`, `NO-DATA`)
  - `PMDto/.../dto/<Name>CustomDto.java`, `PMEntities/.../<Name>.java` + `<Name>PK.java` (JPA)
  - `PMKernelDao/.../<Name>CustomSysDao.java`, `.../assembler/<Name>CustomAssembler.java`
  - `PMCommon/.../def/<FID>.java`, `UIXML/ENG/<FID>.xml`, `JS/<FID>_SYS.js`, `INC/*`, `RADXML/<FID>_RAD.xml`
  - Compiling them needs, beside the PM jars of the EAR, `javax.persistence` (from the application server) and the
    EAR's Jackson and Swagger annotation jars.
- **`<Name>` comes from the master block's XSD node** with the hyphens removed: `Pmtms-Cust-Service-Model-Link` gives
  `PmtmsCustServiceModelLink*`, `Hst-Param` gives `HstParam*`. Pick a distinctive node (`BLK_<DATA SOURCE>` /
  `<Data-Source>`), never a generic one like `Limit-Master`.
- **DTO property names:** in the generated `<Name>CustomDto` they come from the **block field names**, lower case
  after the first letter (`HOSTCODE` -> `getHostcode`, `CUSTSRVMOD` -> `getCustsrvmod`). The JPA entity uses the
  columns (`getCustomerServiceModel`). Shipped kernel DTOs look column-based only because their fields are named
  after the columns. NUMBER is `BigDecimal`; the DTO extends `MaintainableDto` (audit fields).
- **Hooks:** a new CUSTOM screen's `public class <Name>Custom implements IExtensible` (constructor `(RequestProfile)`,
  logger `com.ofss.pmts.logger.Logger.logDebug(msg, DebugLevels.INFO)`); on a kernel screen it `extends <Name>Kernel`.
  Write the hooks into ODT's generated file, keeping its structure. The framework
  (`PMTransactionProcessor`) calls `preCheckMandatory(curDto)`, `postCheckMandatory(curDto)`,
  `pre/postDefaultAndValidate(prevDto, curDto)`, `pre/postQuery`, `pre/postPersist` - **the record being saved is the
  second argument**. Validations go in `postDefaultAndValidate`; defaults that the mandatory check needs go in
  `preCheckMandatory`.
- **Raising an error:** `profile.addMessage(new Message(code))` or `new Message(code, Object[] params)`, then
  `return false`. The kernel class keeps its `profile` private, so the Custom class stores its own. Check
  `profile.getAction()` (`NEW`, `MODIFY`, `DELETE`, `AUTH`, `CLOSE`, `REOPEN`, `EXECUTEQUERY`).
- **Every block field is a column (lesson L14):** no DESC / display-only fields in a Java-functions screen. Store
  descriptions (customer name, model description) in the table and fill them from the LOV return, as PMDCSMLK
  does; otherwise Authorize / Delete fail in `PMRequestParser` with ST-COM036.
- **Host on New (`POPULATE_HOST`, lesson L10):** LOV binds read only screen fields and the front end has no
  host global, so a host-keyed screen fills the host when New is clicked. Release JS `fnPostNew_<REL>` sets
  `gAction = "POPULATE_HOST"`, then `appendData()`, `buildUBSXml()`, `fnPost(...)`, `fnProcessResponse()` and on
  success `setDataXML(getXMLString(fnGetDataXMLFromFCJXML(fcjResponseDOM, 1)))` + `showData()`, restoring `gAction`.
  The server's `preCheckMandatory` sees the action and sets `dto.setHostcode(profile.getHostCode())` (OBPM kernels
  also fill host id and booking date there). `fnPostNew_CUSTOM` is called for a CUSTOM-origin function.
- **Host:** OBPM maintenances are per host. Key the table on `HOST_CODE` as PMDCSMLK does, default it from
  `RequestProfile.getHostCode()`, and bind host-scoped LOVs on it.
- **OBPM tables to use** (not the FCUBS ones): currency `CYTM_CCY_DEFN_MASTER` (CCY_CODE, CCY_NAME,
  MAINTENANCE_COUNTRY); customers `STTM_CORE_CUSTOMER` (CUSTOMER_NO, CUSTOMER_NAME1, HOST_CODE; **no customer
  category**). OBPM's customer category is the **Customer Service Model**: master `PMTM_CUST_SERVICE_MODEL`
  (CUSTOMER_SERVICE_MODEL, CUST_SERVICE_MODEL_DESC, HOST_CODE), linked per customer in
  `PMTMS_CUST_SERVICE_MODEL_LINK` (CUSTOMER_NO, HOST_CODE -> CUSTOMER_SERVICE_MODEL), screen PMDCSMLK.
  Source codes `PMTM_SOURCE` (SOURCE_CODE, DESCRIPTION, HOST_CODE); networks `PMTM_NETWORK` (NETWORK_CODE,
  NETWORK_DESCRIPTION, HOST_CODE). Read any other LOV table from the `@Table`/`@Column` names in PMEntities.jar, never
  guess (lesson L11).
- **Database access from Java:** the JTA data source named in PMEntities.jar `META-INF/persistence.xml` (unit
  `..._ENTITY_ID1`, usually `jdbc/fcjdevDS`). A connection from it inside the request's JTA transaction commits or
  rolls back with it. JDBC cannot read a PL/SQL BOOLEAN: give called functions a VARCHAR2 'Y'/'N' wrapper.
- **Finding these facts:** the application EAR holds the jars (`PMApps`, `PMKernel`, `PMCommon`, `PMDto`,
  `PMEntities`, `PMKernelDao`). `javap -p` gives signatures; `javap -c` on the caller shows how a hook's result is used.

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
| BO_VALIDATION | - | IBOValidationHandler | Business-override validations, book transfer (see 5.1) |
| BO_EXT_VALIDATION | - | IExtBOValdiationHandler | External business-override validation, incoming SWIFT only (see 5.1) |
| BEN_DERIVE | - | IBeneficiaryDeriveService | Beneficiary / credit account derivation |
| NONSTP_KEY | - | INonStpHandlerService | Non-STP queue decision |
| BLOCK3_SKIP | PX | IBlock3SkipService | Remove block 3 (txn ref, msg type, network -> boolean) |
| EXTACC_CHECK_REQD | - | (class ExtAccCheckReqHandlerCustom) | External account check required |

Other keys in `PMTM_EXTENSION_CLASSES` without a documented interface: `ACCOUNTING`, `FX_LIMIT`,
`CNAPS_BEN_VALIDATE`, `ACH_OUT_RETURN_VALIDATION`, `ACH_IN_RETURN_VALIDATION`, `NARRATIVE`.

Interfaces and parameters vary by patch set: the workbook names the version each hook arrived in, from 14.2.0.2.1 to
14.3.0.4.3. Confirm against the user's OBPM jars before writing a class.

### 5.1 Hook details read from the OBPM 14.7 jars
- **Registering and checking a hook (lesson L15):** after deploying the jar, set `CLASS_NAME` for the key and check it
  with a SELECT. In the user's debug, `LOOKUP_KEY -- <KEY>` followed by `Class Name not found return NULL` means the
  key has no class (kernel default runs); `No record found # {Extension.findByPk ...}` means the key is missing.
- **Logging from a hook:** use `com.ofss.pmts.logger.Logger.logDebug("<Class>-->" + msg, DebugLevels.INFO)`; plain
  `java.util.logging` output does not reach OBPM's debug files.
- **`BO_VALIDATION`** - `com.ofss.pmts.xml.fcubs.IBOValidationHandler` (PMApps.jar), seven methods to implement:
  `List<Message> validateBusinessRules(CommonSchemaPainDto)` plus overloads for `AchCreditInTxnDriver`,
  `AchCreditOutTxnDriver`, `AchDebitOutTxnDriver` and `validateBusinessRulesFcust(GenericWiresOutDriverDto |
  GenericWiresInDriverDto | AchInTxn)`.
  - Book transfer, cross-border outgoing and incoming, ACH outgoing and instrument issue build a
    `CommonSchemaPainDto` and call the first method. A non-empty list moves the payment to the business-override
    queue (cross-border outgoing: status E, queue BO, first message as error code).
  - `CommonSchemaPainDto` has `getTxnrefno` (BigDecimal), `getHostCode`, `getCustomerNo`, `getSourceCode`,
    `getNetworkCode`, `getTxfrCcy`, `getxfrAmt`, `getLcyAmt`, `getBookDate`, `getTxnBranch` - no customer category.
  - Return an override as `new Message(code, Object[] params)` with type `Message.ERROR`.
- **`BO_EXT_VALIDATION`** - `IExtBOValdiationHandler.doValidateExtBuisnessOveride(Request)`: called only for
  incoming SWIFT (`XBorderOutSwiftService`); the request has DCN, branch, transfer type and institution fields but
  **no customer or amount**. Response: execution status S/F, validation status A/R/O, error code/desc.
- **`POP_QUEUE_ACTION`** - `com.ofss.pmts.service.eca.IPopQueueAction.populateQueueAction(Request)`: called by queue
  cancel, exception-queue actions (including the BO queue), accounting and ECA, with `txnRefNo`, `queueRefNo`,
  `queueCode`, `queueAction` (`C` cancel, `R` reject seen), `remarks`, `makerId`. **The response's queue action
  replaces the caller's action**: always copy the request's action into the response unless you mean to change it.
  Returns (pacs.004, ACH returns) do not pass this key.
- **`AUTH_SAVE_STATUS`** - `com.ofss.pmts.handler.IAuthOrSaveStatus.authSaveStatus(Request)` (authOrSave,
  RequestProfile, dtoObject), from `PMRequestHandler`.
- **`POST_PERSIST_CUSTOM` / `CUSTOM_POST_PERSIST`** - `IPostPersistCustom` / `ICustomPostPersist` (prevDto, curDto ->
  success flag); used by branch incoming transactions only.

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

## 8. `PMTM_EXTENSION_CLASSES` in a live 14.7 environment (289 keys, seen 2026-11-23)
A real OBPM 14.7 installation has far more hook keys than the workbook in section 5 lists. `CLASS_NAME` is empty for
most of them, which means the kernel default runs. To customise one, write a class implementing that hook's interface
and set its `CLASS_NAME` (Java; restart or refresh the application). Always query the user's own table first:
`SELECT key, class_name FROM pmtm_extension_classes ORDER BY key;`

**Keys with a class already registered** (Oracle classes; customising one replaces Oracle's logic):
- **Derivation:**
  - `DERIVE_PAYMENT_TYPE` -> `com.ofss.pmts.common.DerivePaymentTypeCustom`
  - `DERIVE_PAYMENT_TXN_TYPE` -> `com.ofss.pmts.common.DerivePaymentTxnTypeCustom`
  - `DERIVE_NW_CODE` -> `com.ofss.pmts.common.DeriveNetworkCodeCustom`
  - `DERIVE_SPL_CHAR` -> `com.ofss.pmts.service.maintenance.service.ValidateSplChar`
- **MT fields** (all in `com.ofss.pmts.dispatcher`):
  - `23B_POPULATION_MT103` -> `PopulateField23BMT103`
  - `26T_POPULATION_MT103` -> `PopulateField26TMT103`
  - `POPULATE_52` -> `PopulateField52`
  - `POPULATE_53D_MT202` -> `Populate53D202Handler`
  - `POPULATE_56` -> `PopulateField56`
  - `SKIP_50K_POPULATION` -> `Skip50kPopulationHandler`
  - `ULTIMATE_SENDER_REQD` -> `PopulateUltimateSender`
  - `POPULATE_ADDTNL_INFO` -> `PopulateAddtlTagsCustom`
- **Dates, FX, validation:**
  - `RESOLVE_DATE_RULE_PARAM` -> `com.ofss.pmts.app.ach.validator.impl.ResolveValueDatesValidator`
  - `PAYMENT_TAG_VALIDATE` -> `com.ofss.pmts.app.ach.validator.impl.PaymentTagResolveValidator`
  - `SKIP_CCY_HOLIDAY_CHECK` -> `com.ofss.pmts.service.date.SkipCcyHolidayCheck`
  - `FXRATE_POPULATION` -> `com.ofss.pmts.common.PopulateFxRateOnCcySpread`
  - `SPSENRICHVAL` -> `com.ofss.pmts.app.singlepayment.validator.SPSTxnValidator`
- **Integration:**
  - `GPI_HTTP_CONNECTOR` -> `com.ofss.pmts.gpitracker.connector.HttpConnector`
  - `DIGITAL_SIGN_UTIL_SFMS` -> `com.ofss.pmts.xml.sign.util.PMDigitalSignatureUtilDigiSign`
  - `POPULATE_ORG_MSG_NM_ID` -> `com.ofss.pmts.app.date.genericwiresin.processor.OrgMessageNmIdPopulation`
- `BEN_DEFAULT` -> `BenInstDeriveService`.
- `LOOKUP_KEY` holds another key (`PM_SENDTO_MULTI_ADDRESS`), not a class: some keys redirect.
- `EXTACC_CHECK_REQD`, the shipped example in section 5, is absent in this installation. Keys differ between
  installations and patch sets.

**Empty keys by area** (extension points available; confirm each interface in the OBPM jars):
- **Accounting:** `ACCOUNTING`, `POPULATE_ACCOUNTING_ENTRIES`, `POPULATE_ACCEVENT_ENTRIES`,
  `POPULATE_RTN_ACCEVENT_ENTRIES`, `DEFER_ACCOUNTING`, `DO_SUPPRESS_ACCOUNTING`, `SKIP_IN_CLG_REV_ACCOUNTING`,
  `POPLCY_RATE_ACCTNG`, `BRIDGEGL_AND_CUSTGL`, `CREDIT_ACCOUNT_GL`, `POPULATE_BULK_ENTRIES`, `CAL_LCY_AMOUNT`,
  `LCY_AMT_DERIVATION`
- **Charges, pricing, VAT:** `DERIVE_CHARGE_WHOM`, `REPAIR_CHARGE_SKIP`, `RULE_PRICING_SKIP`, `PRICING_RULE_PARAM`,
  `POPULATE_PRICE_DETAIL`, `CHANGE_PRICE_DETAILS`, `POPULATE_PRICING_CODE`, `POPULATE_PRICING_EDE`,
  `CHARGE_ACCCCY_COMPONENT`, `CHARGE_AMTCCY_COMPONENT`, `MT_FIELD32_CHARGES`, `GPI_GEN_CHARGE_CLAIM`,
  `ACH_CTO_CHG_RJCT_ACC`, `ACH_DDO_CHG_RJCT_ACC`, `SKIP_VAT_ROUNDING`, `VAT_UNROUND_CUSTOM`
- **Accounts and resolution:** `INWARD_ACC_RESOLUTION`, `OUTWARD_ACC_RESOLUTION`, `CR_ACC_DETAILS`, `DR_ACC_INCOMING`,
  `POPULATE_DRACC_DETAILS`, `CHANGE_CDTRACC_DETAILS`, `CHANGE_ISOCDTRACC_DETAILS`, `VALIDATE_CR_ACCOUNT`,
  `GET_EXT_ACCT_AND_BRN`, `VIRTUAL_ACC_DERIVE`, `VIRTUAL_ACCOUNT_GENERIC_WIRES`, `DERIVE_SPLIT_ACCOUNT_CHECK`,
  `SETTLMNT_ACCT_IBAN`, `SKIP_ACC_VALIDATION`, `SKIP_IBAN_VALIDATION`, `COV_IBAN_VALIDATION`, `GEN_MSG_INVALID_ACCOUNT`,
  `POPULATE_BRANCH_CODE`, `DEFAULT_BRN_CODE`, `BRANCH_HOST_CHECK`
- **ECA / funds blocking:** `DERIVE_ECA_SERVICE`, `ENRICH_ECA_DTLS`, `SKIP_ECA_CHECK`, `SKIP_ECA_CHECK_COMMON`,
  `BLOCK_AMT_BEFOREECA`, `C2B_SKIP_ECA`, `C2B_SKIP_ACC`, `C2B_CONSOL_TXN`
- **Dates and cut-off:** `VALUEDATE_SKIP_CONDITION`, `VALUEDATE_SKIP_CONDITION_IN`, `OVERRIDE_DR_CR_VALUE_DATES`,
  `OVERRIDE_INSTRUCTION_DATE`, `MODIFY_DATES`, `NEXT_EXECUTION_DATE`, `DERIVE_FLOAT_DAYS`, `DERIVE_CUTOFF_FLAG`,
  `SET_CUTOFF_FLAG`, `BIC_CUTOFF_CHECK`, `BIC_CUT_OFF_TIME`, `POPBIC_CUTOFF_OUTBOUND`, `IACH_SKIP_CCY_HOLIDAY_CHECK`,
  `SKIPAMT_CHECK_FVDATE`, `ACH_ACTIVATION_DATE_POP`
- **Rules and queues:** `STP_RULE_PARAM`, `NONSTP_RULE`, `NONSTP_RULE_PARAM`, `NONSTP_KEY`, `ROUTING_RULE_PARAM`,
  `TRNCODE_RULE_PARAM`, `VERIFY_RULE_PARAM`, `CCYCORRESP_RULE_PARAM`, `CCY_CORRESP_RULE`, `HOLDRELEASE_RULE_PARAM`,
  `XBORDER_TO_RTGS_RULE`, `CUSTOM_QUEUE_ACTION`, `POP_QUEUE_ACTION`, `PROCESS_CUSTOM_QUEUE`,
  `SKIP_POPULATE_RETURN_QUEUE`, `COVER_MATCH`, `OUTRIGHT_REJECT`, `SKIP_HOLD_VALIDATION`
- **Validation:** `BO_VALIDATION`, `BO_EXT_VALIDATION`, `BO_EXT_VALIDATION_PS`, `AUTH_LIMIT_VALIDATION`,
  `BENEFICIARY_VALIDATION_CHECK`, `CREDITOR_AGENT_CHECK`, `VALIDATE_CUST_NAME`, `VALIDATE_ADDITIONAL_DET`,
  `VALIDATE_PAYMENT_CHAIN`, `PAYMENT_CATEGORY_VALIDATE`, `PAYMENT_CATEGORY_VALIDATION`, `SKIP_FIELD_VALIDATION`,
  `SKIP_FUNCID_VALIDATION`, `SKIP_VALIDATE_CLEARING_CODE`, `SKIP_MULTI_CCYCHECK`, `CHECK_FOR_RTGS`, `RTGS_SKIP_VAL`,
  `GENERICWIRES_OUT_BANK_TRANSFER_AUX_VALIDATION`, `ICF_CUSTOM_VALIDATION_CHECK`, `ISO_ICF_CUSTOM_VALIDATION`,
  `ISO_PACS008_CUSTOM_VALIDATE`, `MSG101_IN_VALIDATION`, `MSG101_VALIDATION_AUTO_REJ`, `CNAPS_BEN_VALIDATE`,
  `ACH_IN_RETURN_VALIDATION`, `ACH_OUT_RETURN_VALIDATION`
- **Enrichment:** `PXINENRICHVAL`, `PXOUTENRICHVAL`, `PBOUTENRICHVAL`, `ACHOUT_ENRICH_VAL`, `PM_UPLOAD_ENRICH`,
  `SSI_ENRICH_DEFAULT`, `SSI_DR_CR_HOOK`, `SPSPOPULATE_DTO_VAL`, `SPSCUSTOM_DTO_OBJECT`
- **Sanctions and duplicates:** `SANCTION_CHECK_REQD`, `SANCTION_CHECK_REQD_CUSTOMER`, `SANCTION_CHECK_RESPONSE_REQD`,
  `DUP_CHECK_REQD`, `DUP_CHECK_GENWIRESIN`, `PAIN001_DUP_MSGID_CUST_CHECK`, `PAIN008_DUP_MSGID_CUST_CHECK`
- **Derivation:** `DERIVE_SENDER_RCVR`, `GET_RECEIVER`, `PAYMENT_TYPE_RESOLUTION`, `DRIVEMESSAGE_TYPES`,
  `POP_DRIVE_PROCESSOR`, `DRIVE_IN_PROCESSOR`, `DRIVE_OUT_PROCESSOR`, `BEN_DERIVE`, `COID_DEFAULT`,
  `DEFAULT_CUST_IDENTIFIER`, `TXN_REF_GENERATE`, `EXCHRATE_TYPE_POPULATION`, `FX_LIMIT`, `FXRATE_POPULATION_DOFX`,
  `FXRATEPICK_POPULATION_DOFX`, `SKIP_CCY_CONVERSION`, `UPLOAD_TRANSFER_CCY`, `MT103IN_REPLACE_CCY`, `ISO_CCY_MAP`
- **SWIFT MT fields:**
  - `POPULATE_20`, `POPULATE_21_FROM_20_MT202`, `POPULATE_FIELD_25`, `POPULATE_FIELD_53`, `POPULATE_FIELD_79`,
    `POPULATE_TAG_26T`, `POPULATE_TAG_70`, `POPULATE_TAG_71`, `POPULATE_TAG_77B`
  - `32A_POPULATION_MT103`, `32A_POPULATION_MT202`, `32A_POPULATION_MT202_COV`, `33B_POPULATION_MT103`,
    `71F_POPULATION_MT103`, `71G_POPULATION_MT103`, `53_ACCOUNT_FOR_MSG`, `53_POPULATION_XBORDER`
  - `MT_FIELD57_SWIFTOPTION`, `BOTH_50_AND_52`, `MTPOP_ORDERING_CUST_MSG`, `MT103_SNDR_RCVR_INFO`,
    `POPULATE_SNDR_RCVR`, `POPULATE_SNDR_CORRESP`, `POPULATE_RCVR_CORRESP`, `POPULATE_TRINST_CORRESP`,
    `POP_OUR_CORRESPONDENT`
  - `POPULATE_BENEFICIARY`, `BENE_SPECIAL_CHAR_REP`, `POPULATE_REM_DET`, `POPULATE_PURP_CODE`,
    `POPULATE_GENERIC_BIC`, `POPULATE_BIC_DIR`, `POPULATE_MULTI_BICMX`, `POPULATE_MULTI_CCY`,
    `POPULATE_NAME_DLYMSGOUT`
  - `MT_POPULATE_FIELD21`, `MT_POPULATE_ORD_CUST`, `MT_ORD_INST`, `MT_SNDR_RCVR_INFO`, `MT_BLOCK3_DERIVE`,
    `MT_ENRICH_AWI`, `MT_DERIVE_MSG_TYPE`, `BLOCK3_SKIP`, `SWIFT_HEADER_MSGS`, `SWIFT_HEADER_900_910`,
    `MT192_RECALL_REQ`, `MT202COV_GENERATE`, `SKIP_COVER_CHECK`, `REPAIR_VALIDATION_AWI`
- **ISO 20022 / generic wires:**
  - `PREPARE_ISO_MESSAGE`, `CUSTOM_ISO_MSGS`, `GENERICWIRES_ISO_MSGS`, `CUSTOM_PAIN_MESSAGES`, `POP_ISOHEADER_DTLS`,
    `POP_GENERICWIRES_DTLS`, `POP_GENERICWIRES_DTLSCODE`
  - `PARSE_GENERIC_WIRESISO_HEADER`, then `PARSE_GENERIC_WIRESISO_` with `PACS002` / `PACS004` / `PACS008` /
    `PACS009` / `CAMT054`
  - `POPULATE_GENERIC_WIRESISO_` with the same five message types
  - `MODIFY_PACS004`, `PACS004_SKIP_STP_PROCESSING`, `CUSTOM_PACS002_GENERIC_ACH`, `CUSTOM_PACS004_GENERIC_ACH`,
    `PAIN002_FILE_GEN`, `PAIN002_GEN_CHG`, `SKIP_PAIN002_GEN`
  - `DOXSD_VALIDATION_ISO`, `DOXSD_VALIDATION_ISO_IN`, `SKIP_XSD_VALIDATION`, `SKIP_ISO_DISPATCH_PARAM`,
    `MX_MSG_PROCESSING_SKIP`, `MX_SUPPRESS_MESSAGE`, `POPULATE_FIELD_MSGID`, `POPULATE_STTLMDT_DETAILS`,
    `POPULATE_DOCUMENT_LIST`, `SETTLEMENT_MSG_FORMAT`, `ISO_RESP_MAP`
- **Dispatch, notifications, advices:** `MSG_PROCESSING_SKIP`, `POPULATE_DISPATCH_XML`, `POPULATE_UPLOAD_XML`,
  `PM_SENDTO_MULTI_ADDRESS`, `ADVICE_GEN`, `ADVICE_POPULATE`, `NARRATIVE`, `PAYMENT_STATUS_NOTIF`, `SEND_TXN_ALERT`,
  `EMS_NOTIF_QBEAN`, `CUSTOM_RESPONSE_BUILDER`, `GEN_GPI_CONFIRMATION`, `POPULATEGPI_AND_UETR`, `SIGN_REQUIRED_USRTP`,
  `SIGN_REQUIRED_USRTP_IN`
- **Persistence and lifecycle:** `PRE_PERSIST_CUSTOM`, `POST_PERSIST_CUSTOM`, `CUSTOM_POST_PERSIST`, `ON_TXN_SAVED`,
  `AUTH_SAVE_STATUS`, `CUSTOM_SCHEDULER_JOB`, `BATCH_SERVER_ID_CHG`, `CUSTOM_AUTH_TOKEN`, `PROCESS_FASTER_PAYMENT`,
  `SEPA_VOP_CONNECTOR`, `ADDITIONAL_EDE`, `POPULATE_MIS_DETAILS`, `SECOND_CUST_NO_TEMPSI`, `SKIP_CUSTDTLS_POPULATION`,
  `ACCEPT_DTTM_REQD`, `MSGINMISCOMP1_KEY`

**How to use this:** when an OBPM requirement changes processing behaviour, look here first for a key that covers that
stage, before considering PL/SQL. Ask the user for that interface from their OBPM sources or jars, and design the class
against it. Present the hook choice as an option, as for any functional design.
