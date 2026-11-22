import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Arrow } from "@/components/Logo";

export const metadata: Metadata = { title: "Confirm sign-in", robots: { index: false } };

/**
 * Sign-in emails link here instead of straight to the one-time callback.
 * Email security scanners (e.g. Outlook Safe Links) open links to check them, and some also open the links
 * on that page. So this page has no link to the callback: the browser submits a form to it, which only
 * happens when a person presses the button.
 */
export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  let fields: [string, string][] | null = null;
  try {
    const u = new URL(link ?? "");
    if (u.host === host && u.pathname === "/api/auth/callback/resend" && u.searchParams.get("token")) {
      fields = [...u.searchParams.entries()];
    }
  } catch {
    fields = null;
  }

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <span className="eyebrow enter d1">Sign in</span>
          {fields ? (
            <>
              <h1 className="enter d2">
                One click to <em className="ember">sign in</em>.
              </h1>
              <p className="lead enter d3">Press the button to finish signing in to TrustForge on this device.</p>
              <form method="get" action="/api/auth/callback/resend" className="enter d4">
                {fields.map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <button type="submit" className="btn btn-primary">
                  Sign in to TrustForge <Arrow />
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="enter d2">This link isn’t valid.</h1>
              <p className="lead enter d3">
                It may be incomplete. <Link href="/sign-in">Request a new sign-in link</Link>.
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
