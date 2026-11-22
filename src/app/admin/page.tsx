import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { Flash } from "@/components/Flash";
import { Brand } from "@/components/SiteChrome";
import { requireAdmin } from "@/lib/admin";
import { getAgentSetup } from "@/lib/agent";
import { PLAN_CONFIG } from "@/lib/plans";
import { setTeamPlan, setTeamSeats, setupAgentsAction } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  await requireAdmin();
  const setup = await getAgentSetup();
  const keySet = Boolean(process.env.ANTHROPIC_API_KEY);

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      plan: teams.plan,
      seats: teams.seats,
      subscriptionId: teams.paddleSubscriptionId,
      subscriptionStatus: teams.subscriptionStatus,
      createdAt: teams.createdAt,
      members: sql<number>`count(${teamMembers.userId})::int`,
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .groupBy(teams.id)
    .orderBy(desc(teams.createdAt));

  return (
    <div className="app-shell">
    <header className="app-header">
      <div className="app-header-inner">
        <Brand sub={false} />
        <span className="app-team">Admin</span>
        <nav aria-label="Admin" className="app-nav" style={{ marginLeft: "auto" }}>
          <a className="nav-link" href="/app">Workspace</a>
        </nav>
      </div>
    </header>
    <main className="app-main">
      <div className="app-wide">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="app-h1">TrustForge settings</h1>
        </div>
        <Flash error={error} notice={notice} />

        <section className="card panel" aria-labelledby="agents-h">
          <h2 id="agents-h" className="panel-h">Agents</h2>
          <p className="lead" style={{ fontSize: 15 }}>
            Uploads the TrustForge skill and creates (or updates) the sandbox and the two agents: Free uses{" "}
            {PLAN_CONFIG.free.modelLabel}, Partner uses {PLAN_CONFIG.partner.modelLabel} at medium effort. Run it once,
            and again after the skill or the agent instructions change.
          </p>
          <dl className="kv">
            <dt>API key</dt><dd>{keySet ? "Set" : "Missing: add ANTHROPIC_API_KEY"}</dd>
            <dt>Skill</dt><dd className="mono">{setup.skillId ?? "Not created"}</dd>
            <dt>Sandbox</dt><dd className="mono">{setup.environmentId ?? "Not created"}</dd>
            <dt>Free agent</dt><dd className="mono">{setup.agentFreeId ?? "Not created"}</dd>
            <dt>Partner agent</dt><dd className="mono">{setup.agentPartnerId ?? "Not created"}</dd>
            <dt>Last setup</dt><dd>{setup.setupAt ? dateFmt.format(new Date(setup.setupAt)) : "Never"}</dd>
          </dl>
          <form action={setupAgentsAction}>
            <button type="submit" className="btn btn-solid btn-sm" disabled={!keySet}>
              {setup.agentPartnerId ? "Update agents and skill" : "Set up agents"}
            </button>
          </form>
        </section>

        <section className="card panel" aria-labelledby="teams-h">
          <h2 id="teams-h" className="panel-h">Teams</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">Members</th>
                  <th scope="col">Seats</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Billing</th>
                  <th scope="col"><span className="sr-only">Change</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const paddleManaged = Boolean(t.subscriptionId) && t.subscriptionStatus !== "canceled";
                  const contract = t.plan === "partner" && !t.subscriptionId;
                  return (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.members}</td>
                      <td>
                        {contract ? (
                          <form action={setTeamSeats} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input type="hidden" name="teamId" value={t.id} />
                            <label className="sr-only" htmlFor={`seats-${t.id}`}>Seats for {t.name}</label>
                            <input className="input" id={`seats-${t.id}`} name="seats" type="number" min={1} max={500} defaultValue={t.seats} style={{ width: 80, minHeight: 36 }} />
                            <button type="submit" className="link-btn">Save</button>
                          </form>
                        ) : (
                          t.seats
                        )}
                      </td>
                      <td>{PLAN_CONFIG[t.plan].label}</td>
                      <td>{paddleManaged ? `Paddle: ${t.subscriptionStatus}` : contract ? "Contract" : t.subscriptionStatus === "canceled" ? "Paddle: cancelled" : "-"}</td>
                      <td style={{ textAlign: "right" }}>
                        {!paddleManaged && (
                          <form action={setTeamPlan}>
                            <input type="hidden" name="teamId" value={t.id} />
                            <input type="hidden" name="plan" value={t.plan === "free" ? "partner" : "free"} />
                            <button type="submit" className="link-btn">
                              {t.plan === "free" ? "Make Partner (contract)" : "Make Free"}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
    </div>
  );
}
