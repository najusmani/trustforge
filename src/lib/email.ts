import "server-only";

/**
 * Sends email through Resend's HTTP API.
 * Without RESEND_API_KEY outside production, the email is printed to the server log instead,
 * so sign-in links and invites can be tested on this PC.
 */

export const SENDER = process.env.AUTH_EMAIL_FROM || process.env.EARLY_ACCESS_FROM || "";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  from?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = msg.from || SENDER;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email] (not sent, email not configured)\nTo: ${msg.to}\nSubject: ${msg.subject}\n${msg.text}\n`);
      return;
    }
    throw new Error("Email is not configured: set RESEND_API_KEY and AUTH_EMAIL_FROM.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

/** Branded, plain email with one button. */
export function buttonEmail(opts: { heading: string; body: string; button: string; url: string; footer: string }) {
  const html = `<!doctype html><html><body style="margin:0;background:#0b0f14;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#ede8e0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#121821;border:1px solid #222b36;border-radius:14px" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px">
<p style="margin:0 0 20px;font-size:20px;font-weight:bold;color:#ede8e0">TrustForge</p>
<h1 style="margin:0 0 12px;font-size:22px;color:#ede8e0">${escapeHtml(opts.heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3acb7">${escapeHtml(opts.body)}</p>
<a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#ff8a3d;color:#1a0e05;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:10px">${escapeHtml(opts.button)}</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8c96a2">${escapeHtml(opts.footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${opts.heading}\n\n${opts.body}\n\n${opts.button}: ${opts.url}\n\n${opts.footer}`;
  return { html, text };
}
