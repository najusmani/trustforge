/**
 * The Learn hub: original guides on Oracle FLEXCUBE development with ODT.
 * Bodies are Markdown. Written in our own words from TrustForge's verified ODT knowledge, not copied from Oracle.
 */

export type Article = {
  slug: string;
  /** Page title (also the <h1>). */
  title: string;
  /** Short name for menus. */
  short: string;
  /** Meta description (~155 characters). */
  description: string;
  keywords: string[];
  published: string;
  updated: string;
  minutes: number;
  /** Markdown, starting at <h2> level. */
  body: string;
  faq: { q: string; a: string }[];
};

const PUBLISHED = "2026-11-22";

import { MORE_ARTICLES } from "@/lib/learn-more";

const BASE_ARTICLES: Article[] = [
  {
    slug: "what-is-flexcube-odt",
    title: "What is FLEXCUBE ODT? Oracle Development Workbench explained",
    short: "What is FLEXCUBE ODT?",
    description:
      "A plain-English guide to ODT, the Oracle FLEXCUBE Development Workbench (RAD tool): what it generates, how release layers work, and the developer loop.",
    keywords: ["FLEXCUBE ODT", "Oracle Development Workbench", "FLEXCUBE RAD tool", "FLEXCUBE development", "FCUBS ODT"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## ODT in one paragraph
ODT (Oracle Development Tool, also called the **Development Workbench** or the **RAD tool**) is how screens and their back-end code are built for Oracle FLEXCUBE Universal Banking (FCUBS). You design a function in ODT (its tables, blocks, fields, screens, lists of values and actions) and ODT saves that design as a **radxml** file. From the radxml it then **generates** most of the code the screen needs. Developers write only the business logic that the generator can’t know.

## What ODT generates for you
From one radxml, ODT produces:
- the **UIXML** that describes the screen, and the screen’s **system JavaScript** (\`<FUNCTION_ID>_SYS.js\`);
- the **main PL/SQL package** (\`<MOD>PKS_<FID>_MAIN\`) with query, validation and save logic for maintenance screens;
- empty **hook packages** for each release layer, where your own logic goes;
- **static-data scripts** (INC files) for menus, roles, labels, lists of values, screens and amendable fields;
- XSDs for web services, Excel templates and more.

The rule of thumb: never edit generated units by hand. Change the radxml and generate again.

## Release layers: KERNEL, CLUSTER and CUSTOM
FLEXCUBE code is layered so that changes don’t overwrite each other:
- **KERNEL**: Oracle’s product code.
- **CLUSTER**: regional or partner changes.
- **CUSTOM**: your bank’s own changes.

Each layer has its own hook package (\`..._KERNEL\`, \`..._CLUSTER\`, \`..._CUSTOM\`) and its own release JavaScript (\`<FID>_CUSTOM.js\`). A bank developer works in **CUSTOM**, which keeps upgrades of Oracle’s code safe. Inside a radxml, every element is tagged with the release that created it, and only that release can delete or rename it; later releases hide or deactivate it instead.

## The everyday ODT loop
1. Log in, then set your **release** and **environment** in User Preferences.
2. Open **Function Generation**, then create a new function or **load** an existing radxml.
3. Design in order: data sources, data blocks, screens, field sets, call and launch forms, lists of values, summary, actions.
4. **Save** the radxml, then **Generate** the units you need.
5. **Deploy**: JavaScript and UIXML to the application server, packages and INC scripts to the database.
6. Write your hook code and release JavaScript, launch the screen in FLEXCUBE and test.

## Function IDs at a glance
A function ID has 8 characters. The first two are the module (for example \`ST\` for static maintenance). The third tells the kind of function: **D** for detail, maintenance or online screens, **S** for summary, **C** for call forms, **R** for reports, **N** for notifications and **G** for gateway. So \`STDCUSAC\` is a static-maintenance detail screen and \`STSCUSAC\` its summary.

## Where TrustForge fits
TrustForge knows these rules. You describe the change and upload your radxml or tables; it asks what it needs, agrees a plan, and produces a radxml that loads in ODT, plus CUSTOM hook code, release JavaScript and the steps to finish in ODT.
`,
    faq: [
      { q: "Is ODT the same as the FLEXCUBE RAD tool?", a: "Yes. ODT, the Oracle Development Workbench and the RAD tool are names for the same tool used to design and generate FLEXCUBE screens and their code." },
      { q: "What file does ODT save a screen design in?", a: "A radxml file named <FUNCTION_ID>_RAD.xml. It holds the whole design, with each element tagged by the release that created it." },
      { q: "Should I edit the generated MAIN package or SYS JavaScript?", a: "No. Change the radxml and regenerate. Put your own logic in the CUSTOM hook package and the CUSTOM release JavaScript." },
    ],
  },
  {
    slug: "flexcube-customization-guide",
    title: "How to customize Oracle FLEXCUBE safely: the CUSTOM layer guide",
    short: "Customizing FLEXCUBE",
    description:
      "How banks customize Oracle FLEXCUBE 14.x without changing Oracle’s code: the CUSTOM layer, radxml deltas, hook packages, extension tables and upgrade safety.",
    keywords: ["FLEXCUBE customization", "customize FLEXCUBE", "FLEXCUBE CUSTOM layer", "FLEXCUBE 14.7 customization", "FCUBS customization"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 8,
    body: `
## The golden rule: never edit Oracle’s code
Every bank eventually needs FLEXCUBE to do something the product doesn’t: an extra field, a new validation, a sixth charge, a different default. The safe way is to work only in the **CUSTOM** layer. Oracle’s KERNEL code stays exactly as shipped, so patches and upgrades don’t wipe out your changes and your changes don’t break Oracle’s.

## What a CUSTOM change is made of
A typical customization of an existing function has up to five parts:
1. **A radxml delta**: the function’s radxml keeps Oracle’s \`RAD_KERNEL\` section untouched and adds a \`RAD_CUSTOM\` section with your new data sources, fields, tabs, screens and field sets.
2. **Storage** for new data, usually a **custom extension table** linked one-to-one to the Oracle table by its primary key, rather than new columns on Oracle’s table.
3. **CUSTOM hook package** code (\`<MOD>PKS_<FID>_CUSTOM\`) for validations, defaults and processing.
4. **Release JavaScript** (\`<FID>_CUSTOM.js\`) for screen behaviour.
5. **Static data**: labels, error messages, and any manual rows such as launch-form nodes.

## Adding to an Oracle screen without breaking it
When you extend a KERNEL function in CUSTOM, ODT merges your CUSTOM section on top of the kernel when it loads the radxml. That has consequences that catch many teams out:
- To add fields to an Oracle block or a tab to an Oracle screen, repeat that node in \`RAD_CUSTOM\` with its kernel values unchanged, plus only your new children.
- Every primary-key column of a new data source must also be a field, or ODT refuses to save (error RD-VALS-027). Map the keys to hidden fields and fill them in the CUSTOM hook.
- Every new field needs its own XSD tag. A copied field that keeps the original tag fails to save (RD-VALS-60).
- After the change, prove nothing regressed: merge the layers as ODT does and confirm that **zero** kernel values changed or disappeared.

## Maintained data versus processed data
Ask early: does the new data only need to be **maintained** on the screen, or must FLEXCUBE also **use** it in transactions or batches? Showing and saving a field is a screen change. Using it at transaction time means reading Oracle’s processing packages, which often have a fixed number of slots, and finding the hooks that reach the CUSTOM layer. That second part is where most of the effort and risk sit.

## Checklist before you load in ODT
- Function ID, release code and layer are right; every new element is tagged with your CUSTOM release.
- Names follow ODT rules: \`BLK_\`, \`CVS_\`, \`TAB_\`, \`SEC_\`, \`FST_\`, \`LOV_\`, \`LBL_\`; field names without underscores.
- No Oracle element was deleted or renamed (hide or deactivate instead).
- Labels and error messages are listed for maintenance.
- Hook code returns TRUE on success and FALSE with an error code on failure, with no COMMIT inside hooks.

## How TrustForge helps
Upload the function’s radxml (and packages if the change affects processing) and describe the change. TrustForge reads the kernel design, asks the decisions that matter (storage, scope, release code), proposes a plan, and only after you approve builds the CUSTOM radxml, extension-table scripts, hook package and release JavaScript, checked so that no Oracle value changes.
`,
    faq: [
      { q: "Can I add columns directly to an Oracle FLEXCUBE table?", a: "You can, but a custom extension table linked one-to-one by the primary key is safer: Oracle patches and upgrades won’t touch it." },
      { q: "What does RD-VALS-027 mean in ODT?", a: "A primary-key column of a data source is not mapped to a field. Map each key column to a (hidden) block field and default it in the CUSTOM hook." },
      { q: "What does RD-VALS-60 mean in ODT?", a: "Two fields share an XSD tag, usually because a field was copied and kept the original tag. Give every new field its own tag." },
    ],
  },
  {
    slug: "flexcube-radxml-explained",
    title: "FLEXCUBE radxml explained: data sources, blocks, screens and field sets",
    short: "radxml explained",
    description:
      "What is inside a FLEXCUBE radxml file: data sources, data blocks, fields, screens, tabs, sections, field sets, LOVs, summary and actions, and the naming rules ODT enforces.",
    keywords: ["radxml", "FLEXCUBE radxml", "RAD xml", "ODT radxml format", "FLEXCUBE data block"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 7,
    body: `
## What a radxml is
A radxml (\`<FUNCTION_ID>_RAD.xml\`) is the complete design of one FLEXCUBE function. ODT reads it, lets you edit it, and generates code from it. The file is split by release: \`RAD_KERNEL\` holds Oracle’s design, and \`RAD_CLUSTER\` and \`RAD_CUSTOM\` hold changes on top. A function created by a bank (CUSTOM origin) has an empty \`RAD_KERNEL\` and everything in \`RAD_CUSTOM\`.

## The building blocks, in design order
**1. Data sources.** The tables or views the function uses. Exactly one is the **master**. Each child names its parent, its relation (parent column on the left, equality only), whether it is one-to-one or one-to-many, and its primary-key columns separated by \`~\`. A one-to-many child needs at least one more key column than its parent. Never use a view as a normal data source; use it for queries only.

**2. Data blocks.** Groups of fields that travel together in the request and response XML. Names start with \`BLK_\` and must not contain the table name. Exactly one master block. Fields map to data-source columns (DATABASE items), or are screen-only (CONTROL items), or show a description (DESC items filled by a list of values).

**3. Screens, tabs and sections.** Screens start with \`CVS_\`, and exactly one is the main screen. Each has header, body and footer portions with the fixed tabs \`TAB_HEADER\`, \`TAB_MAIN\` and \`TAB_FOOTER\`. Sections start with \`SEC_\` and split into partitions: up to three in a large screen’s body or header, four in its footer, two in medium and small screens.

**4. Field sets.** \`FST_\` groups that place block fields on a section and partition, as a single record or a grid. A field may sit in only one visible field set, and every field that must exist on the page (including hidden ones) must be in one.

**5. Call forms and launch forms.** Call forms (third character **C**) embed a subsystem such as charges or settlement. Launch forms open a view-only screen and need a manual \`CSTB_CALL_FORM_NODES\` row.

**6. Lists of values.** \`LOV_\` queries with \`?\` binds, reduction fields with labels, bind variables in order and return fields. Avoid ORDER BY and inline views.

**7. Summary.** The search screen: result fields, up to 12 query fields, and custom buttons.

**8. Actions.** Service, operation and action codes (NEW, MODIFY, AUTHORIZE, QUERY and so on) and which blocks are amendable, needed for web services.

## Naming rules ODT enforces
- Function ID: 8 characters, module first, then D, S, C, R, N or G.
- Prefixes: \`BLK_\`, \`CVS_\`, \`TAB_\`, \`SEC_\`, \`FST_\`, \`LOV_\`, \`LBL_\`.
- Field names: no underscores, and not the same as the column name (\`CONTRACT_REF_NO\` becomes \`CONTREFNO\`).
- Audit fields on maintenance screens (MAKER, CHECKER, MODNO, RECSTAT, AUTHSTAT…) come from the Maint Audit template; never add them by hand.

## Checking a radxml before you load it
ODT is the final judge, but many load and save errors can be caught earlier: missing master blocks, key columns that aren’t fields, duplicate XSD tags, fields in two field sets, or elements without a release tag. TrustForge checks radxml files against these rules, and its Free plan includes radxml reviews.
`,
    faq: [
      { q: "Can I edit a radxml file by hand?", a: "You can, carefully: keep elements in the right release section, follow ODT’s naming rules, and load the result in ODT, which is the final validator. Many teams prefer making changes in ODT and keeping the saved radxml as the master copy." },
      { q: "Why must block names not contain the table name?", a: "Block names appear in the service request and response XML, so they form part of an external contract and shouldn’t expose database names." },
      { q: "How many query fields can a FLEXCUBE summary screen have?", a: "The guides set a maximum of 12 query fields on a summary screen." },
    ],
  },
  {
    slug: "flexcube-new-screen",
    title: "How to build a new FLEXCUBE maintenance screen in ODT, step by step",
    short: "Build a new screen",
    description:
      "Step-by-step guide to creating a new Oracle FLEXCUBE 14.x maintenance screen with ODT: tables, function ID, data sources, blocks, screens, LOVs, summary, generation and deployment.",
    keywords: ["FLEXCUBE new screen", "create screen in ODT", "FLEXCUBE maintenance screen", "FLEXCUBE screen development", "ODT function generation"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 8,
    body: `
## Before you open ODT
Decide three things first:
- **The tables.** Create a master table and any child tables, with primary keys. A maintenance master usually carries the standard audit columns (maker, checker, record status, authorization status, modification number). Create synonyms by adding \`S\` before the first underscore (\`STTM_CUST_RISK_PROFILE\` becomes \`STTMS_CUST_RISK_PROFILE\`).
- **The function ID.** Eight characters: module, then **D** for the detail screen. The summary uses **S** (\`STDCURSK\` and \`STSCURSK\`).
- **The release.** Work in a CUSTOM release, and know its exact release code; every element you add is tagged with it.

## Step 1: Header and preferences
In Function Generation choose **New**, enter the function ID, type **Parent**, category **Maintenance**, and footer template **Maint Audit** (it adds the audit fields for you). In Preferences set the module, the menu entries for the detail and summary screens, and the control string of allowed operations. Maintenance screens never use transaction actions such as REVERSE or LIQUIDATE.

## Step 2: Data sources
Add the master table first, then child tables with their parent, relation and keys. A grid of child records is a one-to-many, multi-record data source.

## Step 3: Data blocks and fields
Create a master block (for example \`BLK_RISK_MASTER\`) and a block for each child grid. Add fields from the columns and rename them without underscores. Choose display types (text, date, select, checkbox, LOV) and mark mandatory fields. Use a DESC field with an LOV to show descriptions such as a customer name.

## Step 4: Screens, field sets and LOVs
Lay out the main screen (\`CVS_MAIN\`) with its tabs and sections, then place fields with field sets: a single-record set for the master and a grid for the children. Add lists of values with \`?\` binds and return fields, for example a customer LOV that fills the customer number and name.

## Step 5: Summary and actions
Design the summary: the block, result fields and query fields. Add actions (NEW, MODIFY, AUTHORIZE, DELETE, CLOSE, REOPEN, QUERY, SUMMARYQUERY) if the screen needs web services.

## Step 6: Save, generate and deploy
Save the radxml, then generate: screen XML, system JavaScript, main package spec and body, the CUSTOM package spec and body, and the static-data scripts (menu, labels, data sources, blocks, screens, LOVs, summary, amendable fields). Deploy the JavaScript and UIXML to the application server and compile the packages and INC scripts in the database. Maintain the labels and any error messages, grant the function to a role, and launch it.

## Step 7: Business logic
Put validations in the CUSTOM hook package, usually in the post default-and-validate stage, returning FALSE with an error code when a check fails. Use release JavaScript only for screen behaviour.

## Doing it with TrustForge
Give TrustForge your table DDL and describe the screen. It designs the function with you, generates a radxml that loads in ODT, checks it against ODT’s rules, and gives you the hook package and the steps to generate and deploy.
`,
    faq: [
      { q: "Which footer template should a FLEXCUBE maintenance screen use?", a: "Maint Audit. It adds the maker, checker, status and modification fields automatically; never add those fields by hand." },
      { q: "How do I name the summary screen for a new function?", a: "Use the same function ID with S as the third character, for example STDCURSK for the detail and STSCURSK for the summary." },
      { q: "Where should validations go for a new maintenance screen?", a: "In the CUSTOM hook package, typically in Fn_Post_Default_And_Validate, returning FALSE with an error code when a check fails." },
    ],
  },
  {
    slug: "flexcube-hook-packages",
    title: "FLEXCUBE CUSTOM hook packages and release JavaScript: a developer guide",
    short: "Hook packages & JS",
    description:
      "How to write Oracle FLEXCUBE CUSTOM hook packages (<MOD>PKS_<FID>_CUSTOM) and release JavaScript: hook stages, call order, error handling and common mistakes.",
    keywords: ["FLEXCUBE hook package", "FLEXCUBE CUSTOM package", "FLEXCUBE release JavaScript", "Fn_Post_Default_And_Validate", "FLEXCUBE PL/SQL customization"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 7,
    body: `
## Where your code lives
ODT generates a **main package** (\`<MOD>PKS_<FID>_MAIN\`) and empty **hook packages** per layer: \`..._KERNEL\`, \`..._CLUSTER\` and \`..._CUSTOM\`. As a bank developer you write only in the CUSTOM package and in the release JavaScript file \`<FID>_CUSTOM.js\`. You never change the main package, the system JavaScript or generated scripts, and you never change the hook package’s generated function list or signatures. Extra helpers belong in a separate package that your hooks call.

## Hook stages and call order
For each processing stage, the main package calls the layers in a fixed order:
1. CUSTOM pre, CLUSTER pre, KERNEL pre,
2. the generated system logic,
3. KERNEL post, CLUSTER post, CUSTOM post.

So the CUSTOM **post** hooks run last and see everything the other layers did.

For **maintenance** screens the main stages are: build type structure, check mandatory (pre/post), default and validate (pre/post), upload to the database (pre/post) and query (pre/post). Put user validations in **post default-and-validate**. Online (transaction) screens add stages such as resolve reference numbers, unlock, product default, subsystem pickup, enrich and process.

## Writing a good hook
- Validate the **working record** (\`p_Wrk_<fid>\`): it is the request merged with the existing data.
- Compare action codes with the global constants (NEW, MODIFY, AUTHORIZE and so on), not string literals.
- On failure, set the error code and parameters, log the error, and return FALSE. Keep the generated WHEN OTHERS handler.
- Loop over multi-record blocks and handle empty collections.
- Don’t COMMIT or ROLLBACK inside hooks; the framework controls the transaction.
- Every new error code needs a message maintained in the error-message table.

## Skipping lower-layer logic
Sometimes Oracle’s logic must be replaced, not extended. The skip handler can switch off a lower layer for a stage, and switch it back on later. Use it sparingly and document why.

## Release JavaScript
\`<FID>_CUSTOM.js\` is not generated: you create it. Functions follow naming conventions such as \`fnPostLoad_CUSTOM\` and \`fnPreSave_CUSTOM\`, and a CUSTOM function overrides a KERNEL function with the same name. Button events call the function named in the field’s event. Read the screen’s system JavaScript to find the exact field IDs before using them.

## Beyond the screen: processing packages
Business processing often lives in other Oracle packages that call their own CLUSTER and CUSTOM layers with a call ID. Read the CLUSTER body to confirm a hook really reaches CUSTOM in your environment before relying on it.

## How TrustForge helps
TrustForge writes CUSTOM hook bodies that match the generated specification exactly, follows the call-order and error rules above, and lists every new error message for you to maintain.
`,
    faq: [
      { q: "Which hook should hold FLEXCUBE validations?", a: "Fn_Post_Default_And_Validate in the CUSTOM hook package, validating the working record." },
      { q: "Can I add functions to the generated CUSTOM hook package?", a: "Don’t change its generated function list or signatures. Put helpers in a separate package and call them from the hooks." },
      { q: "In what order do FLEXCUBE layers run?", a: "CUSTOM pre, CLUSTER pre, KERNEL pre, the generated system logic, then KERNEL post, CLUSTER post and CUSTOM post." },
    ],
  },
  {
    slug: "flexcube-silent-odt",
    title: "FLEXCUBE Silent ODT: bulk generation, source refresh and REST/SOAP artifacts",
    short: "Silent ODT",
    description:
      "What the FLEXCUBE Silent ODT utility does and how to use it for bulk generation, upgrade source refresh, SOAP service XML and REST artifact generation without the ODT screens.",
    keywords: ["Silent ODT", "FLEXCUBE bulk generation", "FLEXCUBE source refresh", "FLEXCUBE REST services", "FLEXCUBE upgrade customization"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## What Silent ODT is
Silent ODT runs ODT operations from the command line, driven by properties files, with no screens. Teams use it when there are too many functions to handle one by one, or as part of an automated build.

## What it can do
- **Bulk generation**: regenerate units (UIXML, system JavaScript, packages, static-data scripts, XSDs) for a list of radxml files.
- **Source refresh**: carry CUSTOM changes onto a new KERNEL or CLUSTER base during an upgrade, then regenerate.
- **Child and screen-child refresh** within a release.
- **SOAP**: update, refresh and generate service XML and related artifacts.
- **REST**: generate REST artifacts for enabled functions.

## How a run is set up
A run reads a main properties file (database connection, release, environment, paths and the symmetric key) and an operations file that lists steps in order. Login and set-release always come first, followed by the operations you need. List files hold the radxml paths, one per line; for refresh, the source and base lists must match line by line, with parent radxml files included for child screens.

## Passwords and keys
Passwords and connection details are stored **encrypted**, using the utility’s encryption tool and a 16-character symmetric key. Never put clear-text passwords in the files, and don’t commit them to source control.

## After the run
Check the utility log, the generation status report (every line should succeed) and any XSD validation errors. Then deploy and test as usual.

## Upgrades and refresh
An upgrade is where layering pays off: if your changes live only in CUSTOM, a source refresh can re-apply them to the new kernel. Changes that deleted or renamed Oracle elements, or edited generated code, are what make upgrades painful.

## How TrustForge helps
TrustForge prepares Silent ODT properties and list files for your goal (bulk generation, refresh, SOAP or REST), with placeholders for every secret, plus the run and verification steps.
`,
    faq: [
      { q: "Does Silent ODT need the ODT user interface?", a: "No. It runs from the command line using properties and list files, which makes it suitable for bulk work and automated builds." },
      { q: "How are passwords handled in Silent ODT?", a: "They are encrypted with the utility’s encryption tool and a 16-character symmetric key; clear-text passwords should never be stored in the files." },
      { q: "When is source refresh used?", a: "During upgrades, to carry CUSTOM-layer changes onto a new KERNEL or CLUSTER base before regenerating." },
    ],
  },
  {
    slug: "learn-flexcube-development",
    title: "How to learn Oracle FLEXCUBE development: a practical roadmap",
    short: "Learn FLEXCUBE",
    description:
      "A practical roadmap to learning Oracle FLEXCUBE Universal Banking development: ODT basics, radxml, maintenance and online screens, hook packages, deployment and upgrades.",
    keywords: ["learn FLEXCUBE", "FLEXCUBE training", "FLEXCUBE tutorial", "Oracle FLEXCUBE developer", "FLEXCUBE for beginners"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 7,
    body: `
## Who this is for
Developers joining a FLEXCUBE Universal Banking (FCUBS) team, consultants moving from functional to technical work, and banks training their own staff. You will need comfort with SQL and PL/SQL, some JavaScript, and access to a development environment with ODT.

## Stage 1: The platform
Learn how FLEXCUBE is put together: modules (two-letter codes), function IDs, the maker-checker model, branches, and how screens talk to the database through generated packages. Learn the three release layers (KERNEL, CLUSTER, CUSTOM) and why bank code belongs in CUSTOM. Start with our guide to [what ODT is](/learn/what-is-flexcube-odt).

## Stage 2: Read before you write
Open existing screens in ODT and study their radxml: data sources, blocks, field sets, LOVs and summary. Read a generated main package and a hook package to see where each stage runs. Our [radxml guide](/learn/flexcube-radxml-explained) covers the structure and the naming rules.

## Stage 3: Your first maintenance screen
Build a small maintenance screen end to end: tables, function ID, design, generation, deployment, labels, role access and testing. Follow the [step-by-step new screen guide](/learn/flexcube-new-screen).

## Stage 4: Business logic
Write validations and defaults in the CUSTOM hook package, and screen behaviour in release JavaScript. Learn the hook stages, the call order and the error-handling pattern from the [hook packages guide](/learn/flexcube-hook-packages).

## Stage 5: Changing Oracle’s screens
Customize an existing Oracle function in CUSTOM: radxml deltas, extension tables, the save errors you will meet, and proving that nothing regressed. See [how to customize FLEXCUBE safely](/learn/flexcube-customization-guide).

## Stage 6: Online screens, call forms and services
Move on to transaction (online) screens and their extra stages, call forms and launch forms, web-service actions and REST.

## Stage 7: Scale and upgrades
Use [Silent ODT](/learn/flexcube-silent-odt) for bulk generation and source refresh, and learn what makes upgrades easy (clean CUSTOM layering) or painful (edited generated code).

## Practise with feedback
The fastest way to learn is to build real changes and get them checked. TrustForge’s Free plan reviews your radxml against ODT’s rules and answers ODT questions from the guides, and the Partner plan builds and explains full customizations with you.
`,
    faq: [
      { q: "What skills do I need to learn FLEXCUBE development?", a: "SQL and PL/SQL, basic JavaScript and XML, and access to a FLEXCUBE development environment with ODT." },
      { q: "Where should a new FLEXCUBE developer start?", a: "Understand modules, function IDs and release layers, then read existing radxml files and generated packages before building a first maintenance screen." },
      { q: "Can I learn FLEXCUBE without Oracle’s environment?", a: "You can learn the concepts, but practical skills need a development environment with ODT, normally provided by your bank or employer." },
    ],
  },
];

/** All guides; the newest set first so the hub and the home page lead with them. */
export const ARTICLES: Article[] = [...MORE_ARTICLES, ...BASE_ARTICLES];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
