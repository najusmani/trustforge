/**
 * The TrustForge sales pitch: 10 chapters, about 5 minutes. `text` is exactly what the voice reads
 * (the Clipchamp text-to-speech script in marketing/trustforge-pitch-voice-script.md is generated from it).
 * Subtitles are the sentences of `text`, timed by word count within each chapter.
 */

export type Chapter = { id: string; title: string; text: string };

export const CHAPTERS: Chapter[] = [
  {
    id: "hook",
    title: "What if…",
    text:
      "What if your next Oracle FLEXCUBE customization cost hundreds of dollars, instead of hundreds of thousands? What if the first files were ready in minutes, not weeks? Imagine your developers describing a change in plain words, and getting files ready for ODT the same day. Meet TrustForge: the AI agent for FLEXCUBE customization, built on Anthropic.",
  },
  {
    id: "problem",
    title: "The cost today",
    text:
      "Today, every FLEXCUBE change is expensive. A new field, a new charge, a new screen for the regulator. Through an implementation partner, a single customization can cost tens of thousands of dollars, and the large ones run into the hundreds of thousands. Partners bill whole teams of developers by the hour, and the backlog keeps growing. Specialist ODT skills are scarce, so every change queues behind the last one. Weeks go by before the first file even reaches ODT. Your business waits, and your budget pays for every hour.",
  },
  {
    id: "meet",
    title: "Meet TrustForge",
    text:
      "TrustForge changes that. It is an AI agent built on Anthropic, trained on how FLEXCUBE is really built with ODT, the Oracle Development Workbench. It works like a senior ODT developer on your team. It understands radxml, release layers, hook packages, and the rules that make a screen load, save and deploy. It never forgets a rule, never skips a check, and never gets tired. And it is available to every developer on your team, at any hour.",
  },
  {
    id: "how",
    title: "How it works",
    text:
      "Working with TrustForge is a conversation. First, describe the change in plain words, and upload your objects: the radxml, the tables, the packages. Second, discuss. TrustForge asks only the questions that matter, and proposes a plan. Nothing is built until you approve it. Third, build. It produces the radxml, the CUSTOM hook package, the release JavaScript and the scripts, and checks every file against ODT’s rules. Fourth, deliver. You download everything, with a deployment guide and unit tests, ready to load in ODT. Your developers stay in control, from the first message to the last.",
  },
  {
    id: "results",
    title: "Real results",
    text:
      "This is not a concept. On a live FLEXCUBE fourteen point seven environment, TrustForge built a new customer risk profile screen that is now compiled, deployed and in use. On another job, it added a complete sixth charge to Oracle’s ARC maintenance: thirty-six new fields in the CUSTOM layer, with zero Oracle values changed. And every lesson from a real deployment becomes a new check, so each job is safer than the last.",
  },
  {
    id: "offer",
    title: "What it covers",
    text:
      "One agent covers the work your team does every week, on FLEXCUBE Universal Banking fourteen point six and fourteen point seven. New FLEXCUBE screens: maintenance, online, call forms and launch forms. Changes to Oracle’s own functions, safely in the CUSTOM layer. Hook packages and release JavaScript, for validations and processing. Radxml reviews, before you load anything. Silent ODT, for bulk generation and web services. And clear answers to any ODT question.",
  },
  {
    id: "safety",
    title: "Safe for banks",
    text:
      "It is built for how banks work. Oracle’s code is never edited: every change goes in your CUSTOM layer, so upgrades stay safe. Nothing is built without your approval. Passwords and keys are never written into files. Each job runs in its own private sandbox, and its files are deleted with it. Your bank’s data stays yours. And if everything must stay inside your network, TrustForge can run in your bank’s own cloud.",
  },
  {
    id: "savings",
    title: "Up to 90% less",
    text:
      "Now, compare. The usual way: tens to hundreds of thousands of dollars, weeks of work, and large partner teams. With TrustForge: hundreds of dollars, the first files in minutes, and your own developers reviewing and testing. For many changes, that is up to ninety percent lower development cost. Think of what your team could deliver with the budget you save: more changes, delivered faster, by the same people. Your team still tests every change. TrustForge does the heavy lifting.",
  },
  {
    id: "pricing",
    title: "Simple pricing",
    text:
      "Getting started is simple. Start free, with radxml reviews and ODT questions. When your team is ready, the Partner plan is one hundred dollars per seat, per month, with every job type and a usage allowance for each seat, plus extra usage whenever you need it. There are no long contracts: add or remove seats at any time. Or arrange a private install for your bank.",
  },
  {
    id: "cta",
    title: "Start today",
    text:
      "Your next FLEXCUBE change does not have to take weeks, or cost a fortune. Bring a requirement and your objects, and leave with files ready for ODT. Start your first job today, at forge dot trustroute technologies dot com. TrustForge, by TrustRoute Technologies. FLEXCUBE customizations, forged in conversation.",
  },
];

/**
 * The recorded voice-over. Leave `src` empty until the file is added to /public/media.
 * `chapterStarts`: second at which each chapter starts in the recording (found from the pauses between chapters).
 * With a recording but no starts, chapter lengths are estimated from word counts and scaled to the recording.
 */
export const VOICE: { src: string; chapterStarts: number[] | null; sentenceStarts?: number[][] } = {
  src: "/media/trustforge-pitch.mp3",
  // measured from the recording (5:38.6): each chapter starts 0.25 s before its first word
  chapterStarts: [0, 27.15, 66.85, 101.2, 149.2, 180.5, 219.1, 250.45, 286.15, 314.9],
  // second at which each subtitle sentence starts, snapped to the pauses in the recording
  sentenceStarts: [
    [0, 7.55, 11.7, 20.9],
    [27.15, 31.1, 35.55, 45.3, 51, 57.1, 61.55],
    [66.85, 69.3, 78.4, 82.55, 90.45, 93.65],
    [101.2, 104.65, 112.7, 113.85, 118.5, 123.25, 124.2, 134.65, 135.6, 141.1],
    [149.2, 151.4, 161.75, 172.9],
    [180.5, 191.3, 195.65, 200.7, 206.2, 209.75, 214.65],
    [219.1, 221.75, 228.8, 231.6, 235.3, 240.8, 243.35],
    [250.45, 251.35, 259.6, 267.15, 272.55, 280.2, 283.25],
    [286.15, 288.65, 293.45, 305.05, 309.65],
    [314.9, 322.75, 327.85, 334.05, 336.6],
  ],
};

/* ---------- timing ---------- */

const WORDS_PER_SECOND = 2.5; // a natural text-to-speech pace
const PAUSE = 1; // seconds of silence between chapters in the recording

export function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Subtitle sentences of a chapter, each with its share of the chapter (0 to 1) where it starts. */
export function sentencesOf(text: string): { at: number; text: string }[] {
  const parts = text.match(/[^.!?…]+[.!?…]+[’”"]?\s*|[^.!?…]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
  const total = words(text);
  let done = 0;
  return parts.map((p) => {
    const at = done / total;
    done += words(p);
    return { at, text: p };
  });
}

/** Estimated length of each chapter in seconds (speech plus the pause after it). */
export function estimatedSeconds(): number[] {
  return CHAPTERS.map((c) => words(c.text) / WORDS_PER_SECOND + PAUSE);
}
