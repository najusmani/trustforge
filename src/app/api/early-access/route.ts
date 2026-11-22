import { NextResponse } from "next/server";

/**
 * Early-access sign-ups.
 *
 * When RESEND_API_KEY and EARLY_ACCESS_TO are set, each sign-up is emailed to EARLY_ACCESS_TO
 * through Resend (https://resend.com). EARLY_ACCESS_FROM must be an address on a domain verified
 * in Resend. Without them, sign-ups are only logged in development and refused in production,
 * so nothing is silently lost.
 */

const PLANS = new Set(["free", "partner", "private"]);
const RELEASES = new Set(["14.7", "14.6", "Both"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Spam trap: the hidden "website" field is only filled by bots.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const signup = {
    name: clean(body.name, 120),
    email: clean(body.email, 200),
    company: clean(body.company, 200),
    plan: clean(body.plan, 20),
    release: clean(body.release, 10),
    seats: clean(body.seats, 6),
    notes: clean(body.notes, 2000),
  };

  if (!signup.name || !signup.company) {
    return NextResponse.json({ error: "Please fill in your name and company." }, { status: 400 });
  }
  if (!EMAIL_RE.test(signup.email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!PLANS.has(signup.plan) || !RELEASES.has(signup.release)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EARLY_ACCESS_TO;
  const from = process.env.EARLY_ACCESS_FROM;

  if (!apiKey || !to || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[early-access] email not configured; sign-up received:", signup);
      return NextResponse.json({ ok: true });
    }
    console.error("[early-access] RESEND_API_KEY, EARLY_ACCESS_TO or EARLY_ACCESS_FROM is not set");
    return NextResponse.json(
      { error: "Sign-ups are not open yet. Please try again soon." },
      { status: 503 },
    );
  }

  const rows = Object.entries(signup)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${escapeHtml(v || "-")}</td></tr>`)
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: signup.email,
      subject: `TrustForge early access: ${signup.company} (${signup.plan})`,
      html: `<table>${rows}</table>`,
    }),
  });

  if (!res.ok) {
    console.error("[early-access] Resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "We couldn’t send your request. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
