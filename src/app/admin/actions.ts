"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { type Plan, teams } from "@/db/schema";
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
  const values: { plan: Plan; seats?: number } = { plan };
  if (plan === "free") values.seats = 1;
  await db.update(teams).set(values).where(eq(teams.id, teamId));
  back("notice", `Team set to ${plan === "free" ? "Free (1 seat)" : "Partner"}.`);
}
