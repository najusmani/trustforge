import { promises as fs } from "node:fs";
import path from "node:path";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";

const LESSONS_FILE = path.join(process.cwd(), "agent", "skill", "trustforge", "reference", "29-lessons-learned.md");

/** Number of lessons TrustForge knows (rows "| L<n> |" in the lessons table). */
export async function countLessons(): Promise<number> {
  try {
    const text = await fs.readFile(LESSONS_FILE, "utf8");
    return new Set(text.match(/^\|\s*L\d+\s*\|/gm)?.map((r) => r.replace(/\W/g, "")) ?? []).size;
  } catch {
    return 0;
  }
}

function things(n: number) {
  return n === 1 ? "1 new thing" : `${n} new things`;
}

function lessons(n: number) {
  return n === 1 ? "1 new lesson" : `${n} new lessons`;
}

const MESSAGES: ((n: number) => string)[] = [
  (n) => `Back at the forge. ${lessons(n)} hammered in since your last job. The sparks are classified.`,
  (n) =>
    `Good to see you. I'm ${n === 1 ? "1 mistake" : `${n} mistakes`} wiser than last time. Not my mistakes, of course.`,
  (n) =>
    `Hello! I've been studying. ${lessons(n)} since your last job. The details are between me and the debug log.`,
];

const FIRST_JOB = [
  (n: number) => `Welcome to the forge. ${n === 1 ? "1 lesson" : `${n} lessons`} hammered in so far. The sparks are classified.`,
  (n: number) => `Good to meet you. I'm already ${n === 1 ? "1 mistake" : `${n} mistakes`} wise. Not my mistakes, of course.`,
  (n: number) => `Hello! I've been studying: ${things(n)} learned so far. The details are between me and the debug log.`,
];

const NOTHING_NEW = "Nothing new since your last visit. Even geniuses need a day off.";

/**
 * Welcome shown as TrustForge's first chat message of a new job, and the lesson count to store on the job.
 * New lessons are counted since this member's previous job; a first job counts everything learned so far.
 */
export async function welcomeForNewJob(userId: string): Promise<{ lessonCount: number; welcome: string }> {
  const lessonCount = await countLessons();
  const [prev] = await db
    .select({ lessonCount: jobs.lessonCount })
    .from(jobs)
    .where(and(eq(jobs.createdBy, userId), isNotNull(jobs.lessonCount)))
    .orderBy(desc(jobs.createdAt))
    .limit(1);
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  if (!prev) return { lessonCount, welcome: lessonCount > 0 ? pick(FIRST_JOB)(lessonCount) : NOTHING_NEW };
  const n = Math.max(0, lessonCount - (prev.lessonCount ?? 0));
  return { lessonCount, welcome: n === 0 ? NOTHING_NEW : pick(MESSAGES)(n) };
}
