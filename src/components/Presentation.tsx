"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS, estimatedSeconds, sentencesOf, VOICE, type Chapter } from "./presentation-script";
import st from "./presentation.module.css";

/* ---------- helpers ---------- */

function clock(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Reveal wrapper: visible once the chapter's progress `p` (0 to 1) passes `at`. */
function R({ p, at, className = "", children }: { p: number; at: number; className?: string; children: React.ReactNode }) {
  return <div className={`${st.rv} ${p >= at ? st.in : ""} ${className}`}>{children}</div>;
}

/** A number counting up between progress `from` and `to`. */
function count(p: number, from: number, to: number, target: number) {
  if (p <= from) return 0;
  return Math.round(Math.min(1, (p - from) / (to - from)) * target);
}

function typed(p: number, from: number, to: number, text: string) {
  return text.slice(0, Math.round(Math.max(0, Math.min(1, (p - from) / (to - from))) * text.length));
}

function Diamond({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={st.diamond}>
      <rect x="32" y="6" width="36.8" height="36.8" transform="rotate(45 32 6)" fill="none" stroke="#C9AE78" strokeWidth="1.5" />
      <path d="M21 24h22M32 24v17M26.5 35.5l5.5 5.5 5.5-5.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- scenes (p = progress through the chapter, 0 to 1) ---------- */

function Scene({ chapter, p, price, marks }: { chapter: Chapter; p: number; price: string; marks: { at: number; text: string }[] }) {
  /** Where the sentence starting with `word` begins (0 to 1), so a visual appears as the voice says it. */
  const said = (word: string, fallback: number) => marks.find((m) => m.text.startsWith(word))?.at ?? fallback;
  switch (chapter.id) {
    case "hook":
      return (
        <div className={st.center}>
          <R p={p} at={0.02}><p className={st.heading}>Your next FLEXCUBE customization</p></R>
          <div className={st.versus}>
            <R p={p} at={0.08} className={st.vsOld}>$100,000s</R>
            <R p={p} at={0.14} className={st.vsArrow}>→</R>
            <R p={p} at={0.18} className={st.vsNew}>$100s</R>
          </div>
          <R p={p} at={said("What if the first", 0.34)}><p className={st.sub}>First files in minutes, not weeks</p></R>
          <R p={p} at={said("Meet", 0.76)}><Diamond size={64} /></R>
          <R p={p} at={said("Meet", 0.8)}><p className={st.kicker}>TrustForge · AI agent for FLEXCUBE · Built on Anthropic</p></R>
        </div>
      );
    case "problem":
      return (
        <div className={st.grid3}>
          <R p={p} at={0.02} className={st.span3}><p className={st.heading}>Every FLEXCUBE change, the usual way</p></R>
          <R p={p} at={said("Through", 0.22)} className={st.stat}>
            <span className={st.big}>${count(p, said("Through", 0.22), said("Through", 0.22) + 0.1, 100)}k+</span>
            <span className={st.label}>per customization, through a partner</span>
          </R>
          <R p={p} at={said("Partners", 0.46)} className={st.stat}>
            <span className={st.big}>Teams</span>
            <span className={st.label}>of developers billed by the hour</span>
          </R>
          <R p={p} at={said("Weeks", 0.7)} className={st.stat}>
            <span className={st.big}>Weeks</span>
            <span className={st.label}>before the first file reaches ODT</span>
          </R>
        </div>
      );
    case "meet":
      return (
        <div className={st.center}>
          <R p={p} at={0.02}><Diamond size={72} /></R>
          <R p={p} at={0.06}><h3 className={st.title}>TrustForge</h3></R>
          <R p={p} at={0.14}><p className={st.kicker}>Built on Anthropic</p></R>
          <R p={p} at={0.3}><p className={st.sub}>A senior ODT developer, on demand</p></R>
          <R p={p} at={0.42} className={st.chipRow}>
            {["radxml", "Release layers", "Hook packages", "ODT rules", "Load · Save · Deploy"].map((x, i) => (
              <span key={x} className={`${st.chip} ${p >= 0.44 + i * 0.05 ? st.chipOn : ""}`}>{x}</span>
            ))}
          </R>
          <R p={p} at={0.86}><p className={st.sub}>For every developer, at any hour</p></R>
        </div>
      );
    case "how": {
      const steps = [
        ["i.", "Describe", said("First", 0.05)],
        ["ii.", "Discuss", said("Second", 0.32)],
        ["iii.", "Build", said("Third", 0.55)],
        ["iv.", "Deliver", said("Fourth", 0.8)],
      ] as const;
      const current = [...steps].reverse().find(([, , at]) => p >= at);
      const active = current?.[1];
      // progress within the active step (0 to 1), for the small demo under it
      const k = steps.findIndex((s) => s[1] === active);
      const s0 = current?.[2] ?? 0;
      const s1 = k >= 0 && k + 1 < steps.length ? steps[k + 1][2] : 1;
      const q = Math.max(0, Math.min(1, (p - s0) / Math.max(0.01, s1 - s0)));
      return (
        <div className={st.how}>
          <div className={st.loop}>
            {steps.map(([n, x, at]) => (
              <R key={x} p={p} at={at} className={`${st.step} ${active === x ? st.stepOn : ""}`}>
                <span className={st.stepN}>{n}</span>
                <span>{x}</span>
              </R>
            ))}
          </div>
          <div className={st.demo}>
            {active === "Describe" && (
              <>
                <div className={st.input}>
                  {typed(q, 0.05, 0.55, "Add a sixth charge to IFDATMMN, the same as charge five.")}
                  <span className={st.caret} />
                </div>
                <div className={st.files}>
                  {["IFDATMMN_RAD.xml", "Table DDL", "Packages"].map((f, i) => (
                    <span key={f} className={`${st.file} ${q >= 0.6 + i * 0.1 ? st.in2 : ""}`}>{f}</span>
                  ))}
                </div>
              </>
            )}
            {active === "Discuss" && (
              <div className={st.plan}>
                <span className={st.planH}>Plan</span>
                {["Extension table, 1:1", "radxml in the CUSTOM layer", "Hook package", "Release JavaScript", "Tests"].map((x, i) => (
                  <span key={x} className={`${st.planItem} ${q >= 0.15 + i * 0.1 ? st.in2 : ""}`}>{x}</span>
                ))}
                <span className={`${st.approve} ${q >= 0.75 ? st.approveOn : ""}`}>Approve plan</span>
              </div>
            )}
            {active === "Build" && (
              <div className={st.fileList}>
                {["radxml", "CUSTOM hook package", "Release JavaScript", "Scripts"].map((x, i) => (
                  <span key={x} className={st.fileRow}>
                    <span className={`${st.tick} ${q >= 0.2 + i * 0.15 ? st.tickOn : ""}`}>✓</span>
                    {x}
                  </span>
                ))}
                <span className={`${st.checked} ${q >= 0.8 ? st.in2 : ""}`}>Checked against ODT’s rules</span>
              </div>
            )}
            {active === "Deliver" && (
              <div className={st.fileList}>
                {["Files ready for ODT", "Deployment guide", "Unit tests"].map((x, i) => (
                  <span key={x} className={st.fileRow}>
                    <span className={`${st.tick} ${q >= 0.1 + i * 0.15 ? st.tickOn : ""}`}>↓</span>
                    {x}
                  </span>
                ))}
                <span className={`${st.checked} ${q >= 0.6 ? st.in2 : ""}`}>Your developers stay in control</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    case "results":
      return (
        <div className={st.grid2}>
          <R p={p} at={0.12} className={st.case}>
            <span className={st.caseId}>STDCURSK</span>
            <span className={st.caseT}>Customer risk profile screen</span>
            <span className={`${st.badge} ${p >= 0.3 ? st.in2 : ""}`}>Live in production</span>
          </R>
          <R p={p} at={said("On another", 0.42)} className={st.case}>
            <span className={st.caseId}>IFDATMMN</span>
            <span className={st.caseT}>Sixth charge on ARC maintenance</span>
            <span className={st.caseNums}>
              <span><strong>{count(p, 0.5, 0.62, 36)}</strong> fields added</span>
              <span><strong>{p >= 0.64 ? 0 : "–"}</strong> Oracle values changed</span>
            </span>
          </R>
          <R p={p} at={said("And every", 0.78)} className={st.span2}><p className={st.sub}>Every real deployment becomes a new check</p></R>
        </div>
      );
    case "offer":
      return (
        <div className={st.grid3}>
          {[
            ["New screens", "Maintenance · Online · Call & launch forms", 0.22],
            ["Customize Oracle functions", "Safely in the CUSTOM layer", 0.4],
            ["Hook code & JavaScript", "Validations · Processing", 0.52],
            ["Radxml review", "Before you load anything", 0.66],
            ["Silent ODT", "Bulk generation · Web services", 0.76],
            ["ODT answers", "Clear and immediate", 0.88],
          ].map(([t, d, at]) => (
            <R key={t as string} p={p} at={at as number} className={st.tile}>
              <strong>{t}</strong>
              <span>{d}</span>
            </R>
          ))}
        </div>
      );
    case "safety":
      return (
        <div className={st.grid2}>
          {[
            ["Oracle’s code is never edited", "Every change in your CUSTOM layer", 0.04],
            ["Nothing without approval", "You agree the plan first", 0.3],
            ["No secrets in files", "Passwords and keys stay with you", 0.42],
            ["Private by design", "A sandbox per job, or your own cloud", 0.56],
          ].map(([t, d, at]) => (
            <R key={t as string} p={p} at={at as number} className={st.tile}>
              <strong>{t}</strong>
              <span>{d}</span>
            </R>
          ))}
        </div>
      );
    case "savings": {
      const w0 = said("With TrustForge", 0.32);
      const shrink = p >= w0 ? Math.max(10, 100 - Math.min(1, (p - w0) / 0.14) * 90) : 100;
      return (
        <div className={st.list}>
          <R p={p} at={0.06} className={st.barRow}>
            <span className={st.barLabel}>The usual way</span>
            <span className={st.bar}><span className={st.barFill} style={{ width: "100%" }} /></span>
          </R>
          <R p={p} at={said("With TrustForge", 0.3)} className={st.barRow}>
            <span className={st.barLabel}>With TrustForge</span>
            <span className={st.bar}><span className={`${st.barFill} ${st.barGold}`} style={{ width: `${shrink}%` }} /></span>
          </R>
          <R p={p} at={said("For many", 0.5)} className={st.pctRow}>
            <span className={st.pct}>{count(p, said("For many", 0.5), said("For many", 0.5) + 0.1, 90)}%</span>
            <span className={st.label}>up to 90% lower development cost</span>
          </R>
          <R p={p} at={0.7}><p className={st.sub} style={{ textAlign: "left", margin: 0 }}>More changes, delivered faster, by the same people</p></R>
        </div>
      );
    }
    case "pricing":
      return (
        <div className={st.grid3}>
          <R p={p} at={0.1} className={st.plan3}>
            <span className={st.planName}>Free</span>
            <span className={st.planPrice}>$0</span>
            <span className={st.planD}>Radxml reviews and ODT questions</span>
          </R>
          <R p={p} at={said("When your team", 0.3)} className={`${st.plan3} ${st.planHot}`}>
            <span className={st.planName}>Partner</span>
            <span className={st.planPrice}>{price}</span>
            <span className={st.planD}>Per seat, per month · every job type · extra usage when you need it</span>
          </R>
          <R p={p} at={said("Or arrange", 0.86)} className={st.plan3}>
            <span className={st.planName}>Private install</span>
            <span className={st.planPrice} style={{ fontSize: "3cqw" }}>By arrangement</span>
            <span className={st.planD}>In your bank’s own cloud</span>
          </R>
        </div>
      );
    default:
      return (
        <div className={st.center}>
          <R p={p} at={0.02}><p className={st.heading}>Weeks become minutes.</p></R>
          <R p={p} at={said("Bring", 0.3)}><h3 className={`${st.title} ${st.titleSm}`}>TrustForge</h3></R>
          <R p={p} at={said("Start your", 0.5)}>
            <Link href="/app" className={st.cta}>Start your first job</Link>
          </R>
          <R p={p} at={said("Start your", 0.56)}><p className={st.url}>forge.trustroutetechnologies.com</p></R>
          <R p={p} at={said("FLEXCUBE customizations", 0.8)}><p className={st.kicker}>FLEXCUBE customizations, forged in conversation</p></R>
        </div>
      );
  }
}

/* ---------- player ---------- */

export function Presentation({ price }: { price: string }) {
  const hasVoice = Boolean(VOICE.src);
  const audio = useRef<HTMLAudioElement>(null);
  const [audioLen, setAudioLen] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);

  // chapter lengths: from the recording's chapter starts, or estimates scaled to the recording, or estimates
  const durations = useMemo(() => {
    const est = estimatedSeconds();
    if (audioLen && VOICE.chapterStarts?.length === CHAPTERS.length) {
      const s = VOICE.chapterStarts;
      return s.map((x, i) => (i + 1 < s.length ? s[i + 1] : audioLen) - x);
    }
    if (audioLen) {
      const sum = est.reduce((a, b) => a + b, 0);
      return est.map((d) => (d / sum) * audioLen);
    }
    return est;
  }, [audioLen]);
  const starts = useMemo(() => durations.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0 : acc[i - 1] + durations[i - 1]], []), [durations]);
  const total = starts[starts.length - 1] + durations[durations.length - 1];

  const idx = useMemo(() => {
    let i = 0;
    while (i + 1 < CHAPTERS.length && time >= starts[i + 1]) i++;
    return i;
  }, [time, starts]);
  const chapter = CHAPTERS[idx];
  const t = time - starts[idx];
  const p = Math.max(0, Math.min(1, t / durations[idx]));
  // Sentence timing: measured from the recording when available, else spread by word count.
  const measured = audioLen && VOICE.sentenceStarts?.[idx];
  const sentences = useMemo(() => {
    const base = sentencesOf(chapter.text);
    if (measured && measured.length === base.length) {
      return base.map((s, i) => ({ ...s, at: Math.max(0, (measured[i] - starts[idx]) / durations[idx]) }));
    }
    const speechShare = 0.96; // the pause after each chapter has no words
    return base.map((s) => ({ ...s, at: s.at * speechShare }));
  }, [chapter.text, measured, starts, durations, idx]);
  const caption = [...sentences].reverse().find((s) => p >= s.at) ?? sentences[0];

  // The recording's length may load before React attaches onLoadedMetadata: read it once on mount too.
  useEffect(() => {
    const a = audio.current;
    if (a && a.readyState >= 1 && Number.isFinite(a.duration)) setAudioLen(a.duration);
  }, []);

  // clock: follows the recording when there is one, otherwise a timer
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    const id = setInterval(() => {
      const a = audio.current;
      if (hasVoice && a) {
        setTime(a.currentTime);
        return;
      }
      const now = performance.now();
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((x) => {
        const n = x + dt;
        if (n >= total) {
          setPlaying(false);
          return total - 0.01;
        }
        return n;
      });
    }, 80);
    return () => clearInterval(id);
  }, [playing, hasVoice, total]);

  const play = useCallback(() => {
    const a = audio.current;
    if (hasVoice && a) {
      if (time >= total - 0.05) a.currentTime = 0;
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      if (time >= total - 0.05) setTime(0);
      setPlaying(true);
    }
  }, [hasVoice, time, total]);

  const pause = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
  }, []);

  const seek = useCallback(
    (s: number) => {
      const v = Math.max(0, Math.min(total - 0.01, s));
      if (audio.current && hasVoice) audio.current.currentTime = v;
      setTime(v);
    },
    [hasVoice, total],
  );

  function onKey(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      if (playing) pause();
      else play();
    } else if (e.key === "ArrowRight") seek(starts[Math.min(CHAPTERS.length - 1, idx + 1)]);
    else if (e.key === "ArrowLeft") seek(t > 2 ? starts[idx] : starts[Math.max(0, idx - 1)]);
  }

  function fullscreen() {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }

  return (
    <div className={st.player} ref={wrap} onKeyDown={onKey}>
      {hasVoice && (
        <audio
          ref={audio}
          src={VOICE.src}
          preload="metadata"
          muted={muted}
          onLoadedMetadata={(e) => setAudioLen(e.currentTarget.duration || null)}
          onEnded={() => setPlaying(false)}
        />
      )}
      <div className={st.stage} role="region" aria-label={`Presentation, chapter ${idx + 1} of ${CHAPTERS.length}: ${chapter.title}`}>
        <div className={st.lines} aria-hidden="true" />
        <span className={st.chapterTag}>{String(idx + 1).padStart(2, "0")} · {chapter.title}</span>
        <span className={st.siteTag}>forge.trustroutetechnologies.com</span>
        <div key={chapter.id} className={st.scene}>
          <Scene chapter={chapter} p={p} price={price} marks={sentences} />
        </div>
        {!playing && time === 0 && (
          <button type="button" className={st.bigPlay} onClick={play} aria-label="Play the presentation">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 6l13 8-13 8z" fill="currentColor" /></svg>
            <span>Play · {clock(total)}</span>
          </button>
        )}
        <p className={st.caption} aria-live="polite">{caption.text}</p>
      </div>

      <div className={st.controls}>
        <button type="button" className={st.ctl} onClick={playing ? pause : play} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zM10 3h3v12h-3z" fill="currentColor" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3l10 6-10 6z" fill="currentColor" /></svg>
          )}
        </button>
        <span className={st.time}>{clock(time)} / {clock(total)}</span>
        <input
          className={st.seek}
          type="range"
          min={0}
          max={Math.floor(total)}
          step={1}
          value={Math.floor(time)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          style={{ ["--p" as string]: `${(time / total) * 100}%` }}
        />
        {hasVoice && (
          <button type="button" className={st.ctl} onClick={() => setMuted((m) => !m)} aria-label={muted ? "Sound on" : "Mute"}>
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h3l4-3v10l-4-3H3zM12.5 7l4 4M16.5 7l-4 4" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h3l4-3v10l-4-3H3zM12.5 6.5a3.5 3.5 0 0 1 0 5M14.5 4.5a6.5 6.5 0 0 1 0 9" /></svg>
            )}
          </button>
        )}
        <button type="button" className={st.ctl} onClick={fullscreen} aria-label="Full screen">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" /></svg>
        </button>
      </div>

      <ol className={st.chapters} aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button type="button" className={`${st.chap} ${i === idx ? st.chapOn : ""}`} onClick={() => seek(starts[i])} aria-current={i === idx ? "step" : undefined}>
              <span className={st.chapN}>{String(i + 1).padStart(2, "0")}</span>
              <span>{c.title}</span>
              <span className={st.chapT}>{clock(starts[i])}</span>
            </button>
          </li>
        ))}
      </ol>

      <details className={st.transcript}>
        <summary>Read the transcript</summary>
        {CHAPTERS.map((c, i) => (
          <section key={c.id}>
            <h3>{String(i + 1).padStart(2, "0")} · {c.title}</h3>
            <p>{c.text}</p>
          </section>
        ))}
      </details>
    </div>
  );
}
