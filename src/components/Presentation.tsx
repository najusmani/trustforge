"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS, TOTAL_SECONDS, type Chapter } from "./presentation-script";
import st from "./presentation.module.css";

/* ---------- helpers ---------- */

const STARTS = CHAPTERS.reduce<number[]>((acc, c, i) => [...acc, i === 0 ? 0 : acc[i - 1] + CHAPTERS[i - 1].seconds], []);

function clock(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Reveal wrapper: visible once the chapter clock passes `at`. */
function R({ t, at, className = "", children }: { t: number; at: number; className?: string; children: React.ReactNode }) {
  return <div className={`${st.rv} ${t >= at ? st.in : ""} ${className}`}>{children}</div>;
}

function count(t: number, from: number, dur: number, target: number) {
  if (t <= from) return 0;
  return Math.round(Math.min(1, (t - from) / dur) * target);
}

function typed(t: number, from: number, cps: number, text: string) {
  return text.slice(0, Math.max(0, Math.floor((t - from) * cps)));
}

/* ---------- scenes ---------- */

function Diamond({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={st.diamond}>
      <rect x="32" y="6" width="36.8" height="36.8" transform="rotate(45 32 6)" fill="none" stroke="#C9AE78" strokeWidth="1.5" />
      <path d="M21 24h22M32 24v17M26.5 35.5l5.5 5.5 5.5-5.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Scene({ chapter, t }: { chapter: Chapter; t: number }) {
  switch (chapter.id) {
    case "intro":
      return (
        <div className={st.center}>
          <R t={t} at={0.3}><Diamond size={88} /></R>
          <R t={t} at={1.2}><h3 className={st.title}>TrustForge</h3></R>
          <R t={t} at={2.4}><p className={st.kicker}>AI agent for Oracle FLEXCUBE · Built on Anthropic</p></R>
          <R t={t} at={11}><p className={st.sub}>What changes cost today · How the agent builds them · What stays with your team</p></R>
        </div>
      );
    case "problem":
      return (
        <div className={st.grid3}>
          <R t={t} at={14} className={st.stat}>
            <span className={st.big}>${count(t, 14, 6, 100)}k+</span>
            <span className={st.label}>per customization, through a partner</span>
          </R>
          <R t={t} at={30} className={st.stat}>
            <span className={st.big}>{count(t, 30, 5, 100)}s</span>
            <span className={st.label}>of developers on a programme</span>
          </R>
          <R t={t} at={42} className={st.stat}>
            <span className={st.big}>Weeks</span>
            <span className={st.label}>before the first file reaches ODT</span>
          </R>
          <R t={t} at={0.5} className={st.span3}><p className={st.heading}>A typical FLEXCUBE change, the usual way</p></R>
        </div>
      );
    case "why":
      return (
        <div className={st.split}>
          <div className={st.layers}>
            {[
              ["CUSTOM", "your bank", 12],
              ["CLUSTER", "regional", 13.5],
              ["KERNEL", "Oracle", 15],
            ].map(([n, d, at]) => (
              <R key={n as string} t={t} at={at as number} className={`${st.layer} ${n === "CUSTOM" ? st.layerHot : ""}`}>
                <strong>{n}</strong>
                <span>{d}</span>
              </R>
            ))}
          </div>
          <div className={st.list}>
            <R t={t} at={0.5}><p className={st.heading}>ODT rules behind every change</p></R>
            {["How release layers merge", "Which scripts ODT must generate", "How hook packages are called", "Which save errors mean what"].map((x, i) => (
              <R key={x} t={t} at={24 + i * 3} className={st.item}>{x}</R>
            ))}
            <R t={t} at={38} className={`${st.item} ${st.warn}`}>Miss one: the screen won’t save, or Modify fails weeks later</R>
          </div>
        </div>
      );
    case "meet":
      return (
        <div className={st.center}>
          <R t={t} at={0.5}><p className={st.heading}>An AI agent built on Anthropic, with FLEXCUBE ODT checks</p></R>
          <div className={st.loop}>
            {["Describe", "Discuss", "Build", "Deliver"].map((x, i) => (
              <R key={x} t={t} at={16 + i * 2.5} className={`${st.step} ${t >= 16 + i * 2.5 && t < 16 + (i + 1) * 2.5 + 3 ? st.stepOn : ""}`}>
                <span className={st.stepN}>{["i.", "ii.", "iii.", "iv."][i]}</span>
                <span>{x}</span>
              </R>
            ))}
          </div>
        </div>
      );
    case "describe": {
      const req = "Add a sixth charge to IFDATMMN, the same as charge five.";
      return (
        <div className={st.app}>
          <R t={t} at={1} className={st.chips}>
            {["Customize a function", "UBS 14.7", "CUSTOM", "Release code: FCUBS_14.7.0.6.0"].map((c, i) => (
              <span key={c} className={`${st.chip} ${t >= 2 + i * 2.5 ? st.chipOn : ""}`}>{c}</span>
            ))}
          </R>
          <R t={t} at={16} className={st.input}>
            {typed(t, 16, 6, req)}
            {t >= 16 && t < 30 && <span className={st.caret} />}
          </R>
          <R t={t} at={30} className={st.files}>
            {["IFDATMMN_RAD.xml", "IFTM_ARC_MAINT.sql", "CSPKS_ARC.sql", "IFPKS_IFDATMMN_MAIN.sql"].map((f, i) => (
              <span key={f} className={`${st.file} ${t >= 31 + i * 2 ? st.in2 : ""}`}>{f}</span>
            ))}
          </R>
          <R t={t} at={46} className={st.bubble}>
            <strong>TrustForge</strong>
            <ol>
              <li>R1 · Charge 6 tab, same layout as charge 5</li>
              <li>R2 · Slabs for charge 6</li>
              <li>R3 · Saved, queried, amended and authorised with the record</li>
              <li>R4 · Same validations as charge 5</li>
            </ol>
          </R>
        </div>
      );
    }
    case "discuss":
      return (
        <div className={st.app}>
          <R t={t} at={10} className={st.bubble}>
            <strong>TrustForge</strong>
            <p>Where should charge 6 be stored? I recommend a custom 1:1 extension table, so Oracle’s table stays untouched.</p>
          </R>
          <R t={t} at={18} className={`${st.bubble} ${st.me}`}><p>Extension table.</p></R>
          <R t={t} at={26} className={st.bubble}>
            <strong>TrustForge</strong>
            <p>Is charge 6 only maintained, or also applied when transactions are processed?</p>
          </R>
          <R t={t} at={40} className={st.plan}>
            <span className={st.planH}>Plan</span>
            {["radxml · CUSTOM delta", "IFTM_ARC_MAINT_CUSTOM table", "CUSTOM hook package", "Release JavaScript", "Labels · deploy guide · tests"].map((x, i) => (
              <span key={x} className={`${st.planItem} ${t >= 42 + i * 1.5 ? st.in2 : ""}`}>{x}</span>
            ))}
            <span className={`${st.approve} ${t >= 52 ? st.approveOn : ""}`}>Approve plan</span>
          </R>
        </div>
      );
    case "build":
      return (
        <div className={st.split}>
          <div className={st.list}>
            {[
              ["radxml/IFDATMMN_RAD.xml", 8],
              ["db/ddl/iftm_arc_maint_custom.sql", 11],
              ["db/packages/ifpks_ifdatmmn_custom.sql", 14],
              ["js/IFDATMMN_CUSTOM.js", 17],
              ["db/static/labels.sql", 20],
              ["CHANGES.md", 23],
            ].map(([f, at]) => (
              <R key={f as string} t={t} at={at as number} className={`${st.item} ${st.mono}`}>
                <span className={`${st.tick} ${t >= (at as number) + 20 ? st.tickOn : ""}`}>✓</span>
                {f}
              </R>
            ))}
          </div>
          <div className={st.center}>
            <R t={t} at={8} className={st.stat}>
              <span className={st.big}>{count(t, 8, 10, 36)}</span>
              <span className={st.label}>fields added in the CUSTOM layer</span>
            </R>
            <R t={t} at={44} className={st.stat}>
              <span className={`${st.big} ${st.zero}`}>0</span>
              <span className={st.label}>Oracle values changed</span>
            </R>
          </div>
        </div>
      );
    case "deliver":
      return (
        <div className={st.list}>
          <R t={t} at={0.5}><p className={st.heading}>Deployment, owned by the bank</p></R>
          {[
            ["1", "Run the DDL", 3],
            ["2", "Load the radxml in ODT, save, generate", 16],
            ["3", "TrustForge checks the generated zip", 22],
            ["4", "Compile INCs and packages", 32],
            ["5", "Deploy and run the unit tests", 38],
          ].map(([n, x, at]) => (
            <R key={n as string} t={t} at={at as number} className={st.item}>
              <span className={st.num}>{n}</span>
              {x}
            </R>
          ))}
        </div>
      );
    case "learns":
      return (
        <div className={st.center}>
          <R t={t} at={8} className={st.err}>ST-AMND-002 on Modify</R>
          <R t={t} at={14}><p className={st.sub}>Cause: no Actions node in the CUSTOM layer, so ODT generated no amendable scripts</p></R>
          <R t={t} at={26} className={st.fix}>New check added for every bank</R>
        </div>
      );
    case "safety":
      return (
        <div className={st.grid2}>
          {[
            ["Oracle’s code is never edited", 0.5],
            ["Nothing without approval", 10],
            ["No secrets in files", 14],
            ["Private sandbox per job, or your own network", 20],
          ].map(([x, at]) => (
            <R key={x as string} t={t} at={at as number} className={st.card}>{x}</R>
          ))}
        </div>
      );
    case "cost": {
      const shrink = t >= 22 ? Math.max(10, 100 - Math.min(1, (t - 22) / 8) * 90) : 100;
      return (
        <div className={st.list}>
          <R t={t} at={6} className={st.barRow}>
            <span className={st.barLabel}>The usual way</span>
            <span className={st.bar}><span className={st.barFill} style={{ width: "100%" }} /></span>
          </R>
          <R t={t} at={22} className={st.barRow}>
            <span className={st.barLabel}>With TrustForge</span>
            <span className={st.bar}><span className={`${st.barFill} ${st.barGold}`} style={{ width: `${shrink}%` }} /></span>
          </R>
          <R t={t} at={40} className={st.pctRow}>
            <span className={st.pct}>{count(t, 40, 4, 90)}%</span>
            <span className={st.label}>up to 90% lower development cost</span>
          </R>
        </div>
      );
    }
    default:
      return (
        <div className={st.center}>
          <div className={st.grid3}>
            <R t={t} at={0.5} className={st.card}>Free<br /><small>Reviews and ODT questions</small></R>
            <R t={t} at={10} className={`${st.card} ${st.cardHot}`}>Partner<br /><small>Every job type · usage per seat · extra usage</small></R>
            <R t={t} at={30} className={st.card}>Private install<br /><small>In your bank’s own cloud</small></R>
          </div>
          <R t={t} at={40}><Diamond size={56} /></R>
          <R t={t} at={41}><p className={st.kicker}>FLEXCUBE customizations, forged in conversation</p></R>
        </div>
      );
  }
}

/* ---------- player ---------- */

export function Presentation() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const spoken = useRef<string>("");

  const idx = useMemo(() => {
    let i = 0;
    while (i + 1 < CHAPTERS.length && time >= STARTS[i + 1]) i++;
    return i;
  }, [time]);
  const chapter = CHAPTERS[idx];
  const t = time - STARTS[idx];
  const caption = [...chapter.captions].reverse().find((c) => t >= c.at) ?? chapter.captions[0];

  // clock
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    const id = setInterval(() => {
      const now = performance.now();
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((x) => {
        const n = x + dt;
        if (n >= TOTAL_SECONDS) {
          setPlaying(false);
          return TOTAL_SECONDS - 0.01;
        }
        return n;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  // voice-over (browser speech), one caption at a time
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const key = `${chapter.id}:${caption.at}`;
    if (!voice || !playing) {
      window.speechSynthesis.cancel();
      spoken.current = "";
      return;
    }
    if (spoken.current === key) return;
    spoken.current = key;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(caption.text);
    u.rate = 1;
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }, [voice, playing, chapter.id, caption.at, caption.text]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const seek = useCallback((s: number) => {
    spoken.current = "";
    setTime(Math.max(0, Math.min(TOTAL_SECONDS - 0.01, s)));
  }, []);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      setPlaying((p) => !p);
    } else if (e.key === "ArrowRight") seek(STARTS[Math.min(CHAPTERS.length - 1, idx + 1)]);
    else if (e.key === "ArrowLeft") seek(t > 2 ? STARTS[idx] : STARTS[Math.max(0, idx - 1)]);
  }

  function fullscreen() {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }

  return (
    <div className={st.player} ref={wrap} onKeyDown={onKey}>
      <div className={st.stage} role="region" aria-label={`Presentation, chapter ${idx + 1} of ${CHAPTERS.length}: ${chapter.title}`}>
        <div className={st.lines} aria-hidden="true" />
        <span className={st.chapterTag}>{String(idx + 1).padStart(2, "0")} · {chapter.title}</span>
        <div key={chapter.id} className={st.scene}>
          <Scene chapter={chapter} t={t} />
        </div>
        {!playing && time === 0 && (
          <button type="button" className={st.bigPlay} onClick={() => setPlaying(true)} aria-label="Play the presentation">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 6l13 8-13 8z" fill="currentColor" /></svg>
            <span>Play · 10 min</span>
          </button>
        )}
        <p className={st.caption} aria-live="polite">{caption.text}</p>
      </div>

      <div className={st.controls}>
        <button type="button" className={st.ctl} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zM10 3h3v12h-3z" fill="currentColor" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3l10 6-10 6z" fill="currentColor" /></svg>
          )}
        </button>
        <span className={st.time}>{clock(time)} / {clock(TOTAL_SECONDS)}</span>
        <input
          className={st.seek}
          type="range"
          min={0}
          max={TOTAL_SECONDS}
          step={1}
          value={Math.floor(time)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          style={{ ["--p" as string]: `${(time / TOTAL_SECONDS) * 100}%` }}
        />
        <label className={st.voice}>
          <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} aria-label="Voice-over" />
          Voice
        </label>
        <button type="button" className={st.ctl} onClick={fullscreen} aria-label="Full screen">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" /></svg>
        </button>
      </div>

      <ol className={st.chapters} aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button type="button" className={`${st.chap} ${i === idx ? st.chapOn : ""}`} onClick={() => seek(STARTS[i])} aria-current={i === idx ? "step" : undefined}>
              <span className={st.chapN}>{String(i + 1).padStart(2, "0")}</span>
              <span>{c.title}</span>
              <span className={st.chapT}>{clock(STARTS[i])}</span>
            </button>
          </li>
        ))}
      </ol>

      <details className={st.transcript}>
        <summary>Read the full transcript</summary>
        {CHAPTERS.map((c, i) => (
          <section key={c.id}>
            <h3>{String(i + 1).padStart(2, "0")} · {c.title}</h3>
            <p>{c.captions.map((x) => x.text).join(" ")}</p>
          </section>
        ))}
      </details>
    </div>
  );
}
