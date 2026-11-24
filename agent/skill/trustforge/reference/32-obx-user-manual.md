# 32 Oracle Banking Extensibility Workbench (OBX) 14.7 - user manual (generating and deploying extensions)

Condensed from Oracle's **OBX 14.7.0.0.0 User Manual** (docs.oracle.com/cd/F82829_01/PDF/User_Guide/
UserManual_OBX_14.7.0.0.0.pdf, 109 pages). Installation: file 31. OBX is for **Oracle Banking Microservices
Architecture (OBMA)** products, the "plato" stack: Common Core (CMC), Branch / Retail Mid Office (OBREMO, OBBRN),
SMS, app-shell (Oracle JET web components). It is not for FCUBS or OBPM host screens (ODT, files 01-30). Many
manual steps are screenshots; where this file says "prompted", the exact questions are only in those screenshots.

## 1. What OBX generates
- **Service extensions** (Spring Boot microservice wars, built with Gradle):
  - simple sub-domain service;
  - maintenance sub-domain service (work table plus main table, maker-checker, audit fields);
  - data / resource segment service (RSOV1, discontinued; **RSOV2**; workflow DS);
  - publisher / subscriber event service;
  - batch service;
  - custom validation service.
- **UI extensions** (OJET web components): simple standalone, virtual page, maintenance detail plus summary, data
  segment, dashboard widget.
- **Modification of a base web component:** add fields, hide, default, disable, or make a non-mandatory field
  mandatory.

## 2. First-time setup (extends file 31 section 4)
- **`extension_home\component-server`:** from the base product's `app-shell.war`, copy the folders `common` and
  `components` into it.
- **`extension_home\lib`:** all jars from `WEB-INF\lib` of a base service war (example
  `cmc-datasegment-services-5.1.0.war`).
- **`extension_home\runtime`:** `extra_jars` from the OBX zip's `gradle\lib`.
- **Database checks before generating:**
  - **plato-ui-config schema:** table `PRODUCT_EXTENDED_LEDGER (ID PK, CCA_NAME unique, CCA_TYPE, PARENT_CCA_NAME,
    PRODUCT_NAME)` must exist. The manual gives the DDL.
  - **SMS schema:** maintain product `OBX` in `SMS_TM_APPLICATION`, and give the user application access through
    `SMS_TM_USER_APPLICATION` (or the UI).

## 3. Designing the model: XDL (OBX Domain Language)
- From `extension_home`, run `obx xdl-gen`. It opens the OBX UI at **http://localhost:8080**; free that port first.
- **Blocks:**
  - Entity Details: the entity name;
  - Field Details;
  - Child Entity Details;
  - Relationship Details: One to Many, or One to Many to Many.
- **Field types:**
  - `String` (varchar / String / text);
  - `Integer` and `Float` (number);
  - `LOV` (ID, Title, service Endpoint);
  - `Date`;
  - `Amount` (with currency);
  - Combo box, Checkbox, Toggle, Text Area (from the OJET cookbook).
- Save XDL into `extension_home`, named after the main entity. In the console, you can go straight on to generate,
  or use the generator commands below; both give the same result.

## 4. Service extensions: commands
Run each from `extension_home` and answer the prompts (product family, service name, release, XDL path, and so on).

| Type | Command | Notes |
|---|---|---|
| Simple sub-domain | `obx service new -c` | Asks whether to create a UI component |
| Maintenance | `obx service mn -c` | Work table plus main table, audit. Asks whether to create maintenance and summary components. Generates SMS scripts |
| Data segment RSOV1 | `obx service ds -c` | Master type (new screen class) or child type (attach to an existing base flow). **Discontinued; use RSOV2** |
| Data segment RSOV2 | `obx service rsov2 -c` | Master: a core component (utility) plus a master component. Child: one component. Copy the folders into the product's `core-services` |
| Workflow data segment | `obx service wfds -c` | Master or child, as for RSOV1 |
| Pub / sub event | `obx event -c` | |
| Batch | `obx batch -c` | Asks for product family, service name and release. Produces `<family>-batch-<name>-extended-services`. Templates: Spring Batch `jobName()` (ItemReader / Writer / Processor) and plato batch `batchProcessJob()` (`EReader`, `TWriter`, `ETProcessor`; you write the entity classes) |
| Custom validation | `obx validation -c` | Produces `obx-validation-service`. Can **only validate, never change the payload** |

- **Build:** `gradle clean build` inside the service folder; the war is in `build/libs`.
- **Database scripts** are in `<service>\src\main\resources\db`, with sub-folders:
  - **Entity script:** run in a schema created for extensions only;
  - **`sms\`:** run in the SMS schema. It creates functional activities only; assign them to roles as the base
    product describes;
  - **`cmc\`** (data segment services): run in the CMC schema. Screen class and data segment are then maintained
    in the Common Core UI.
- **Review generated scripts before running them:** `CONFIG_SCRIPT.sql` (adjust to the environment) and
  `PLATO_TABLE_SCRIPT.sql` (may contain dummy values).
- **Deploy extension services in their own domain**, never co-deployed with product services.
- **Multi-entity adoption** in an existing service:
  - dependencies `plato-microservice-dependencies`, `plato-eventhub-dependencies` and `plato-feed-core` (release
    `release.obma.plato.21_0_0.services`, version 6.0.0);
  - a `MappedInterceptor` bean using `PlatoInterceptor` on `/**`;
  - add `%X{entityId}` to the logback `LOG_PATTERN`;
  - feed folders `/parent/<entityId>/file`;
  - cache keys that include `PlatoHolder.getCurrentEntityId()`;
  - `spring.application.appID` (or `appId`) in `application.yml`.

## 5. Service extensibility: overriding a base service method
- **Units:** `<service>-extn.jar` (your code) and the base `<service>.war`, which loads the jar at runtime.
- **Steps:**
  1. **Base classes:** `obx create-jar`, then give the location of the base war (press Enter twice). It produces a
     jar of the war's classes for compiling against. In the extension's `build.gradle`, add
     `compileOnly files("classes")`.
  2. **Optional packages:** in the base war's manifest (in its `build.gradle` `war { manifest { attributes(...) } }`),
     set `Extension-List: <service>-extn` and `<service>-extn-Extension-Name: <service>-extn`.
  3. **Override:** in the jar, write a class that extends the base service implementation, annotated
     `@Primary @Service` (example `CustomerServiceImplExt extends CustomerServiceImpl`). Its methods win; without the
     jar, the base runs.
  4. **Package names:** classes in the jar use the base war's base package, plus `.service`, `.controller` or
     `.model`.
- **Deploy:**
  - **WebLogic:** deploy the extension jar first, then the war, on the same server;
  - **Tomcat:** add `PreResources` (`DirResourceSet` pointing at the jar folder, `webAppMount="/WEB-INF/lib"`) to
    the context in `server.xml`.

## 6. UI extensions (web components)
- **Types:**
  - standalone: building block, no SMS;
  - virtual page: changes the app URL;
  - container: opens in a wizard, no router state;
  - data / resource segment: part of a process flow;
  - dashboard widget.

  All except standalone have SMS applied: assign their functional activity to a role, or they do not appear in the
  app shell. Unit and functional test frameworks are included.
- **Component server** (`http://localhost:8002`): serves the base components. To reuse one, copy it into
  `module.exports = [ ]` in the new component's `metadata.js`. OBX waits ("Please modify the Metadata.js file
  before proceeding... press 'y'"), then generates the source and starts the component.
- **Commands** (from `extension_home`):
  - `obx ui --sd`: standalone;
  - `obx ui --vp`: virtual page;
  - `obx ui --mnsm`: maintenance detail plus summary (two components, started manually);
  - `obx ui --ds`: data segment;
  - `obx ui --wd`: dashboard widget;
  - `obx ui --mb`: modify a base component (section 7);
  - `obx ui --af`: additional fields for an in-scope data segment.
- **Re-run later:** in the component folder, run `node startCS.js` (component server) in one tab and `npm start` in
  another; the component opens at `http://localhost:8001`.
- **Build for deployment:**
  1. In each component, run `sh buildExtendedComponent.sh`. It runs the unit tests; the component must pass them.
     Output goes to `extension_home\extended-components`.
  2. In `extension_home`, run `obx build-cca` to produce **`extended-component.war`**.
  3. Deploy it **in the same domain as the app shell**.
- **Each component's `db\` folder:**
  - `sms\`: service and functional activities;
  - `ui-config\`: run in the ui-config schema. It registers the component in the ledger the app shell reads, so
    without it the component and its menu do not appear.

  Generated scripts use `HEADER_APPID` `PXDSSRV001` by default; change it.

## 7. Modifying a base web component
- `obx ui --mb` asks for the base component name and creates `<base>-extended` with boilerplate and `db` scripts.
- **Rules:**
  - put added fields after the existing ones, or the responsive CSS can break;
  - prefer data segments for new fields;
  - before hiding or disabling a mandatory field, give it a value, or service calls fail.
- **Base component hooks,** needed so the extension loads:
  - HTML: `<!-- ko if: ifExtension --><name-extended data="{{base}}">`;
  - JS: `self.base = this`, and an `ifExtension` observable set to true when `requirejs` has the path
    `components/<name>-extended`, which then loads `components/<name>-extended/loader`. The extension's
    `bindingsApplied` places its fields after a base field id; `self.connected` calls `self.loadExtendedComponent`;
  - base JSON: `isExtensible`, `authMode`; extended JSON exposes `data` and `base`.
- **Pre / post methods:** for example `prenext` / `postnext` around the base `self.next`. Write them in the extended
  JS and expose them in its JSON. The hooks must exist in the app shell's common infrastructure.
- **In-scope data segment** (fields at any position): add the hooks in the base JS and HTML, run `obx ui --af`, add
  the field to `self.data` (`ko.observable`), subscribe it to the change handler, and place it with jQuery next to a
  base element id. The data is stored in a separate custom schema.
- **New column in a base table grid:** in the extended `bindingsApplied`, splice a column into
  `properties.data.columnArray` and refresh. For data in the table, write a custom projection service.
- **Task grids:**
  - **Extra columns:** clone the Free / My / Hold task components, define `self.additionalColumns` (`dataIndex`,
    `dataType`, `displayType`, `width`, `sortable`, `resizable`, `accessTo` states), and pass
    `additional-columns='{{additionalColumns}}'` to `fsgbu-ob-cmn-fd-work-list`.
  - **Extra buttons:** `self.extraButtons` (`label`, `icons`, `display`, `accessTo`) plus a method named after the
    label in lower case, `additional-buttons=...` in the HTML, and the method exposed in the JSON.
- **Process extensions** (`configJSON.js`): create `extended-components\js\components\common-extended\js\util\
  configJSON.js`, which `define`s on `cmn-util/configJSON` and adds `applicationObject.entityIdByProcessCode[...]`.
  Register it in `PRODUCT_EXTENDED_LEDGER` (type `config`, product `EXTENDED_COMPONENTS`).
- **Label changes:** create `<component>-util-extended\resources\<component>\nls\bundle.js`. It loads the base
  bundle through `ojL10n!`, overrides labels and returns `{ root: baseLabels }`. Register it in
  `PRODUCT_EXTENDED_LEDGER` (type `util`).
- **Customising an LOV result:** use service extensibility (section 5) to override the base method, or a custom
  projection service plus events for custom fields.
- **Endpoint override:** `PRODUCT_SERVICE_EXT_LEDGER` (new) makes an extension orchestrator endpoint take
  precedence over the product's. Product name and endpoint key must match the endpoint being extended, and the
  extension service needs a `PRODUCT_SERVICE_CTX_LEDGER` entry. Product flyway updates do not touch this table.

## 8. Lifecycle commands
- `obx service-update`: run in a service folder, give the release. It rewrites `build.gradle` to the new
  dependencies.
- `obx ui-update`: run in a component folder. It replaces the libraries and keeps the source. Then run
  `sh npm-link.sh`, `node startCS.js` (second tab) and `npm start`.
- `obx release`: lists the features of the installed OBX.
- **Process Workbench** (app UI):
  - list, create or modify a process and its stages, with drag and drop;
  - upload or export the JSON workflow DSL;
  - preview the flow diagram.

  A modified process gets version +1.

## 9. Additional fields on product data segments (Common Core, no code)
- **Screen:** Core Maintenance > **Additional Fields Maintenance**.
  - **Component name:** default `fsgbu-ob-cmn-ds-additional-fields`; the UI key is `<DataSegment>@<ProductCode>`.
  - **Product code:** the function code.
  - **Field metadata:** id, label, category, type, edit, mandatory.
  - **Validation metadata:** name, template (for example `compareFromToDates`), message, arguments.
- **Tables:**
  - `CMC_TW_ADDT_ATTR_MASTER`: work table; after approval (a different user), master;
  - `CMC_TM_SCREEN_DS_MAPPING`: maps the data segment to the function code;
  - `CMC_TB_ADDT_ATTR_DATA`: the values. In the payload they travel as `cmcAddlFields[]`.
- **Endpoints:** `CORE.GET_CMC_ADDITIONAL_ATTRIBUTES` (definition, `?uiKey=`) and `CORE.GET_ADDITIONAL_ATTRIBUTES`
  (saved values, `?uiKey=&dataReferenceKey=`).

## 10. Branch servicing (OBBRN / OBREMO) configuration tables
- **Action URL:**
  - `BRANCHCOMMON.SRV_TB_BC_ACTIONS_URL` holds the endpoint per function code and action (OPENCHECK, CREATE,
    OVERRIDE, REVERSAL, PENDING_APPROVAL, AUTHORIZE).
  - If one is missing, the error is `RM-BC-UR-01` (in `ERTB_MSGS`).
- **Static tags:**
  - `TRANSACTION.SRV_TB_TX_STATIC_TAGS` holds `TILL_TAGS`, `DRCR_TAGS` and `ACCOUNTING_TAGS` (JSON) per function code.
  - If they are missing, the transaction fails.
- **New transaction screen as a clone** (for example 1499 from 1401):
  - copy the rows in **SMS**: `SMS_TM_MENU`, `SMS_TM_MENU_DESCRIPTION`, `SMS_TM_SERVICE_ACTIVITY`,
    `SMS_TM_FUNCTIONAL_ACTIVITY`, `SMS_TM_FUNC_ACTIVITY_DETAIL`, `SMS_TM_ROLE_ACTIVITY`, `SMS_TM_UI_ACTIVITY`;
  - copy the rows in **Common Core**: `CMC_TM_SCREEN_CLASS`, `CMC_TM_SCREEN_DS_MAPPING`;
  - copy the rows in **Branch Common**: `SRV_TM_BC_FUNCTION_INDICATOR`, `SRV_TM_BC_FUNCTION_CODE`,
    `SRV_TM_BC_FUNCTION_PREF`, `SRV_TM_BC_FUNCTION_PREF_DTLS`, `SRV_TM_BC_BRANCH_ACCOUNTING`,
    `SRV_TM_MENU_CONFIG`, `SRV_TB_BC_ACTIONS_URL`;
  - copy the rows in **Transaction**: `SRV_TB_TX_STATIC_TAGS`.
- **Different logic per function code:**
  - the transaction service code is in the shared library `obremo-srv-cmn-common-txn` (WebLogic `library-ref` in
    `weblogic.xml`);
  - an extension jar (`obremo-srv-ext-common-txn`) can supply per-function-code classes. For example, for function
    code 9999 `FC9999 onCashSubmitTillAcc` runs instead of the common `stempImpl onCashSubmitTillAcc`; use this for
    charging, accounting or till handling.
- **New data segment in an existing screen** (example: a fourth segment in 1401):
  1. Run `obx xdl-gen` and generate a UI component (product family Oracle Banking Retail Mid Office; prefix
     `obx-vp` or `obx-ds`). Bind HTML to `self.payload`, use `oj-validation-group`, and save through
     `cmn-ct-datasegment` (no REST calls in the model). Expose `data` and `datatransferPayload` in the JSON.
  2. Generate the service (prefix `obremo_`); its script creates the data table.
  3. Register the segment: `PRODUCT_EXTENDED_LEDGER` (component script), a new row in `CMC_TM_SCREEN_DS_MAPPING`
     with `DS_CODE` = component name, and the endpoint in `PRODUCT_SERVICES_LEDGER` if the service is separate.
     Add `PRODUCT_SERVICES_CTX_LEDGER` for a new schema.
  4. Restart the plato servers, then deploy `extended-component.war` and the service.
- **New field in an existing base data segment** (example: `fsgbu-ob-remo-srv-ds-cash-deposit`):
  1. Run `obx ui --mb`, and add the HTML, JS and JSON hooks in the base and the extended component.
  2. Add a CLOB column `ADDITIONAL_FIELDS` to the service's work and main tables, an `additionalFields` String with
     `@Column` in the entities and the model, and a `PRODUCT_EXTENDED_LEDGER` row.
  3. Redeploy the service, the extended war and the app shell.
