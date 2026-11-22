"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { type Plan, teams, usageTopups } from "@/db/schema";
import { TOPUP } from "@/lib/plans";
import { requireAdmin } from "@/lib/admin";
import { runAgentSetup } from "@/lib/agent";

function back(kind: "error" | "notice", message: string): never {
  redirect(`/admin?${kind}=${encodeURIComponent(message)}`);
}

export async function setupAgentsAction() {
  await requireAdmin();
  let log: string[];
  try {
    log = await runAgentSetup();
  } catch (err) {
    console.error("[admin] agent setup failed", err);
    back("error", `Setup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  back("notice", log.join(" "));
}

export async function setTeamPlan(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") ?? "");
  const plan = String(formData.get("plan") ?? "") as Plan;
  if (plan !== "free" && plan !== "partner") back("error", "Invalid plan.");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) back("error", "Team not found.");
  if (team.paddleSubscriptionId && team.subscriptionStatus !== "canceled") {
    back("error", "This team pays through Paddle. Change or cancel its subscription in Paddle instead.");
  }
  const values: { plan: Plan; seats?: number } = { plan };
  if (plan === "free") values.seats = 1;
  await db.update(teams).set(values).where(eq(teams.id, teamId));
  back("notice", `Team set to ${plan === "free" ? "Free (1 seat)" : "Partner (contract)"}.`);
}

/** Seats for contract teams (Partner set here, billed outside Paddle). */
export async function setTeamSeats(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") ?? "");
  const seats = Math.floor(Number(formData.get("seats")));
  if (!Number.isFinite(seats) || seats < 1 || seats > 500) back("error", "Seats must be 1 to 500.");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) back("error", "Team not found.");
  if (team.plan !== "partner" || team.paddleSubscriptionId) back("error", "Only contract Partner teams have seats set here.");
  await db.update(teams).set({ seats }).where(eq(teams.id, teamId));
  back("notice", `${team.name}: ${seats} seat(s).`);
}

/** Per-seat usage limits for one team, in US dollars; a blank field returns to the plan default. */
export async function setTeamLimits(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") ?? "");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) back("error", "Team not found.");
  const cents = (name: string): number | null => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const n = Math.round(Number(raw) * 100);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) back("error", "Limits must be dollar amounts from 0 to 10,000.");
    return n;
  };
  const values = {
    limitDailyCents: cents("daily"),
    limitWeeklyCents: cents("weekly"),
    limitMonthlyCents: cents("monthly"),
  };
  await db.update(teams).set(values).where(eq(teams.id, teamId));
  back("notice", `${team.name}: usage limits saved.`);
}

/** Free extra usage for a team (goodwill, contract terms). Amount in dollars as customers see it. */
export async function grantExtraUsage(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") ?? "");
  const dollars = Number(String(formData.get("amount") ?? "").trim());
  if (!Number.isFinite(dollars) || dollars <= 0 || dollars > 10_000) back("error", "Enter an amount from 0.01 to 10,000.");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) back("error", "Team not found.");
  const value = Math.round(dollars * 100);
  await db.insert(usageTopups).values({
    teamId,
    transactionId: `admin:${crypto.randomUUID()}`,
    paidCents: 0,
    creditCents: Math.floor(value * TOPUP.usageRatio),
  });
  back("notice", `${team.name}: $${(value / 100).toFixed(2)} of extra usage added.`);
}
