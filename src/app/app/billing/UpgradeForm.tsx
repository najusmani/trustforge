"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/Logo";
import { cycleLabel, formatPrice, type PartnerPrice } from "@/lib/price-format";
import { startCheckout } from "./actions";

/** Seat picker + Paddle overlay checkout. The transaction is created on the server. */
export function UpgradeForm({ minSeats, price }: { minSeats: number; price: PartnerPrice }) {
  const router = useRouter();
  const [seats, setSeats] = useState(Math.max(1, minSeats));
  const [state, setState] = useState<"idle" | "opening" | "waiting">("idle");
  const [error, setError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (poll.current) clearInterval(poll.current);
  }, []);

  async function upgrade() {
    setError(null);
    setState("opening");
    const start = await startCheckout(seats);
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
          // Payment done; the plan changes when Paddle's notification reaches us (usually seconds).
          setState("waiting");
          poll.current = setInterval(() => router.refresh(), 3000);
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
        Payment received. Your team is being moved to Partner; this page updates in a few seconds.
      </p>
    );
  }

  return (
    <div className="invite-form" style={{ alignItems: "flex-end" }}>
      <div className="field" style={{ flex: "0 1 160px" }}>
        <label htmlFor="up-seats">Seats</label>
        <input
          className="input"
          id="up-seats"
          type="number"
          min={Math.max(1, minSeats)}
          max={100}
          value={seats}
          onChange={(e) => setSeats(Math.max(1, Math.min(100, Math.floor(Number(e.target.value) || 1))))}
          inputMode="numeric"
        />
      </div>
      <button type="button" className="btn btn-primary" onClick={upgrade} disabled={state === "opening"} style={{ minHeight: 48 }}>
        {state === "opening" ? "Opening checkout…" : <>Upgrade for {formatPrice(price, seats)} / {cycleLabel(price)} <Arrow /></>}
      </button>
      {error && (
        <p className="flash flash-err" role="alert" style={{ flexBasis: "100%" }}>
          {error}
        </p>
      )}
    </div>
  );
}
