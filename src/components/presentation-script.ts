/**
 * The TrustForge presentation: 12 chapters, 600 seconds. Captions are the narration (shown as subtitles, spoken
 * when voice is on, and listed in full as the transcript for readers and search engines).
 * `at` = seconds from the start of the chapter.
 */

export type Caption = { at: number; text: string };
export type Chapter = { id: string; title: string; seconds: number; captions: Caption[] };

export const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    title: "TrustForge in ten minutes",
    seconds: 30,
    captions: [
      { at: 0, text: "This is TrustForge: an AI agent for Oracle FLEXCUBE customization, built on Anthropic." },
      { at: 10, text: "In the next ten minutes you’ll see what FLEXCUBE changes cost today, how TrustForge builds them, and what stays with your team." },
      { at: 22, text: "Let’s start with the problem." },
    ],
  },
  {
    id: "problem",
    title: "What customization costs today",
    seconds: 60,
    captions: [
      { at: 0, text: "Every bank running Oracle FLEXCUBE needs changes: a new field, a new charge, a new screen for a local regulation." },
      { at: 14, text: "Through an implementation partner, a single customization often costs tens of thousands of dollars, and large ones run into the hundreds of thousands." },
      { at: 30, text: "Partners staff programmes with tens to hundreds of developers, billed by the hour." },
      { at: 42, text: "And it takes weeks of analysis and development before the first file reaches ODT." },
    ],
  },
  {
    id: "why",
    title: "Why FLEXCUBE work is slow",
    seconds: 50,
    captions: [
      { at: 0, text: "Most of that effort isn’t business logic. It’s knowing ODT, the Oracle Development Workbench." },
      { at: 12, text: "FLEXCUBE code is layered: Oracle’s KERNEL, the CLUSTER layer, and your bank’s CUSTOM layer." },
      { at: 24, text: "Every change must follow rules about how these layers merge, which scripts ODT must generate, and how hook packages are called." },
      { at: 38, text: "Miss one rule and the screen won’t save, or Modify fails in testing weeks later." },
    ],
  },
  {
    id: "meet",
    title: "Meet the agent",
    seconds: 40,
    captions: [
      { at: 0, text: "TrustForge carries those rules. It’s an AI agent built on Anthropic’s AI, with FLEXCUBE ODT knowledge and checks for every kind of job." },
      { at: 16, text: "You work with it like a senior ODT developer: describe, discuss, build, deliver." },
      { at: 28, text: "Here’s a real job, from start to finish." },
    ],
  },
  {
    id: "describe",
    title: "1. Describe",
    seconds: 60,
    captions: [
      { at: 0, text: "A developer opens TrustForge, picks “Customize a function”, FLEXCUBE 14.7, the CUSTOM layer, and types the bank’s release code." },
      { at: 16, text: "The requirement is one sentence: add a sixth charge to IFDATMMN, the same as charge five." },
      { at: 30, text: "They upload the function’s radxml, the table definition and the related packages. Development objects only, never customer data." },
      { at: 46, text: "TrustForge reads everything and restates the requirement as numbered, testable items." },
    ],
  },
  {
    id: "discuss",
    title: "2. Discuss",
    seconds: 60,
    captions: [
      { at: 0, text: "Then it asks only the questions that change the design." },
      { at: 10, text: "Where should charge six be stored? A custom extension table, linked one to one, so Oracle’s table stays untouched." },
      { at: 26, text: "Is it only maintained, or also used when transactions are processed? That decides how far the change goes." },
      { at: 40, text: "It proposes a plan: the files it will deliver, the risks, and the limits. Nothing is built until the developer approves." },
    ],
  },
  {
    id: "build",
    title: "3. Build and check",
    seconds: 60,
    captions: [
      { at: 0, text: "Once approved, TrustForge builds every file." },
      { at: 8, text: "The radxml with thirty-six new fields in the CUSTOM layer. The extension table. The CUSTOM hook package with charge-six validations. The release JavaScript. Label scripts." },
      { at: 28, text: "Then it checks them: ODT’s load and save rules, every reference between blocks, fields and lists of values." },
      { at: 44, text: "And it proves the most important thing: Oracle values changed, zero." },
    ],
  },
  {
    id: "deliver",
    title: "4. Deliver",
    seconds: 50,
    captions: [
      { at: 0, text: "The developer downloads the files, with a CHANGES guide: the deployment order and unit tests for every requirement." },
      { at: 16, text: "They load the radxml in ODT, generate, and send the generated zip back. TrustForge checks the zip before anything is compiled." },
      { at: 32, text: "Then the bank compiles, deploys and tests in its own environments. The bank stays in control." },
    ],
  },
  {
    id: "learns",
    title: "It learns from every deployment",
    seconds: 40,
    captions: [
      { at: 0, text: "Real deployments teach things no manual says." },
      { at: 8, text: "On this job, Modify failed with ST-AMND-002. TrustForge traced it: ODT only generates amendable scripts when the CUSTOM layer has its own Actions node." },
      { at: 26, text: "The fix shipped the same day, and a new check now catches it for every bank, before anything reaches the database." },
    ],
  },
  {
    id: "safety",
    title: "Built for how banks work",
    seconds: 40,
    captions: [
      { at: 0, text: "Oracle’s code is never edited: everything goes in the CUSTOM layer." },
      { at: 10, text: "Nothing is built without approval, and passwords and keys are never written into files." },
      { at: 20, text: "Each job runs in a private sandbox and its files are deleted with it. Banks that need it can run TrustForge inside their own network." },
    ],
  },
  {
    id: "cost",
    title: "Up to 90% less",
    seconds: 60,
    captions: [
      { at: 0, text: "So what does this change?" },
      { at: 6, text: "The usual way: tens to hundreds of thousands of dollars, weeks of work, and large partner teams." },
      { at: 22, text: "With TrustForge: hundreds of dollars, the first files in minutes, and your own developers reviewing and testing." },
      { at: 40, text: "For many changes, that’s up to ninety percent lower development cost. Savings depend on scope, and your team still tests every change." },
    ],
  },
  {
    id: "start",
    title: "Start today",
    seconds: 50,
    captions: [
      { at: 0, text: "Start free with radxml reviews and ODT questions." },
      { at: 10, text: "Move your team to Partner for new screens, customizations, hook code and Silent ODT, with a daily, weekly and monthly usage allowance per seat, and extra usage when you need it." },
      { at: 30, text: "Or arrange a private install in your bank’s own cloud." },
      { at: 40, text: "TrustForge, by TrustRoute Technologies. FLEXCUBE customizations, forged in conversation." },
    ],
  },
];

export const TOTAL_SECONDS = CHAPTERS.reduce((s, c) => s + c.seconds, 0);
