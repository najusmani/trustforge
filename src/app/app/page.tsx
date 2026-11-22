import Link from "next/link";
import { Flash } from "@/components/Flash";
import { Arrow } from "@/components/Logo";
import { listTeamJobs, questionsLeft } from "@/lib/jobs";
import { JOB_TYPE_LABEL, PLAN_CONFIG } from "@/lib/plans";
import { getMembership, requireUser, ROLE_LABEL, seatsUsed } from "@/lib/teams";
import { UsageMeter } from "@/components/UsageMeter";
import { limitReachedMessage, memberUsage } from "@/lib/usage";
import { createTeam } from "./actions";

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function WorkspaceHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const user = await requireUser("/app");
  const membership = await getMembership(user.id);

  if (!membership) {
    return (
      <div className="app-narrow">
        <span className="eyebrow enter d1">Welcome</span>
        <h1 className="app-h1 enter d2">
          Name your <em className="ember">team</em>.
        </h1>
        <p className="lead enter d3">
          Jobs, files and history belong to a team. Start yours now; you can invite colleagues next.
        </p>
        <Flash error={error} notice={notice} />
        <form action={createTeam} className="card form enter d4">
          <div className="field">
            <label htmlFor="name">Team name</label>
            <input className="input" id="name" name="name" required minLength={2} maxLength={80} placeholder="For example: Core Banking Development" />
          </div>
          <button className="btn btn-primary" type="submit">
            Create team <Arrow />
          </button>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
            Invited by a colleague? Open the link in their invite email instead.
          </p>
        </form>
      </div>
    );
  }

  const { team, role } = membership;
  const cfg = PLAN_CONFIG[team.plan];
  const [jobList, left, used, usage] = await Promise.all([
    listTeamJobs(team.id),
    questionsLeft(team.id, team.plan),
    seatsUsed(team.id),
    memberUsage(team, user.id).catch(() => null),
  ]);
  const monthPct = usage ? Math.min(100, Math.round((usage.windows[2].usedCents / Math.max(1, usage.windows[2].limitCents)) * 100)) : 0;

  return (
    <div className="app-wide">
      <Flash error={error} notice={notice} />
      <div className="enter d1" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow">{team.name}</span>
          <h1 className="app-h1">
            Your <em className="ember">jobs</em>
          </h1>
        </div>
        <Link className="btn btn-primary" href="/app/jobs/new">
          New job <Arrow />
        </Link>
      </div>

      <section className="stat-row enter d2" aria-label="Plan summary">
        <div className="card stat">
          <span className="stat-label">Plan</span>
          <span className="stat-value">{cfg.label}</span>
        </div>
        {usage ? (
          <div className="card stat">
            <span className="stat-label">Your usage this month</span>
            <span className="stat-value">
              {monthPct}% <small>of your limit</small>
            </span>
          </div>
        ) : (
          <div className="card stat">
            <span className="stat-label">Questions this month</span>
            <span className="stat-value">
              {left === null ? "Unlimited" : <>{left} <small>of {cfg.questionsPerMonth} left</small></>}
            </span>
          </div>
        )}
        <Link className="card stat stat-link lift" href="/app/team">
          <span className="stat-label">Team · {ROLE_LABEL[role]}</span>
          <span className="stat-value">
            {used} <small>of {team.seats} seat{team.seats === 1 ? "" : "s"}</small>
          </span>
        </Link>
      </section>

      {usage && (
        <section className="card panel enter d3" aria-labelledby="usage-h">
          <h2 id="usage-h" className="panel-h" style={{ fontSize: 22 }}>Your usage</h2>
          {usage.blocked && (
            <p className="flash flash-err" style={{ margin: 0 }}>
              {limitReachedMessage(usage.blocked)}{" "}
              {role === "owner" && <Link href="/app/billing#extra">Add extra usage</Link>}
            </p>
          )}
          <UsageMeter usage={usage} />
        </section>
      )}

      {jobList.length === 0 ? (
        <section className="card enter d3 empty-state">
          <h2 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>No jobs yet</h2>
          <p className="lead" style={{ fontSize: 16 }}>
            {team.plan === "free"
              ? "Start with a radxml review or a question about ODT. Your plan includes 5 questions a month."
              : "Describe a change, upload your objects, agree the plan with TrustForge and download files ready for ODT."}
          </p>
          <div>
            <Link className="btn btn-solid btn-sm" href="/app/jobs/new">Start your first job</Link>
          </div>
        </section>
      ) : (
        <section className="card enter d3 panel" aria-labelledby="jobs-h">
          <h2 id="jobs-h" className="panel-h">Recent jobs</h2>
          <ul className="job-list">
            {jobList.map((j) => (
              <li key={j.id}>
                <Link href={`/app/jobs/${j.id}`} className="job-row">
                  <span className="job-title">{j.title}</span>
                  <span className="job-meta">
                    {JOB_TYPE_LABEL[j.jobType]} · UBS {j.release} · {dateFmt.format(j.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
