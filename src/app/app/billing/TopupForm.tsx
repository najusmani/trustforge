"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/Logo";
import { formatPrice, type PartnerPrice } from "@/lib/price-format";
import { startTopup } from "./actions";

/** Buy extra usage: number of units + Paddle overlay checkout. The transaction is created on the server. */
export function TopupForm({ unit, maxUnits }: { unit: PartnerPrice; maxUnits: number }) {
  const router = useRouter();
  const [units, setUnits] = useState(2);
  const [state, setState] = useState<"idle" | "opening" | "waiting">("idle");
  const [error, setError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (poll.current) clearInterval(poll.current);
  }, []);

  async function buy() {
    setError(null);
    setState("opening");
    const start = await startTopup(units);
    if (!start.ok) {
      setError(start.error);
      setState("idle");
      return;
    }
    const p = await initializePaddle({
      environment: start.env,
      token: start.clientToken,
      eventCallback(ev) {
        if (ev.name === "checkout.completed") {
          setState("waiting");
          poll.current = setInterval(() => router.refresh(), 3000);
          setTimeout(() => poll.current && clearInterval(poll.current), 60_000);
        }
        if (ev.name === "checkout.closed") setState((s) => (s === "waiting" ? s : "idle"));
      },
    });
    if (!p) {
      setError("Paddle’s checkout couldn’t load. Check your connection or ad blocker, then try again.");
      setState("idle");
      return;
    }
    p.Checkout.open({ transactionId: start.transactionId, settings: { displayMode: "overlay", theme: "dark" } });
  }

  if (state === "waiting") {
    return (
      <p className="flash flash-ok" role="status">
        Payment received. Your extra usage appears here in a few seconds.
      </p>
    );
  }

  return (
    <div className="invite-form" style={{ alignItems: "flex-end" }}>
      <div className="field" style={{ flex: "0 1 200px" }}>
        <label htmlFor="topup-units">Amount</label>
        <select id="topup-units" className="input" value={units} onChange={(e) => setUnits(Number(e.target.value))}>
          {[1, 2, 5, 10, 20, maxUnits].filter((n, i, a) => n <= maxUnits && a.indexOf(n) === i).map((n) => (
            <option key={n} value={n}>{formatPrice(unit, n)}</option>
          ))}
        </select>
      </div>
      <button type="button" className="btn btn-primary" onClick={buy} disabled={state === "opening"} style={{ minHeight: 48 }}>
        {state === "opening" ? "Opening checkout…" : <>Buy {formatPrice(unit, units)} of extra usage <Arrow /></>}
      </button>
      {error && (
        <p className="flash flash-err" role="alert" style={{ flexBasis: "100%" }}>
          {error}
        </p>
      )}
    </div>
  );
}
