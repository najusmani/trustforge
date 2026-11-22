import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Arrow } from "@/components/Logo";

export const metadata: Metadata = { title: "Confirm sign-in", robots: { index: false } };

/**
 * Sign-in emails link here instead of straight to the one-time callback.
 * Email security scanners (e.g. Outlook Safe Links) open links to check them; if the email linked to the
 * callback directly, the scan would use up the one-time token. Scanners don't click buttons, people do.
 */
export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  let target: string | null = null;
  try {
    const u = new URL(link ?? "");
    // Only our own sign-in callback, on this site.
    if (u.host === host && u.pathname === "/api/auth/callback/resend" && u.searchParams.get("token")) {
      target = u.pathname + u.search;
    }
  } catch {
    target = null;
  }

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <span className="eyebrow enter d1">Sign in</span>
          {target ? (
            <>
              <h1 className="enter d2">
                One click to <em className="ember">sign in</em>.
              </h1>
              <p className="lead enter d3">Press the button to finish signing in to TrustForge on this device.</p>
              <a className="btn btn-primary enter d4" href={target} rel="nofollow">
                Sign in to TrustForge <Arrow />
              </a>
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
