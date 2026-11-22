# ODT reference index

Condensed from Oracle FLEXCUBE Universal Banking 14.7.0.0.0 "Open Development Tools" guides (F72109-01, Nov 2022).
Read `00-cheat-sheet.md` first, then only the files the task needs.

| File | Read when |
|---|---|
| 00-cheat-sheet.md | Always: layers, naming, immutability, category map, must-have tables, dev loop |
| 01-installation.md | ODT install, env.properties / odt.properties, DB compile, WAR build |
| 02-administration.md | Releases, environments (JNDI, deploy paths, File Manager), users and roles |
| 03-getting-started.md | Workbench menu tree, user preferences, browser settings |
| 04-screen-development-core.md | ANY screen design: header, preferences, data sources, blocks, fields, display types, screens/tabs/sections/partitions, field sets, LOVs, call/launch forms, actions, summary, labels |
| 05-generation-deployment.md | What files are generated, INC table list, hook package rules, deploy |
| 06-screen-customizer.md | Layout-only changes to an existing screen |
| 07-notifications.md | Notification triggers / notification radxml / runtime flow |
| 08-bulk-generation.md | Bulk generation from radxml list |
| 09-source-upgrade.md | Child / screen child / source refresh and its limitations |
| 10-tracking-changes.md | View changes, change report |
| 11-test-case-management.md | TCM test cases, run charts, derivation, data migration |
| 12-child-and-screen-child.md | Child and screen child functions |
| 13-maintenance-form.md | Maintenance screens, hook functions, call flow, skip logic |
| 14-online-forms.md | Transaction/online screens, SUBSYSSTAT, online hooks |
| 15-call-forms.md | Call forms |
| 16-launch-forms-and-others-screens.md | Launch forms, OTHERS category, custom action codes |
| 17-report-forms.md | BIP report parameter screens |
| 18-dashboard-forms.md | Dashboards |
| 20-purge-entity-definition.md | Purge entities |
| 21-service-xml-silent-odt.md | SOAP service XML, Silent ODT utility config |
| 22-lov-high-volume.md | Exact fetch, mandatory reduction fields, criteria search |
| 23-upload-framework.md | Upload tables, process tables, triggers, adapter packages |
| 24-customer-landing-page.md | Customer landing page |
| 25-gateway-lov-enhancer.md | Gateway screens, external / combined LOVs |
| 26-rest-services.md | REST enablement and generation |
| 28-extending-kernel-function.md | Adding to an Oracle function in CUSTOM: delta merge rules, ODT save errors, cloning slot N, custom 1:1 table, backend impact analysis, hook layering (field-tested on IFDATMMN) |
| 27-radxml-format.md | Verified radxml XML format, ODT load checks, generated PL/SQL names (not in the guides) |

Note: the guides do NOT document the radxml XML schema, exact PL/SQL hook signatures, or INC column lists. File 27 records them as verified on 14.7.0.6.0; for other versions prefer the user's own files.
