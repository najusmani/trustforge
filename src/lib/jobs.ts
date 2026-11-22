import "server-only";
import { toFile } from "@anthropic-ai/sdk";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobFiles, jobMessages, jobs, type Plan, type Role, teams } from "@/db/schema";
import { anthropic } from "@/lib/agent";
import { getMembership } from "@/lib/teams";
import { PLAN_CONFIG, UPLOAD_LIMITS } from "@/lib/plans";
import type { MemberUsage } from "@/lib/usage";

export const MANAGED_AGENTS_BETA = "managed-agents-2026-04-01" as const;

function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Questions the team has sent this calendar month (UTC). */
export async function questionsUsedThisMonth(teamId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(jobMessages)
    .where(and(eq(jobMessages.teamId, teamId), gte(jobMessages.createdAt, monthStart())));
  return Number(row?.n ?? 0);
}

/** null when the plan has no limit. */
export async function questionsLeft(teamId: string, plan: Plan): Promise<number | null> {
  const limit = PLAN_CONFIG[plan].questionsPerMonth;
  if (limit === null) return null;
  return Math.max(0, limit - (await questionsUsedThisMonth(teamId)));
}

export async function recordQuestion(teamId: string, jobId: string, userId: string) {
  await db.insert(jobMessages).values({ teamId, jobId, userId });
}

export async function listTeamJobs(teamId: string) {
  return db.select().from(jobs).where(eq(jobs.teamId, teamId)).orderBy(desc(jobs.updatedAt)).limit(100);
}

/** The job, if the user is on its team; otherwise null. */
export async function getJobForUser(jobId: string, userId: string) {
  const membership = await getMembership(userId);
  if (!membership) return null;
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.teamId, membership.team.id)));
  if (!job) return null;
  return { job, team: membership.team, role: membership.role as Role };
}

export async function listJobUploads(jobId: string) {
  return db.select().from(jobFiles).where(eq(jobFiles.jobId, jobId)).orderBy(jobFiles.createdAt);
}

export async function touchJob(jobId: string) {
  await db.update(jobs).set({ updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

/* ---------- Uploads ---------- */

export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\s+/g, "_").slice(0, 120);
  return cleaned && !/^\.+$/.test(cleaned) ? cleaned : "file";
}

export type UploadCheck = { files: File[]; error?: string };

export function checkUploads(entries: FormDataEntryValue[]): UploadCheck {
  const files = entries.filter((e): e is File => typeof e !== "string" && e.size > 0);
  if (files.length > UPLOAD_LIMITS.maxFiles) return { files, error: `Upload at most ${UPLOAD_LIMITS.maxFiles} files at a time.` };
  const total = files.reduce((s, f) => s + f.size, 0);
  const tooBig = files.find((f) => f.size > UPLOAD_LIMITS.maxFileBytes);
  if (tooBig) return { files, error: `${tooBig.name} is larger than ${UPLOAD_LIMITS.maxFileBytes / 1024 / 1024} MB.` };
  if (total > UPLOAD_LIMITS.maxTotalBytes) {
    return { files, error: `Files total more than ${UPLOAD_LIMITS.maxTotalBytes / 1024 / 1024} MB. Send them in smaller groups.` };
  }
  return { files };
}

/** Uploads to the Anthropic Files API. Returns the names used in the sandbox. Names are made unique per job. */
export async function uploadFiles(files: File[], taken: Set<string>) {
  const c = anthropic();
  const out: { name: string; size: number; fileId: string }[] = [];
  for (const f of files) {
    let name = safeFileName(f.name);
    if (taken.has(name)) {
      const dot = name.lastIndexOf(".");
      const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
      let i = 2;
      while (taken.has(`${stem}_${i}${ext}`)) i++;
      name = `${stem}_${i}${ext}`;
    }
    taken.add(name);
    const meta = await c.files.upload({ file: await toFile(Buffer.from(await f.arrayBuffer()), name) });
    out.push({ name, size: f.size, fileId: meta.id });
  }
  return out;
}

export async function deleteAnthropicFiles(fileIds: string[]) {
  const c = anthropic();
  await Promise.allSettled(fileIds.map((id) => c.files.delete(id)));
}

/* ---------- Conversation view ---------- */

export type ViewItem =
  | { kind: "user"; id: string; text: string; at: string }
  | { kind: "agent"; id: string; text: string; at: string }
  /** Consecutive tool steps, merged. Commands and paths are not sent to the browser. */
  | { kind: "thinking"; id: string; steps: number; at: string }
  | { kind: "error"; id: string; text: string; at: string };

export type JobView = {
  status: "running" | "idle" | "rescheduling" | "terminated" | "unknown";
  stopReason: string | null;
  items: ViewItem[];
  pending: { eventId: string; name: string; detail: string }[];
  outputs: { id: string; filename: string; size: number }[];
  costCents: number | null;
  /** The viewing member's usage against their limits (Partner); filled in by the state route. */
  usage?: MemberUsage | null;
};

function toolDetail(name: string, input: Record<string, unknown>): string {
  const pick = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : "");
  const s =
    name === "bash"
      ? pick("command")
      : pick("file_path") || pick("path") || pick("pattern") || JSON.stringify(input);
  return s.length > 160 ? `${s.slice(0, 157)}…` : s;
}

/** Turns the session's events into a readable conversation. */
export async function getJobView(sessionId: string, withOutputs: boolean): Promise<JobView> {
  const c = anthropic();
  const session = await c.beta.sessions.retrieve(sessionId);

  const items: ViewItem[] = [];
  const asked = new Map<string, { name: string; detail: string }>();
  const settled = new Set<string>();
  let stopReason: string | null = null;

  for await (const e of c.beta.sessions.events.list(sessionId)) {
    switch (e.type) {
      case "user.message": {
        const text = e.content.map((b) => (b.type === "text" ? b.text : "")).join("");
        items.push({ kind: "user", id: e.id, text, at: e.processed_at ?? "" });
        break;
      }
      case "agent.message": {
        const text = e.content.map((b) => (b.type === "text" ? b.text : "")).join("");
        if (text.trim()) items.push({ kind: "agent", id: e.id, text, at: e.processed_at });
        break;
      }
      case "agent.tool_use": {
        const last = items[items.length - 1];
        if (last?.kind === "thinking") last.steps += 1;
        else items.push({ kind: "thinking", id: e.id, steps: 1, at: e.processed_at });
        // Approvals still show what will run: the user needs that to decide.
        if (e.evaluated_permission === "ask") asked.set(e.id, { name: e.name, detail: toolDetail(e.name, e.input as Record<string, unknown>) });
        break;
      }
      case "user.tool_confirmation":
        settled.add(e.tool_use_id);
        break;
      case "session.error":
        items.push({ kind: "error", id: e.id, text: "TrustForge hit an error. You can send a message to continue.", at: e.processed_at });
        break;
      case "session.status_idle":
        stopReason = e.stop_reason?.type ?? null;
        break;
      case "session.status_running":
        stopReason = null;
        break;
    }
  }

  const pending = [...asked.entries()]
    .filter(([id]) => !settled.has(id))
    .map(([eventId, v]) => ({ eventId, ...v }));

  let outputs: JobView["outputs"] = [];
  if (withOutputs) {
    for await (const f of c.beta.files.list({ scope_id: sessionId, betas: [MANAGED_AGENTS_BETA] })) {
      outputs.push({ id: f.id, filename: f.filename, size: f.size_bytes });
    }
    outputs = outputs.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  const amount = session.usage?.list_cost?.amount;
  return {
    status: (["running", "idle", "rescheduling", "terminated"] as const).includes(session.status as never)
      ? (session.status as JobView["status"])
      : "unknown",
    stopReason,
    items,
    pending,
    outputs,
    costCents: amount ? Number(amount) : null,
  };
}

/** Team id of the job's team, for usage counting. */
export async function teamPlan(teamId: string): Promise<Plan> {
  const [t] = await db.select({ plan: teams.plan }).from(teams).where(eq(teams.id, teamId));
  return t?.plan ?? "free";
}
