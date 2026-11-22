"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JobView, ViewItem } from "@/lib/jobs";
import { SubmitButton } from "@/components/SubmitButton";
import { Markdown } from "@/components/Markdown";
import { LogoMark } from "@/components/Logo";
import { UsageMeter } from "@/components/UsageMeter";
import { answerApproval, replyToJob, stopJob } from "../actions";

type FileRow = { id: string; name: string; size: number };

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function statusOf(view: JobView | null): { label: string; tone: "work" | "you" | "done" | "warn" } {
  if (!view) return { label: "Connecting…", tone: "work" };
  if (view.pending.length) return { label: "Needs your approval", tone: "you" };
  if (view.status === "running" || view.status === "rescheduling") return { label: "TrustForge is working…", tone: "work" };
  if (view.status === "terminated") return { label: "Job ended", tone: "done" };
  if (view.stopReason === "budget_reached") return { label: view.usage?.blocked ? "Usage limit reached" : "Paused", tone: "warn" };
  return { label: "Your turn", tone: "done" };
}

function Item({ item, live }: { item: ViewItem; live: boolean }) {
  if (item.kind === "user") {
    return (
      <li className="msg msg-user">
        <div className="msg-text">{item.text}</div>
      </li>
    );
  }
  if (item.kind === "agent") {
    return (
      <li className="msg msg-agent">
        <span className="agent-mark" aria-hidden="true">
          <LogoMark size={28} />
        </span>
        <div className="agent-body">
          <span className="msg-who">TrustForge</span>
          <Markdown>{item.text}</Markdown>
        </div>
      </li>
    );
  }
  if (item.kind === "thinking") {
    return (
      <li className={`thinking${live ? " live" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>TrustForge thinking</span>
        {live && <span className="thinking-dots" aria-hidden="true"><span /><span /><span /></span>}
      </li>
    );
  }
  return <li className="msg-error" role="alert">{item.text}</li>;
}

export function JobLive({
  jobId,
  hasSession,
  uploads,
  questionsLeft,
  questionsLimit,
}: {
  jobId: string;
  hasSession: boolean;
  uploads: FileRow[];
  questionsLeft: number | null;
  questionsLimit: number | null;
}) {
  const [view, setView] = useState<JobView | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const lastStatus = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const seenCount = useRef(0);

  const load = useCallback(async () => {
    const wantOutputs = lastStatus.current !== "running";
    const res = await fetch(`/api/jobs/${jobId}/state${wantOutputs ? "?outputs=1" : ""}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ error: "Couldn’t read the job." }));
    if (!res.ok) {
      setProblem(data.error ?? "Couldn’t reach TrustForge.");
      return 10000;
    }
    setProblem(null);
    setView((prev) => (wantOutputs || !prev ? data : { ...data, outputs: prev.outputs }));
    lastStatus.current = data.status;
    const busy = data.status === "running" || data.status === "rescheduling";
    return data.status === "terminated" ? null : busy ? 3000 : 12000;
  }, [jobId]);

  useEffect(() => {
    if (!hasSession) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const tick = async () => {
      const next = await load().catch(() => 10000);
      if (!stopped && next) timer = setTimeout(tick, next);
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasSession, load]);

  useEffect(() => {
    const n = view?.items.length ?? 0;
    if (n > seenCount.current) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    seenCount.current = n;
  }, [view?.items.length]);

  const status = statusOf(view);
  const busy = view?.status === "running" || view?.status === "rescheduling";
  const limited = view?.usage ? view.usage.remainingCents < 10 : false;
  const capped = view?.stopReason === "budget_reached" && !view?.usage; // Free job at its fixed cap
  const blocked = Boolean(view?.pending.length) || capped || limited || view?.status === "terminated";
  const outOfQuestions = questionsLeft !== null && questionsLeft <= 0;

  return (
    <div className="job-grid">
      <section className="card panel job-chat" aria-label="Conversation">
        <div className="job-status" role="status" aria-live="polite">
          <span className={`status-dot ${status.tone}`} />
          {status.label}
          {busy && (
            <form action={stopJob} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="jobId" value={jobId} />
              <button type="submit" className="link-btn">Stop</button>
            </form>
          )}
        </div>
        {problem && <p className="flash flash-err">{problem}</p>}

        <ol className="msgs">
          {view?.items.map((it, i) => (
            <Item key={it.id} item={it} live={busy && i === view.items.length - 1} />
          ))}
          {busy && view?.items[view.items.length - 1]?.kind !== "thinking" && (
            <li className="thinking live">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>TrustForge thinking</span>
              <span className="thinking-dots" aria-hidden="true"><span /><span /><span /></span>
            </li>
          )}
        </ol>
        <div ref={endRef} />

        {view?.pending.map((p) => (
          <div key={p.eventId} className="approval">
            <p style={{ margin: 0 }}>
              TrustForge wants to run <span className="mono">{p.name}</span>:
            </p>
            <pre className="approval-detail">{p.detail}</pre>
            <div style={{ display: "flex", gap: 8 }}>
              <form action={answerApproval}>
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="eventId" value={p.eventId} />
                <input type="hidden" name="decision" value="allow" />
                <SubmitButton pendingLabel="Sending…" className="btn btn-solid btn-sm" arrow={false}>Allow</SubmitButton>
              </form>
              <form action={answerApproval}>
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="eventId" value={p.eventId} />
                <input type="hidden" name="decision" value="deny" />
                <SubmitButton pendingLabel="Sending…" className="btn btn-ghost btn-sm" arrow={false}>Deny</SubmitButton>
              </form>
            </div>
          </div>
        ))}

        {capped && (
          <p className="flash flash-err">This job reached its spending cap. Start a new job to continue, or contact TrustRoute.</p>
        )}
        {limited && view?.usage && (
          <p className="flash flash-err">
            {view.usage.blocked ? (
              <>
                You’ve reached your {view.usage.blocked.key === "day" ? "daily" : view.usage.blocked.key === "week" ? "weekly" : "monthly"} usage
                limit. You can continue when it resets, or your team owner can <a href="/app/billing#extra">add extra usage</a>.
              </>
            ) : (
              <>Your other running jobs are using the rest of your allowance. Continue here when they finish.</>
            )}
          </p>
        )}
        {view?.stopReason === "budget_reached" && view?.usage && !limited && (
          <p className="flash flash-warn">TrustForge paused at the usage ceiling for that turn. Send a message to continue.</p>
        )}

        {outOfQuestions ? (
          <p className="flash flash-err">
            You’ve used this month’s {questionsLimit} Free questions. They reset on the 1st, or move to Partner for every job type.
          </p>
        ) : (
          <form action={replyToJob} className="composer">
            <input type="hidden" name="jobId" value={jobId} />
            <label htmlFor="message" className="sr-only">Message to TrustForge</label>
            <textarea
              id="message"
              name="message"
              className="input"
              rows={3}
              maxLength={20000}
              placeholder={view?.pending.length ? "Answer the approval above first" : blocked ? "Messages are paused" : "Reply, approve the plan, or ask for a change"}
              disabled={blocked}
            />
            <div className="composer-row">
              <label className="link-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="file" name="files" multiple disabled={blocked} className="file-input-inline" />
              </label>
              <span className="composer-note">
                {questionsLeft === null ? "" : `${questionsLeft} of ${questionsLimit} questions left this month`}
              </span>
              <SubmitButton pendingLabel="Sending…" className="btn btn-solid btn-sm">Send</SubmitButton>
            </div>
          </form>
        )}
      </section>

      <aside className="job-side">
        <section className="card panel">
          <h2 className="panel-h" style={{ fontSize: 20 }}>Results</h2>
          {view && view.outputs.length > 0 ? (
            <ul className="file-rows">
              {view.outputs.map((f) => (
                <li key={f.id}>
                  <a href={`/api/jobs/${jobId}/files/${f.id}`} className="file-link mono">{f.filename}</a>
                  <span className="file-size">{fmtSize(f.size)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-3)" }}>
              {busy ? "Files appear here when TrustForge finishes a step." : "No files yet."}
            </p>
          )}
        </section>
        <section className="card panel">
          <h2 className="panel-h" style={{ fontSize: 20 }}>Your uploads</h2>
          {uploads.length ? (
            <ul className="file-rows">
              {uploads.map((f) => (
                <li key={f.id}>
                  <a href={`/api/jobs/${jobId}/files/${f.id}`} className="file-link mono">{f.name}</a>
                  <span className="file-size">{fmtSize(f.size)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-3)" }}>None yet.</p>
          )}
        </section>
        {view?.usage && (
          <section className="card panel" aria-labelledby="usage-side-h">
            <h2 id="usage-side-h" className="panel-h" style={{ fontSize: 20 }}>Your usage</h2>
            <UsageMeter usage={view.usage} compact />
          </section>
        )}
      </aside>
    </div>
  );
}
