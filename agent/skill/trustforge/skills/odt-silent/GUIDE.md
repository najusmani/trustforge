---
name: odt-silent
description: Configure and run the FLEXCUBE Silent ODT utility (SilentOdt.properties, ODTOperations.properties, GW_CONFIG.properties) for bulk generation of radxml units, child/screen-child/source refresh, service XML (SOAP) refresh/update/generation and REST artifact generation, plus the source/base list files they need. Use when the user wants headless ODT generation, an upgrade refresh, or web service / REST artifacts.
---

# Silent ODT utility

> **Lessons first:** before delivering, and first whenever the user reports an ODT save, compile, deploy or test error, read `../../reference/29-lessons-learned.md`; when a new root cause is confirmed, record it as that file describes (automatically).

Reference: `../../reference/21-service-xml-silent-odt.md`, `26-rest-services.md`, `09-source-upgrade.md`, `08-bulk-generation.md`.

## Prerequisites to tell the user
- JDK (1.7 per SOAP guide, 1.8.0 per REST guide; use the one their utility build expects) and Apache Ant 1.7.1 on PATH; JAVA_HOME set.
- `jaxb-xjc.jar` (from app server libs) and `ojdbc6.jar` in `lib/`; clear read-only on the utility folder.
- ODT user, release code, environment code and language already created in ODT.
- Encrypt JDBC URL, DB user/password (REST guide) and ODT password with `ODTPassEncryption.bat/.sh` using a 16-character symmetric key; the same key goes in `SymmetricKey`.

Never put real passwords or keys in files you write. Use placeholders like `<ENCRYPTED_PASSWORD>` and tell the user to run the encryption utility.

## Building the configuration
1. Pick operations in order. LOGIN and SETRELEASE are always first.
   - Regenerate units: BULKGENERATION
   - Upgrade custom radxmls to a new kernel: REFRESH (SOURCE_REFRESH, srcRelType CUSTOM, baseRelType KERNEL or CLUSTER) then BULKGENERATION
   - Child refresh within release: REFRESH (CHILD_REFRESH / SCRCHILD_REFRESH)
   - SOAP: SXML_UPDATER (op name SXML_UPDATE) / SXML_REFRESH / SXML_BULKGENERATION
   - REST: REST_GENERATION (gen=REST)
2. Fill templates in `templates/` (copy to `output/silent/`), replacing placeholders.
3. Produce list files (one absolute path per line). Bulk generation: call-form radxmls listed first; prefix `--` to load but not generate (UI bulk gen). Refresh: srcFileList and baseFileList in matching order; include parent radxmls when child screens are involved.
4. `gen` values for BULKGENERATION: UIXML, SYS_JS, MAIN_SPC, MAIN_SQL, KERNEL_SPC, KERNEL_SQL, CLUSTER_SPC, CLUSTER_SQL, CUSTOM_SPC, CUSTOM_SQL, UPLOAD_SPC, UPLOAD_SQL, UPLOAD_TRIGGER, UPLOAD_TABLE_DDL, XSD_FILES, MENU_DETAILS, LABEL_DETAILS, AMEND_DETAILS, SUMMARY_DETAILS, SCREEN_DETAILS, LOV_DETAILS, BLOCK_PK_COLS, CALL_FORM_DETAILS, BLOCK_DETAILS, DATASCR_DETAILS, FUNCTION_CALL_FORMS, GATEWAY_DETAILS, NOTIFICATION_DETAILS, FUNCTION_PARAMETERS, NOTIFICATION_TRIGGER, PURGE_DETAILS, ARCHIVE_TBL_DEF. For a CUSTOM regeneration usually omit KERNEL_*/CLUSTER_* (they belong to other layers) and CUSTOM_* if the custom hook code already exists (regenerating would overwrite stubs).
5. SXML_BULKGENERATION gen: IMPL_FILE, CONFIG_FILES, WSDL_FILE, XSD_FILES, GW_WS_PROP_FILES, ANT_BUILD; GW_CONFIG.properties only if GW_WS_PROP_FILES.

## The exact key syntax
The guides show the keys but only as screenshots for the file layout. If the user provides their utility's sample `resource/*.properties`, keep its exact layout and only change values. Otherwise use the templates here and tell the user to align the format with the sample files shipped in their utility's `resource` folder.

## Verify after run
- Utility log at Logpath; ServiceGenerationStatus.csv all Success; XSDValidationErrors.csv absent; refresh log/report statuses successful. Then regenerate/deploy per CHANGES.md and unit test.
