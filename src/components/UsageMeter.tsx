"use client";

import { useEffect, useState } from "react";
import type { MemberUsage } from "@/lib/usage";

/** Reset time in the viewer's own time zone (UTC until the browser takes over, to keep hydration stable). */
function ResetTime({ iso }: { iso: string }) {
  const fmt = (tz?: string) =>
    new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));
  const [text, setText] = useState(() => `${fmt("UTC")} UTC`);
  useEffect(() => setText(fmt()), [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return <time dateTime={iso}>{text}</time>;
}

/** Daily, weekly and monthly usage as percentages of the member's limits. Amounts are never shown. */
export function UsageMeter({ usage, compact = false }: { usage: MemberUsage; compact?: boolean }) {
  return (
    <div className={`usage${compact ? " usage-compact" : ""}`}>
      {usage.windows.map((w) => {
        const pct = Math.min(100, Math.round((w.usedCents / Math.max(1, w.limitCents)) * 100));
        const tone = pct >= 100 ? "full" : pct >= 80 ? "warn" : "ok";
        return (
          <div key={w.key} className="usage-row">
            <div className="usage-top">
              <span className="usage-label">{w.label}</span>
              <span className={`usage-pct ${tone}`}>{pct}% used</span>
            </div>
            <div
              className="usage-bar"
              role="meter"
              aria-label={`${w.label}: ${pct}% of your limit used`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <span className={tone} style={{ width: `${pct}%` }} />
            </div>
            <span className="usage-reset">
              Resets <ResetTime iso={w.resetsAt} />
            </span>
          </div>
        );
      })}
      {(usage.extraValueCents > 0 || usage.limitHit) && (
        <div className="usage-row usage-extra">
          <div className="usage-top">
            <span className="usage-label">Team extra usage</span>
            <span className={`usage-pct ${usage.extraValueCents > 0 ? "ok" : "full"}`}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usage.extraValueCents / 100)} left
            </span>
          </div>
          <span className="usage-reset">
            {usage.limitHit && usage.extraValueCents > 0
              ? "You’re over a limit, so you’re using extra usage now."
              : usage.limitHit
                ? "Your team owner can add extra usage in Billing."
                : "Used only after you reach a limit."}
          </span>
        </div>
      )}
    </div>
  );
}
