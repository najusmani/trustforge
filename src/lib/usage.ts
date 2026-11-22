import "server-only";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobs, teams, usageEvents, usageTopups } from "@/db/schema";
import { anthropic } from "@/lib/agent";
import { PLAN_CONFIG, topupValueCents, type UsageLimits } from "@/lib/plans";

/**
 * Per-seat usage limits for Partner teams, modelled on Anthropic's own plans: each member has a daily, a weekly and a
 * monthly allowance of model cost (list price, US cents).
 *
 * How the limits are enforced exactly, with no overrun:
 *   - Every job is a Managed Agents session with a spend ceiling (budget). Before a member's message or approval
 *     starts a turn, the ceiling is set to "cost so far + what this member has left" (startTurn). The platform
 *     stops the model when the ceiling is reached (stop_reason budget_reached).
 *   - Cost is counted against the member who started the turn: whenever a job's session cost is read, the
 *     increase since the last reading is written to usage_event for job.actorId (recordCost).
 *   - Headroom already handed to the member's other running jobs is reserved, so two jobs at once can't
 *     spend the same allowance twice.
 */

type Team = typeof teams.$inferSelect;
type Job = typeof jobs.$inferSelect;

export type UsageWindow = {
  key: "day" | "week" | "month";
  label: string;
  usedCents: number;
  limitCents: number;
  resetsAt: string; // ISO
};

export type MemberUsage = {
  windows: UsageWindow[];
  /** Cents this member may still start spending now: their limits plus the team's extra usage, minus reservations. */
  remainingCents: number;
  /** A window that is used up (the one that resets last), whether or not extra usage covers it. */
  limitHit: UsageWindow | null;
  /** Set when the member can't continue: a window is used up and there is no extra usage left. */
  blocked: UsageWindow | null;
  /** The team's extra usage left, shown as dollars paid (US cents); 0 when none. */
  extraValueCents: number;
};

/** A turn needs at least this much headroom to be worth starting. */
const MIN_TURN_CENTS = 10;

export function limitsFor(team: Team): UsageLimits | null {
  const base = PLAN_CONFIG[team.plan].limits;
  if (!base) return null;
  return {
    dailyCents: team.limitDailyCents ?? base.dailyCents,
    weeklyCents: team.limitWeeklyCents ?? base.weeklyCents,
    monthlyCents: team.limitMonthlyCents ?? base.monthlyCents,
  };
}

/* ---------- Windows (UTC) ---------- */

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  const day = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(day, last));
  return x;
}

/** Day: midnight UTC. Week: Monday 00:00 UTC. Month: the team's Paddle billing period, else the calendar month. */
export function windowsFor(team: Team, now = new Date()) {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const weekStart = new Date(dayStart.getTime() - ((dayStart.getUTCDay() + 6) % 7) * 86_400_000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  let monthStart: Date;
  let monthEnd: Date;
  if (team.currentPeriodEnd) {
    monthEnd = new Date(team.currentPeriodEnd);
    for (let i = 0; monthEnd <= now && i < 24; i++) monthEnd = addMonths(monthEnd, 1); // a missed renewal webhook
    monthStart = addMonths(monthEnd, -1);
    if (monthStart > now) {
      monthEnd = monthStart;
      monthStart = addMonths(monthEnd, -1);
    }
  } else {
    monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }
  return { dayStart, dayEnd, weekStart, weekEnd, monthStart, monthEnd };
}

/* ---------- Counting cost ---------- */

/**
 * Writes any increase in the session's cost to usage_event for the member who started the current turn.
 * Safe to call from several places at once: the job row is updated only if nobody counted it first.
 */
export async function recordCost(job: Job, costCents: number, status: string): Promise<void> {
  const busy = status === "running" || status === "rescheduling";
  // Jobs from before usage limits (no ceiling ever set): take their cost so far as the starting point, uncharged.
  if (job.budgetCents === null && !job.costOpen) {
    if (costCents !== job.billedCents) await db.update(jobs).set({ billedCents: costCents }).where(eq(jobs.id, job.id));
    return;
  }
  const delta = costCents - job.billedCents;
  if (delta > 0) {
    const won = await db
      .update(jobs)
      .set({ billedCents: costCents, costOpen: busy ? 1 : 0 })
      .where(and(eq(jobs.id, job.id), eq(jobs.billedCents, job.billedCents)))
      .returning({ id: jobs.id });
    if (won.length) {
      const userId = job.actorId ?? job.createdBy;
      // Whatever goes beyond the member's limits is paid from the team's extra usage.
      let topupCents = 0;
      if (job.plan === "partner" && userId) {
        const [team] = await db.select().from(teams).where(eq(teams.id, job.teamId));
        const limits = team ? limitsFor(team) : null;
        if (team && limits) topupCents = Math.max(0, delta - Math.max(0, await windowLeft(team, userId, limits)));
      }
      await db.insert(usageEvents).values({ teamId: job.teamId, userId, jobId: job.id, costCents: delta, topupCents });
    }
  } else if (!busy && job.costOpen) {
    await db.update(jobs).set({ costOpen: 0 }).where(eq(jobs.id, job.id));
  }
}

async function readSession(sessionId: string) {
  const s = await anthropic().beta.sessions.retrieve(sessionId);
  return { costCents: Number(s.usage?.list_cost?.amount ?? 0) || 0, status: String(s.status) };
}

/** Reads the session and counts its new cost. Returns the cost so far. */
export async function syncJob(job: Job): Promise<number> {
  if (!job.sessionId) return job.billedCents;
  const s = await readSession(job.sessionId);
  await recordCost(job, s.costCents, s.status);
  return s.costCents;
}

/** Counts the cost of every job this member may still be spending on. */
async function syncOpenJobs(teamId: string, userId: string): Promise<void> {
  const open = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.teamId, teamId), eq(jobs.actorId, userId), eq(jobs.costOpen, 1)));
  await Promise.allSettled(open.map((j) => syncJob(j)));
}

async function usedSince(teamId: string, userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int` })
    .from(usageEvents)
    .where(and(eq(usageEvents.teamId, teamId), eq(usageEvents.userId, userId), gte(usageEvents.createdAt, since)));
  return Number(row?.n ?? 0);
}

/** The least a member has left across their daily, weekly and monthly windows (may be negative). */
async function windowLeft(team: Team, userId: string, limits: UsageLimits): Promise<number> {
  const w = windowsFor(team);
  const [day, week, month] = await Promise.all([
    usedSince(team.id, userId, w.dayStart),
    usedSince(team.id, userId, w.weekStart),
    usedSince(team.id, userId, w.monthStart),
  ]);
  return Math.min(limits.dailyCents - day, limits.weeklyCents - week, limits.monthlyCents - month);
}

/** The team's extra usage left, in model-cost cents: credits bought minus what limits-exceeding turns used. */
export async function topupBalance(teamId: string): Promise<number> {
  const [[c], [u]] = await Promise.all([
    db.select({ n: sql<number>`coalesce(sum(${usageTopups.creditCents}), 0)::int` }).from(usageTopups).where(eq(usageTopups.teamId, teamId)),
    db.select({ n: sql<number>`coalesce(sum(${usageEvents.topupCents}), 0)::int` }).from(usageEvents).where(eq(usageEvents.teamId, teamId)),
  ]);
  return Number(c?.n ?? 0) - Number(u?.n ?? 0);
}

/** Headroom handed to all the team's running jobs (except one): it may still be spent, so extra usage holds it back. */
async function teamReservedCents(teamId: string, exceptJobId?: string): Promise<number> {
  const conds = [eq(jobs.teamId, teamId), eq(jobs.costOpen, 1)];
  if (exceptJobId) conds.push(ne(jobs.id, exceptJobId));
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(greatest(coalesce(${jobs.budgetCents}, 0) - ${jobs.billedCents}, 0)), 0)::int` })
    .from(jobs)
    .where(and(...conds));
  return Number(row?.n ?? 0);
}

/** Headroom handed to the member's running jobs (except one), which they may still spend. */
async function reservedCents(teamId: string, userId: string, exceptJobId?: string): Promise<number> {
  const conds = [eq(jobs.teamId, teamId), eq(jobs.actorId, userId), eq(jobs.costOpen, 1)];
  if (exceptJobId) conds.push(ne(jobs.id, exceptJobId));
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(greatest(coalesce(${jobs.budgetCents}, 0) - ${jobs.billedCents}, 0)), 0)::int` })
    .from(jobs)
    .where(and(...conds));
  return Number(row?.n ?? 0);
}

/** The member's usage against their limits; null when the team's plan has none (Free). */
export async function memberUsage(
  team: Team,
  userId: string,
  opts: { sync?: boolean; exceptJobId?: string } = {},
): Promise<MemberUsage | null> {
  const limits = limitsFor(team);
  if (!limits) return null;
  if (opts.sync !== false) await syncOpenJobs(team.id, userId);
  const w = windowsFor(team);
  const [day, week, month, reserved, balance, teamReserved] = await Promise.all([
    usedSince(team.id, userId, w.dayStart),
    usedSince(team.id, userId, w.weekStart),
    usedSince(team.id, userId, w.monthStart),
    reservedCents(team.id, userId, opts.exceptJobId),
    topupBalance(team.id),
    teamReservedCents(team.id, opts.exceptJobId),
  ]);
  const windows: UsageWindow[] = [
    { key: "day", label: "Today", usedCents: day, limitCents: limits.dailyCents, resetsAt: w.dayEnd.toISOString() },
    { key: "week", label: "This week", usedCents: week, limitCents: limits.weeklyCents, resetsAt: w.weekEnd.toISOString() },
    { key: "month", label: "This month", usedCents: month, limitCents: limits.monthlyCents, resetsAt: w.monthEnd.toISOString() },
  ];
  const fromLimits = Math.max(0, Math.min(...windows.map((x) => x.limitCents - x.usedCents)) - reserved);
  const fromExtra = Math.max(0, balance - teamReserved);
  const remainingCents = fromLimits + fromExtra;
  const full = windows.filter((x) => x.usedCents >= x.limitCents);
  const limitHit = full.length ? full.reduce((a, b) => (a.resetsAt > b.resetsAt ? a : b)) : null;
  return {
    windows,
    remainingCents,
    limitHit,
    blocked: limitHit && remainingCents < MIN_TURN_CENTS ? limitHit : null,
    extraValueCents: topupValueCents(balance),
  };
}

/* ---------- Starting a turn ---------- */

export class UsageLimitReached extends Error {
  constructor(public window: UsageWindow | null) {
    super("usage limit reached");
  }
}

const resetFmt = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/** Message for a member who has run out. */
export function limitReachedMessage(window: UsageWindow | null): string {
  if (!window) {
    return "Your other running jobs are using the rest of your allowance. Wait for them to finish, then try again.";
  }
  const what = window.key === "day" ? "today’s" : window.key === "week" ? "this week’s" : "this month’s";
  return `You’ve reached ${what} usage limit. It resets ${resetFmt.format(new Date(window.resetsAt))}, or your team owner can add extra usage in Billing.`;
}

/** Headroom for a brand-new job (Partner). Throws UsageLimitReached when there is none. */
export async function headroomForNewJob(team: Team, userId: string): Promise<number | null> {
  const usage = await memberUsage(team, userId);
  if (!usage) return null;
  if (usage.remainingCents < MIN_TURN_CENTS) throw new UsageLimitReached(usage.blocked ?? usage.limitHit);
  return usage.remainingCents;
}

/**
 * Before a member's message or approval on a Partner job: counts the cost so far, then sets the session's ceiling
 * to "cost so far + this member's remaining allowance" and makes them the job's current actor.
 * Throws UsageLimitReached when the member has nothing left. Free jobs keep their fixed ceiling.
 */
export async function startTurn(team: Team, userId: string, job: Job): Promise<void> {
  if (job.plan !== "partner" || !job.sessionId) return;
  const usage = await memberUsage(team, userId, { exceptJobId: job.id });
  if (!usage) return; // team moved to a plan without limits: the job keeps its current ceiling
  const sessionId = job.sessionId;
  for (let attempt = 0; attempt < 2; attempt++) {
    const [fresh] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    const cost = await syncJob(fresh);
    // The previous actor's share was just counted; recompute this member's remaining with nothing reserved here.
    const now = attempt === 0 ? usage : await memberUsage(team, userId, { exceptJobId: job.id, sync: false });
    const remaining = now?.remainingCents ?? 0;
    if (remaining < MIN_TURN_CENTS) throw new UsageLimitReached(now?.blocked ?? now?.limitHit ?? null);
    const ceiling = cost + remaining;
    try {
      await anthropic().beta.sessions.update(sessionId, {
        budget: { type: "limit", max_list_cost: { amount: String(ceiling), currency: "USD" } },
      });
      await db.update(jobs).set({ actorId: userId, budgetCents: ceiling, costOpen: 1 }).where(eq(jobs.id, job.id));
      return;
    } catch (err) {
      // The session spent past the new ceiling between reading and setting it: read again once.
      if (attempt === 1) throw err;
    }
  }
}
