import type { Article } from "@/lib/learn";

/**
 * More Learn guides (second set): AI agents for FLEXCUBE, cost, real deployment problems, and how-tos.
 * Original writing from TrustForge's verified ODT knowledge and real deployments; not copied from Oracle.
 */

const PUBLISHED = "2026-11-22";

export const MORE_ARTICLES: Article[] = [
  {
    slug: "flexcube-ai-agent",
    title: "An AI agent for Oracle FLEXCUBE: how TrustForge customizes FLEXCUBE with Anthropic’s AI",
    short: "AI agent for FLEXCUBE",
    description:
      "How an AI agent built on Anthropic can design FLEXCUBE screens, customize Oracle functions and write hook code in ODT, and what your developers still do.",
    keywords: ["FLEXCUBE AI agent", "AI assistant for FLEXCUBE", "Anthropic AI agent", "Oracle FLEXCUBE AI", "AI for core banking development"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 7,
    body: `
## What an AI agent means for FLEXCUBE work
An AI assistant answers questions. An **AI agent** does the work: it reads your files, asks what it needs, plans the change, builds the deliverables and checks them. TrustForge is an AI agent built on **Anthropic’s AI** and trained on how Oracle FLEXCUBE Universal Banking is developed with ODT (the Development Workbench). It works inside a private sandbox for each job and never touches your FLEXCUBE environment.

## What the agent does in a job
1. **Reads your objects.** The function’s radxml, table definitions, packages and JavaScript you upload.
2. **Restates the requirement** as numbered, testable items and asks only the questions that change the design: where data is stored, which release code to tag, whether the new data is only maintained or also processed.
3. **Agrees a plan** with you before building anything.
4. **Builds** the radxml (new function or CUSTOM delta), the CUSTOM hook package, the release JavaScript, DDL and label scripts.
5. **Checks** the result against ODT’s load and save rules, proves no Oracle value changed, and writes the deployment order and unit tests.

## Why the rules matter more than the model
FLEXCUBE punishes small mistakes: a primary-key column missing from a data source stops ODT saving; a missing Actions node in the CUSTOM layer means no amendable scripts and a failed Modify. TrustForge carries these rules as checks that run on every job, and it learns from real deployments: when a bank reports a new problem and the cause is confirmed, a new check is added so it can’t happen again. Read one example in [Fixing ST-AMND-002](/learn/flexcube-st-amnd-002-amendable).

## What your developers still do
The agent prepares; your team decides and deploys. Developers review the plan and the files, load the radxml in ODT, generate, compile, and test in their own environments. That keeps the bank in control and makes the agent’s output auditable like any other change.

## Data and safety
Upload development objects only: radxml, DDL, packages, JavaScript. Never customer data or passwords. Each job’s files are used for that job and deleted with it. Banks that need everything inside their network can run a private install on their own Anthropic, AWS Bedrock or Google Vertex account.

## Getting started
Start with a free [radxml review](/sign-in) or an ODT question. When your team is ready, the Partner plan covers new screens, customizations, hook code and Silent ODT. See also [the cost of FLEXCUBE customization](/learn/flexcube-customization-cost).
`,
    faq: [
      { q: "Which AI does TrustForge use?", a: "TrustForge is built on Anthropic’s AI, with FLEXCUBE ODT knowledge, rules and checks added for each kind of job." },
      { q: "Does the AI agent connect to our FLEXCUBE environment?", a: "No. It works on the files you upload, in a private sandbox per job. Your developers load and deploy the results." },
      { q: "Can the agent change Oracle’s KERNEL code?", a: "No. Changes go in the CUSTOM layer, and every delivery proves that no Oracle value changed." },
    ],
  },
  {
    slug: "flexcube-customization-cost",
    title: "What does a FLEXCUBE customization cost, and how AI cuts it by up to 90%",
    short: "FLEXCUBE customization cost",
    description:
      "Why Oracle FLEXCUBE customizations cost banks tens to hundreds of thousands of dollars, where the hours go, and how an AI agent reduces the cost by up to 90%.",
    keywords: ["FLEXCUBE customization cost", "FLEXCUBE implementation partner", "FLEXCUBE development hours", "reduce core banking customization cost", "FLEXCUBE AI"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## Why FLEXCUBE changes are expensive
A typical change, such as a new field on a maintenance screen, an extra charge slot or a new screen for a local regulation, passes through many hands:
- **Analysis**: a business analyst and a functional consultant write the requirement and the design.
- **ODT development**: a developer designs the radxml, generates the units and writes the CUSTOM hook package and release JavaScript.
- **Database work**: DDL, label scripts, amendable and menu data.
- **Review, deployment and testing** across environments.

Through an implementation partner, each step is billed in developer hours. Partners staff programmes with tens to hundreds of developers, and a single customization can cost a bank **tens to hundreds of thousands of dollars** and take weeks before the first file reaches ODT.

## Where the hours really go
Most of the effort is not business logic. It is knowing ODT’s rules: how release layers merge, which nodes must be copied into the CUSTOM layer, which INC scripts must be generated, how hook packages are called, which save errors mean what. That knowledge is scarce, which is why it is expensive.

## What changes with an AI agent
An AI agent like TrustForge carries those rules and applies them in minutes:
- the **first files arrive in minutes**, not weeks;
- every delivery is **checked** against ODT’s load and save rules before your team sees it;
- your developers spend their time **reviewing, deploying and testing**, not hand-building XML.

The same change costs **hundreds of dollars** in TrustForge seats and usage instead of tens of thousands in partner hours. For many changes that is a cost reduction of **up to 90%**. The exact saving depends on the scope and on how much testing your bank requires.

## What it doesn’t replace
Your bank still owns the decision, the review, deployment and testing. TrustForge makes the development step fast and cheap; it doesn’t remove the bank’s controls.

## Try it on a real change
Start with a free radxml review, or read [how the AI agent works](/learn/flexcube-ai-agent) first.
`,
    faq: [
      { q: "How much does a FLEXCUBE customization usually cost?", a: "Through an implementation partner, a single customization commonly costs tens to hundreds of thousands of dollars, depending on scope, testing and the partner’s rates." },
      { q: "How much can an AI agent save?", a: "Up to 90% of the development cost for many changes, because the first files arrive in minutes and are already checked. Savings depend on scope; review and testing remain with the bank." },
      { q: "Does TrustForge replace our implementation partner?", a: "It replaces much of the development effort. Your team, or your partner, still reviews, deploys and tests the changes." },
    ],
  },
  {
    slug: "flexcube-st-amnd-002-amendable",
    title: "Fixing ST-AMND-002 in FLEXCUBE: new fields fail on Modify",
    short: "Fixing ST-AMND-002",
    description:
      "Why FLEXCUBE raises ST-AMND-002 on Modify for newly added fields, how to read the Fn_Get_Amendable_Details log, and the two causes in ODT with their fixes.",
    keywords: ["ST-AMND-002", "FLEXCUBE amendable fields", "FLEXCUBE modify error", "GWTB_AMEND_FIELDS", "FLEXCUBE ODT amendable"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## The symptom
You add fields to a FLEXCUBE maintenance screen (for example in a CUSTOM extension table), deploy, and New works. Then **Unlock → change a new field → Save** fails with **ST-AMND-002**. The debug log shows lines like:

\`\`\`
Cspks_Req_Utils :: In Fn_Get_Amendable_Details :<TABLE>.<COLUMN>
Cspks_Req_Utils :: In Fn_Get_Amendable_Details LAST:FLEXCUBE/<FID>_MODIFY
Cspks_Req_Utils :: In Pr_Log_Error :FLEXCUBE /ST-AMND-002/@<NEW_TABLE>.<NEW_COLUMN>~...
\`\`\`

The first lines list every field FLEXCUBE allows to change on Modify. If your new table’s columns are not in that list, FLEXCUBE rejects the change.

## Where the amendable list comes from
The list is static data generated by ODT: the **amendable INCs** \`GWTM_AMEND_MASTER\`, \`GWTM_AMEND_NODES\`, \`GWTM_AMEND_FIELDS\`, \`GWTB_AMEND_NODES\` and \`GWTB_AMEND_FIELDS\`. Setting a field’s amendable flag in the radxml is not enough: those INCs must be generated and compiled.

## Cause 1: Amendable not ticked on Generate
ODT only generates the units you tick, and it doesn’t warn you. If **Amendable** wasn’t ticked, the zip has no amend INCs. Regenerate with it ticked.

## Cause 2: no Actions node in the CUSTOM layer
This one is less obvious. When you extend an Oracle (KERNEL) function in the CUSTOM release, ODT builds the amendable INCs from the **Actions** of the release being generated. Actions, Preferences and Summary are copied whole into a layer only when someone opens them in that release. If the CUSTOM layer of the radxml has no \`RAD_ACTIONS\` node, ODT generates no amend INCs **even with Amendable ticked**. A brand-new CUSTOM function always has Actions in its CUSTOM layer, which is why new screens don’t hit this.

**Fix:** open the Actions node in ODT in the CUSTOM release and Save (or copy the kernel \`RAD_ACTIONS\` unchanged into \`RAD_CUSTOM\`), then generate again with Amendable ticked.

## Check before you compile
Before deploying, open the zip and confirm:
1. all five amend INCs are in \`INC/\`;
2. \`GWTB_AMEND_FIELDS\` has a row for each new field for \`<FID>_MODIFY\`;
3. it **still has the Oracle fields** too, because the INC deletes and reinserts the whole list for the function.

Compile the five INCs, commit, clear the application cache, and retest Modify. No package needs recompiling.

## Not the cause
"Other Label Not Found in Cstb_Other_Labels" for your table in the same log is only the error message looking up a block label. It’s harmless.

## How TrustForge prevents it
TrustForge’s radxml check fails when a CUSTOM layer adds amendable fields without Actions, and its zip check fails when any amendable field is missing from the amend INCs, so this is caught before anything reaches the database. More in [the ODT deployment checklist](/learn/flexcube-odt-deployment-checklist).
`,
    faq: [
      { q: "What does ST-AMND-002 mean in FLEXCUBE?", a: "A field was changed on Modify that is not in the function’s amendable list (GWTB/GWTM_AMEND_FIELDS), so FLEXCUBE rejects the change." },
      { q: "I ticked Amendable and still get ST-AMND-002. Why?", a: "For a KERNEL function changed in CUSTOM, the CUSTOM layer needs its own Actions node. Without it ODT generates no amend INCs for the CUSTOM release. Open Actions in the CUSTOM release, save, and regenerate." },
      { q: "Do I need to recompile packages to fix ST-AMND-002?", a: "No. Compile the five amend INC scripts, commit, and clear the application cache." },
    ],
  },
  {
    slug: "flexcube-add-field-to-screen",
    title: "How to add a field to an Oracle FLEXCUBE screen in the CUSTOM layer",
    short: "Add a field to a FLEXCUBE screen",
    description:
      "Step-by-step guide to adding a new field to an existing Oracle FLEXCUBE maintenance screen with ODT: extension table, data source, block field, field set, labels and amendables.",
    keywords: ["add field to FLEXCUBE screen", "FLEXCUBE customization guide", "FLEXCUBE extension table", "FLEXCUBE ODT tutorial", "FLEXCUBE CUSTOM layer"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 8,
    body: `
## Before you start
You need the function’s latest radxml (\`<FID>_RAD.xml\`), the table definition of its master table, a CUSTOM release in ODT, and a release code to tag your changes with. Never alter Oracle’s table; store new data in a custom extension table.

## 1. Create a 1:1 extension table
Create \`<MASTER>_CUSTOM\` with the master table’s primary-key columns plus your new columns, and a synonym or view in FLEXCUBE’s naming style. Linking 1:1 by the full primary key keeps upgrades safe and keeps Oracle’s table untouched.

## 2. Add a data source
In ODT, CUSTOM release, add the extension table as a **child data source** of the master: relation type 1, relation on every primary-key column, not mandatory. Every primary-key column must also be a field of the data source, or ODT refuses to save (RD-VALS-027).

## 3. Add block fields
Add the new fields to the master block, mapped to the new data source and columns. Add the key columns as hidden, read-only, non-amendable fields so the save carries them. Give each new field a unique XSD tag (duplicates fail with RD-VALS-60).

## 4. Place them on the screen
Add the fields to a field set on the right tab and section, or create a new tab. Each visible field belongs to exactly one field set.

## 5. Labels and lists of values
Use existing label codes where the meaning matches; add new ones with a label script. Reuse Oracle’s lists of values where possible.

## 6. Make them amendable
Set the fields as amendable in Modify, and make sure the CUSTOM layer has its own **Actions** node (open Actions in the CUSTOM release and Save). Without it, Modify fails with ST-AMND-002. See [Fixing ST-AMND-002](/learn/flexcube-st-amnd-002-amendable).

## 7. Save, generate, deploy
Save the radxml, generate (UIXML, SYS JavaScript, main package, custom spec, data source, block, screen, labels, LOV, **Amendable**), check the zip, deploy the front end, compile the INCs and packages, and test New, Modify, Query and Authorise.

## 8. Logic in the CUSTOM hook package
Validations and defaults go in \`<MOD>PKS_<FID>_CUSTOM\`, usually in the post default-and-validate hook. Read more in [the hook packages guide](/learn/flexcube-hook-packages).

## Faster with an AI agent
TrustForge does steps 1 to 8 from your radxml and a sentence of requirement, and checks every rule above before you load the file. See [how the agent works](/learn/flexcube-ai-agent).
`,
    faq: [
      { q: "Should I add columns to Oracle’s FLEXCUBE table?", a: "No. Use a custom extension table linked 1:1 by the primary key, so Oracle’s tables and upgrades stay untouched." },
      { q: "Why does ODT refuse to save my new data source?", a: "Usually because a primary-key column of the data source is not one of its fields (RD-VALS-027). Add the key columns as hidden fields." },
      { q: "Where does validation for the new field go?", a: "In the CUSTOM hook package, typically the post default-and-validate hook, never in the generated main package." },
    ],
  },
  {
    slug: "flexcube-lov-guide",
    title: "FLEXCUBE list of values (LOV) guide for ODT developers",
    short: "FLEXCUBE LOV guide",
    description:
      "How lists of values work in Oracle FLEXCUBE ODT: queries, bind variables, return fields, description fields, global LOVs and performance for large tables.",
    keywords: ["FLEXCUBE LOV", "FLEXCUBE list of values", "ODT LOV bind variables", "FLEXCUBE description field", "FLEXCUBE ODT guide"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## What a LOV is
A list of values (LOV) is the search pop-up behind a field: a SQL query, the columns shown to the user, and the fields the chosen row fills in. In the radxml each LOV is a named element; fields point to it by name.

## The query
Write a plain SELECT over FLEXCUBE’s views or synonyms. Avoid ORDER BY on large lists, and filter by branch, record status and authorisation status where it applies. Each \`?\` in the query is a **bind variable**.

## Bind variables
Bind variables pass values from the screen into the query, in the order of the question marks: the current branch, the product chosen earlier, the currency. Each one names a block and field. A mismatch between the number of \`?\` and the binds is a common reason a LOV returns nothing.

## Return fields
Each query column can fill a field on the screen. The column that fills the field itself is the key; others fill **description fields**, read-only fields that show the name next to a code. A description field’s parent is the field whose LOV fills it.

## Validation on tab-out
With "LOV validation required", a typed value must exist in the LOV’s results. Use it for codes that must be valid; leave it off for free text.

## Global LOVs and reuse
Reuse Oracle’s LOVs where the meaning matches (branches, currencies, GLs, accounts). Copy and rename only when you need different filters, and tag the copy with your CUSTOM release.

## Large tables
For accounts and customers, use exact fetch, mandatory reduction criteria and the high-volume options so the LOV never scans millions of rows on open.

## With TrustForge
TrustForge writes LOVs with the right binds and return fields and checks every reference before you load the radxml. Start from [the radxml guide](/learn/flexcube-radxml-explained).
`,
    faq: [
      { q: "Why does my FLEXCUBE LOV return no rows?", a: "Often the bind variables don’t match the question marks in the query, or a filter like record status excludes the rows." },
      { q: "What is a description field in FLEXCUBE?", a: "A read-only field that shows the name for a code. It is filled by the parent field’s LOV through a return field." },
      { q: "Should LOV queries use ORDER BY?", a: "Avoid it on large lists; it slows the pop-up. Let users narrow the search instead." },
    ],
  },
  {
    slug: "ai-assistant-core-banking-development",
    title: "Using an AI assistant for core banking development, safely",
    short: "AI for core banking, safely",
    description:
      "How banks can use an AI assistant or AI agent for core banking development such as Oracle FLEXCUBE: what to share, controls to keep, and how Anthropic-based tools fit.",
    keywords: ["AI assistant for core banking", "AI agent banking development", "Anthropic for banks", "FLEXCUBE AI assistant", "AI in core banking"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 6,
    body: `
## Why banks are adopting AI for development
Core banking customization is expert work with long queues. AI agents built on models such as Anthropic’s can now read a bank’s development objects, plan a change and produce the code, so developers spend their time on review and testing instead of hand-building every file.

## What to share, and what never to share
Share **development objects**: screen definitions (radxml), table definitions, packages, JavaScript and the requirement. Never share **customer data**, production extracts, passwords, keys or environment addresses. A good assistant tells you exactly which objects it needs and nothing more.

## Controls to keep
- **Plan before build.** The agent proposes the change and waits for approval.
- **Bank-owned deployment.** The agent never connects to your environments; your team loads, compiles and tests.
- **Layer discipline.** For FLEXCUBE, changes stay in the CUSTOM layer and Oracle’s code is untouched.
- **Traceability.** Every delivery lists its files, deployment order and unit tests, so it can go through change control like any other change.

## Where the AI runs
A hosted service runs each job in a private sandbox and deletes the job’s files with it. Banks that need everything inside their network can run the same agent on their own Anthropic, AWS Bedrock or Google Vertex account.

## Measuring the benefit
Track time to first files, review findings and defects found in testing. Teams typically see the development step shrink from weeks to minutes, and the cost of a customization fall by up to 90%; see [the cost of FLEXCUBE customization](/learn/flexcube-customization-cost).

## Getting started
Pick one well-understood change, such as a new field or a small maintenance screen, run it through the agent, and compare the result with your usual process. Read [how TrustForge works](/learn/flexcube-ai-agent).
`,
    faq: [
      { q: "Is it safe to use AI for core banking development?", a: "Yes, with controls: share development objects only, approve the plan before building, and keep deployment and testing with the bank." },
      { q: "Does the AI need access to our core banking system?", a: "No. A good agent works only on the files you upload and returns files for your team to deploy." },
      { q: "Can we run the AI inside our own network?", a: "Yes, with a private install on your own Anthropic, AWS Bedrock or Google Vertex account." },
    ],
  },
  {
    slug: "flexcube-odt-deployment-checklist",
    title: "FLEXCUBE ODT deployment checklist: generate, check, compile, test",
    short: "ODT deployment checklist",
    description:
      "A practical checklist for deploying an Oracle FLEXCUBE ODT change: what to tick on Generate, what the zip must contain, compile order, and the tests that catch common failures.",
    keywords: ["FLEXCUBE deployment checklist", "ODT generate", "FLEXCUBE INC scripts", "FLEXCUBE compile order", "FLEXCUBE ODT guide"],
    published: PUBLISHED,
    updated: PUBLISHED,
    minutes: 7,
    body: `
## 1. Before generating
- The radxml loads and saves in ODT without errors in your CUSTOM release.
- Every new element is tagged with your release code.
- If the CUSTOM layer adds amendable fields, it has its own **Actions** node.

## 2. Tick the right units
For a change to an existing maintenance function, tick: Screen XML (UIXML), System JS, Main Package Spec and Body, Custom Package Spec, Data source, Block, Screen, Label details, LOV, **Amendable**, Summary if it changed, and Block PK Columns if the master table or its key changed. Don’t overwrite a hand-written CUSTOM package body with ODT’s empty one.

## 3. Check the zip before anything else
ODT doesn’t warn when a unit is missing; the failure shows up later at runtime. Confirm:
- the UIXML, SYS JavaScript and both package specs are present;
- every data source is in \`CSTB_FID_DATA_SOURCES\` and used by the main package;
- every LOV is in \`CSTB_LOV_INFO\`, and every new field is in \`CSTB_FIELD_LABELS\` and the UIXML;
- the five amend INCs are present and list every amendable field, Oracle’s and yours;
- a new function has all four menu INCs.

## 4. Compile in order
1. DDL for new tables, then synonyms.
2. Generated INCs; commit.
3. Main package spec and body.
4. CUSTOM package spec from the zip, then your CUSTOM body.
5. Label and other static scripts.
6. Check for invalid objects.

## 5. Deploy the front end
UIXML, the generated SYS JavaScript and your CUSTOM release JavaScript to the application server. Clear the cache or restart if your environment needs it.

## 6. Test the full life cycle
New, Save, Authorise, Query, **Unlock and Modify**, Close and Reopen, plus every validation message. Modify is where missing amendables show up (see [ST-AMND-002](/learn/flexcube-st-amnd-002-amendable)).

## Automate the checks
TrustForge runs the radxml and zip checks above on every job and tells you exactly what to regenerate. See [how the agent works](/learn/flexcube-ai-agent).
`,
    faq: [
      { q: "What should I tick when generating in ODT?", a: "For an existing maintenance function: UIXML, System JS, main package, custom spec, data source, block, screen, labels, LOV and Amendable, plus Summary and Block PK Columns when they changed." },
      { q: "In what order should FLEXCUBE units be compiled?", a: "DDL, generated INCs, main package spec and body, CUSTOM spec and body, then static scripts; then check for invalid objects." },
      { q: "Which test catches missing amendables?", a: "Unlock and Modify a record, changing each new field. Missing amend INCs fail with ST-AMND-002." },
    ],
  },
];
