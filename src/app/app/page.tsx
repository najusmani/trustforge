import Link from "next/link";
import { Flash } from "@/components/Flash";
import { Arrow } from "@/components/Logo";
import { getMembership, requireUser, ROLE_LABEL, seatsUsed } from "@/lib/teams";
import { createTeam } from "./actions";

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
  const used = await seatsUsed(team.id);

  return (
    <div className="app-wide">
      <Flash error={error} notice={notice} />
      <div className="enter d1" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="eyebrow">{team.name}</span>
        <h1 className="app-h1">
          Your <em className="ember">jobs</em>
        </h1>
      </div>

      <section className="card enter d2 empty-state">
        <h2 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>The job workspace is on its way</h2>
        <p className="lead" style={{ fontSize: 16 }}>
          Soon you’ll start jobs here: describe the change, upload your objects, agree the plan with TrustForge and
          download files ready for ODT. Your team is set up and ready for it.
        </p>
      </section>

      <section className="stat-row enter d3" aria-label="Team summary">
        <div className="card stat">
          <span className="stat-label">Your role</span>
          <span className="stat-value">{ROLE_LABEL[role]}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Seats in use</span>
          <span className="stat-value">
            {used} <small>of {team.seats}</small>
          </span>
        </div>
        <Link className="card stat stat-link lift" href="/app/team">
          <span className="stat-label">Team</span>
          <span className="stat-value" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Manage <Arrow />
          </span>
        </Link>
      </section>
    </div>
  );
}
