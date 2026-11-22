"use client";

import { useState } from "react";
import { Arrow } from "@/components/Logo";

const PLAN_LABELS = { free: "Free", partner: "Partner", private: "Private install" } as const;
type Plan = keyof typeof PLAN_LABELS;

const RELEASES = ["14.7", "14.6", "Both"] as const;

export function EarlyAccessForm({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [release, setRelease] = useState<(typeof RELEASES)[number]>("14.7");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          seats: form.get("seats"),
          notes: form.get("notes"),
          website: form.get("website"),
          plan,
          release,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setState("done");
      setMessage("Thank you. We’ll be in touch at the email you gave us.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="form" role="status">
        <p className="form-msg ok" style={{ margin: 0, fontSize: 18 }}>{message}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <div className="field">
        <span id="plan-l" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>Plan</span>
        <div className="choices" role="group" aria-labelledby="plan-l">
          {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
            <button key={p} type="button" className="choice" aria-pressed={plan === p} onClick={() => setPlan(p)}>
              {PLAN_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="name">Your name</label>
        <input className="input" id="name" name="name" autoComplete="name" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required maxLength={200} />
      </div>
      <div className="field">
        <label htmlFor="company">Bank or company</label>
        <input className="input" id="company" name="company" autoComplete="organization" required maxLength={200} />
      </div>

      <div className="field">
        <span id="rel-l" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>FLEXCUBE release</span>
        <div className="choices" role="group" aria-labelledby="rel-l">
          {RELEASES.map((r) => (
            <button key={r} type="button" className="choice" aria-pressed={release === r} onClick={() => setRelease(r)}>
              {r === "Both" ? "Both" : `UBS ${r}`}
            </button>
          ))}
        </div>
      </div>

      {plan !== "free" && (
        <div className="field">
          <label htmlFor="seats">How many developers?</label>
          <input className="input" id="seats" name="seats" type="number" min={1} defaultValue={1} inputMode="numeric" />
        </div>
      )}

      <div className="field">
        <label htmlFor="notes">What would you build first? (optional)</label>
        <textarea className="input" id="notes" name="notes" maxLength={2000} placeholder="For example: a new maintenance screen, or a change to an Oracle function" />
      </div>

      {/* Spam trap: real people never see or fill this. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Request access"} <Arrow />
        </button>
        {state === "error" && (
          <span className="form-msg err" role="alert">{message}</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
        We use these details only to contact you about TrustForge. See our <a href="/privacy">privacy notice</a>.
      </p>
    </form>
  );
}
