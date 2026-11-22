import type { Metadata } from "next";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers, teams, usageEvents, users } from "@/db/schema";
import { Flash } from "@/components/Flash";
import { Brand } from "@/components/SiteChrome";
import { requireAdmin } from "@/lib/admin";
import { getAgentSetup } from "@/lib/agent";
import { PLAN_CONFIG } from "@/lib/plans";
import { limitsFor, topupBalance, windowsFor } from "@/lib/usage";
import { topupValueCents } from "@/lib/plans";
import { grantExtraUsage, setTeamLimits, setTeamPlan, setTeamSeats, setupAgentsAction } from "./actions";

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

  // Usage this billing month for every Partner team, per member (dollars: admin only).
  const partnerTeams = await db.select().from(teams).where(eq(teams.plan, "partner")).orderBy(teams.name);
  const usageByTeam = await Promise.all(
    partnerTeams.map(async (t) => {
      const w = windowsFor(t);
      const since = (d: Date) =>
        sql<number>`coalesce((select sum(${usageEvents.costCents}) from ${usageEvents} where ${usageEvents.teamId} = ${t.id} and ${usageEvents.userId} = ${teamMembers.userId} and ${usageEvents.createdAt} >= ${d}), 0)::int`;
      const members = await db
        .select({ userId: teamMembers.userId, email: users.email, day: since(w.dayStart), week: since(w.weekStart), month: since(w.monthStart) })
        .from(teamMembers)
        .innerJoin(users, eq(users.id, teamMembers.userId))
        .where(eq(teamMembers.teamId, t.id));
      const [total] = await db
        .select({ n: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int` })
        .from(usageEvents)
        .where(and(eq(usageEvents.teamId, t.id), gte(usageEvents.createdAt, w.monthStart)));
      const balance = await topupBalance(t.id);
      return { team: t, limits: limitsFor(t)!, members, totalCents: Number(total?.n ?? 0), monthEnd: w.monthEnd, balance };
    }),
  );
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
  const pct = (c: number, l: number) => `${Math.min(999, Math.round((c / Math.max(1, l)) * 100))}%`;
  const defaults = PLAN_CONFIG.partner.limits!;

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
            a fast Anthropic model, Partner uses Anthropic’s most capable model at medium effort (see src/lib/agent.ts). Run it once;
            after that, each deploy updates the skill and agents automatically on the next job.
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

        <section className="card panel" aria-labelledby="usage-h">
          <h2 id="usage-h" className="panel-h">Usage</h2>
          <p className="lead" style={{ fontSize: 15 }}>
            Model cost at list price this billing month, per member. Members see only percentages. Defaults per seat:{" "}
            {usd(defaults.dailyCents)} a day, {usd(defaults.weeklyCents)} a week, {usd(defaults.monthlyCents)} a month.
            Leave a field blank to use the default.
          </p>
          {usageByTeam.length === 0 && <p style={{ margin: 0, color: "var(--text-3)" }}>No Partner teams yet.</p>}
          {usageByTeam.map(({ team: t, limits, members, totalCents, monthEnd, balance }) => (
            <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid var(--hair)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <strong style={{ fontWeight: 500, color: "var(--navy)" }}>{t.name}</strong>
                <span style={{ fontSize: 14, color: "var(--text-3)" }}>
                  {usd(totalCents)} of {usd(limits.monthlyCents * t.seats)} ({t.seats} seat{t.seats === 1 ? "" : "s"}) · month ends{" "}
                  {dateFmt.format(monthEnd)}
                </span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Member</th>
                      <th scope="col">Today</th>
                      <th scope="col">This week</th>
                      <th scope="col">This month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.userId}>
                        <td>{m.email}</td>
                        <td>{usd(m.day)} · {pct(m.day, limits.dailyCents)}</td>
                        <td>{usd(m.week)} · {pct(m.week, limits.weeklyCents)}</td>
                        <td>{usd(m.month)} · {pct(m.month, limits.monthlyCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form action={setTeamLimits} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                <input type="hidden" name="teamId" value={t.id} />
                {(
                  [
                    ["daily", "Daily", t.limitDailyCents, limits.dailyCents],
                    ["weekly", "Weekly", t.limitWeeklyCents, limits.weeklyCents],
                    ["monthly", "Monthly", t.limitMonthlyCents, limits.monthlyCents],
                  ] as const
                ).map(([name, label, value, effective]) => (
                  <div key={name} className="field" style={{ gap: 4 }}>
                    <label htmlFor={`${name}-${t.id}`}>{label} $ per seat</label>
                    <input
                      className="input"
                      id={`${name}-${t.id}`}
                      name={name}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={value === null ? "" : (value / 100).toFixed(2)}
                      placeholder={(effective / 100).toFixed(2)}
                      style={{ width: 130, minHeight: 36 }}
                    />
                  </div>
                ))}
                <button type="submit" className="link-btn">Save limits</button>
              </form>
              <form action={grantExtraUsage} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                <input type="hidden" name="teamId" value={t.id} />
                <span style={{ fontSize: 14, color: "var(--text-2)", alignSelf: "center" }}>
                  Extra usage left: {usd(topupValueCents(balance))} (model cost {usd(Math.max(0, balance))})
                </span>
                <div className="field" style={{ gap: 4 }}>
                  <label htmlFor={`grant-${t.id}`}>Grant extra usage $</label>
                  <input className="input" id={`grant-${t.id}`} name="amount" type="number" min={0.01} step="0.01" style={{ width: 130, minHeight: 36 }} />
                </div>
                <button type="submit" className="link-btn">Grant</button>
              </form>
            </div>
          ))}
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
