import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/Flash";
import { JOB_TYPES } from "@/db/schema";
import { questionsLeft } from "@/lib/jobs";
import { JOB_TYPE_LABEL, LAYERS, PLAN_CONFIG, RELEASES, UPLOAD_LIMITS } from "@/lib/plans";
import { getMembership, requireUser } from "@/lib/teams";
import { SubmitButton } from "@/components/SubmitButton";
import { createJob } from "../actions";

export const metadata: Metadata = { title: "New job" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string }>;
}) {
  const { error, type } = await searchParams;
  const user = await requireUser("/app/jobs/new");
  const m = await getMembership(user.id);
  if (!m) redirect("/app");

  const plan = m.team.plan;
  const cfg = PLAN_CONFIG[plan];
  const left = await questionsLeft(m.team.id, plan);
  const allowed = new Set(cfg.jobTypes);
  const initial = type && allowed.has(type as never) ? type : plan === "free" ? "review" : "customize";
  const outOfQuestions = left !== null && left <= 0;

  return (
    <div className="app-wide" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow enter d1">New job</span>
        <h1 className="app-h1 enter d2">
          What shall we <em className="ember">forge</em>?
        </h1>
        <p className="lead enter d3">
          Describe it in your own words and upload what you have. TrustForge asks what it still needs
          {plan === "partner" ? ", shows you a plan, and builds only after you approve it." : "."}
        </p>
      </div>
      <Flash error={error} />

      {outOfQuestions ? (
        <section className="card panel">
          <h2 className="panel-h">You’ve used this month’s questions</h2>
          <p className="lead" style={{ fontSize: 15 }}>
            The Free plan includes {cfg.questionsPerMonth} questions a month. They reset on the 1st. Partner teams have
            no monthly limit.
          </p>
          <div><Link className="btn btn-ghost btn-sm" href="/app">Back to jobs</Link></div>
        </section>
      ) : (
        <form action={createJob} className="card form new-job enter d4">
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>Kind of job</legend>
            <div className="type-grid">
              {JOB_TYPES.map((t, i) => {
                const ok = allowed.has(t);
                return (
                  <label key={t} className={`type-card${ok ? "" : " locked"}`}>
                    <input type="radio" name="jobType" value={t} defaultChecked={t === initial} disabled={!ok} required />
                    <span className="type-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="type-t">{JOB_TYPE_LABEL[t]}</span>
                    {!ok && <span className="tag" style={{ alignSelf: "flex-start" }}>Partner</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="requirement">Your requirement or question</label>
            <textarea
              className="input"
              id="requirement"
              name="requirement"
              required
              minLength={5}
              maxLength={20000}
              rows={6}
              placeholder="For example: Add a sixth charge to IFDATMMN (ARC maintenance), same as charge 5."
            />
          </div>

          <div className="field">
            <label htmlFor="files">Files (radxml, DDL or DESC output, packages, JS, UIXML, INCs)</label>
            <input className="input file-input" id="files" name="files" type="file" multiple />
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>
              Up to {UPLOAD_LIMITS.maxFiles} files and {UPLOAD_LIMITS.maxTotalBytes / 1024 / 1024} MB per send. You can add
              more files later in the conversation.
            </span>
          </div>

          <div className="row-3">
            <div className="field">
              <label htmlFor="release">FLEXCUBE release</label>
              <select className="input" id="release" name="release" defaultValue="14.7">
                {RELEASES.map((r) => (
                  <option key={r} value={r}>FLEXCUBE UBS {r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="layer">Layer</label>
              <select className="input" id="layer" name="layer" defaultValue="CUSTOM">
                {LAYERS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="patchVersion">Release code in ODT (patch version)</label>
              <input
                className="input mono"
                id="patchVersion"
                name="patchVersion"
                maxLength={60}
                pattern="[A-Za-z0-9._\-]+"
                placeholder="e.g. 14.7.0.6.0"
                autoComplete="off"
              />
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Exactly as the release is named in ODT. Not needed for questions.</span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 14, color: "var(--text-2)" }}>
              {left === null ? `${cfg.label} plan · ${cfg.modelLabel}` : `${left} of ${cfg.questionsPerMonth} questions left this month · ${cfg.modelLabel}`}
            </span>
            <SubmitButton pendingLabel="Starting…">Start the job</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
