"use client";

import { useEffect, useState } from "react";

const PHASES = ["Describing", "Discussing", "Building", "Ready"] as const;
const FILES = ["IFDATMMN_RAD.xml", "ifpks_ifdatmmn_custom.sql", "IFDATMMN_CUSTOM.js"];

/** Looping demo of one TrustForge job: request, question, build, ready files. */
export function HeroDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTick(3);
      return;
    }
    const id = window.setInterval(() => setTick((t) => (t + 1) % 7), 2200);
    return () => window.clearInterval(id);
  }, []);

  const phase = Math.min(tick, 3);

  return (
    <div className="demo-wrap enter d4">
      <div className="demo" role="img" aria-label="Example job: a request to add a sixth charge to IFDATMMN becomes three files ready for ODT">
        <div className="demo-bar" aria-hidden="true">
          <span className="demo-lights"><span /><span /><span /></span>
          <span>IFDATMMN · Charge 6</span>
          <span className="demo-phase">{PHASES[phase]}</span>
        </div>
        <div className="demo-body" aria-hidden="true">
          <p className="bubble-user pop-in">Add a sixth charge to IFDATMMN. Same as charge 5.</p>
          {phase >= 1 && (
            <div className="ai-row pop-in">
              <span className="ai-mark" />
              <p>
                Please upload <span className="code">CSPKS_ARC</span>, <span className="code">_CLUSTER</span> and{" "}
                <span className="code">_CUSTOM</span>.
              </p>
            </div>
          )}
          {phase >= 2 && (
            <div className="plan-box pop-in">
              <div className="plan-box-top">
                <strong>Plan approved · building</strong>
                <span className="mono" style={{ color: "var(--accent-hi)" }}>7 steps</span>
              </div>
              <div className="track"><span /></div>
            </div>
          )}
          {phase >= 3 && (
            <ul className="file-list">
              {FILES.map((f, i) => (
                <li key={f} className="file-ok" style={{ animationDelay: `${i * 140}ms` }}>
                  {f}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" fill="#34D399" />
                    <path d="m5.5 9.2 2.3 2.3 4.7-4.8" stroke="#06281A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </li>
              ))}
              <li className="ok-line">0 errors · 0 Oracle values changed</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
