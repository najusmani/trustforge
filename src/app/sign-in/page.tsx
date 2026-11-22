import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Arrow } from "@/components/Logo";
import { requestSignIn } from "./actions";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to TrustForge with a one-time email link.", alternates: { canonical: "/sign-in" }, robots: { index: false, follow: true } };

const ERRORS: Record<string, string> = {
  InvalidEmail: "Please enter a valid email address.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  Configuration: "Sign-in isn’t available right now. Please try again shortly.",
  AccessDenied: "You don’t have access. Please contact your team owner.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const target = callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/app";

  const session = await auth();
  if (session?.user) redirect(target);

  const message = error ? (ERRORS[error] ?? "Something went wrong. Please try again.") : null;

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <span className="eyebrow enter d1">Sign in</span>
          <h1 className="enter d2">
            Welcome to <em className="ember">TrustForge</em>.
          </h1>
          <p className="lead enter d3">
            Enter your work email. We’ll send you a link to sign in, with no password to remember. New here? The same
            link creates your account.
          </p>
          <form action={requestSignIn} className="card form enter d4">
            {message && (
              <p className="form-msg err" role="alert" style={{ margin: 0 }}>
                {message}
              </p>
            )}
            <input type="hidden" name="callbackUrl" value={target} />
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input className="input" id="email" name="email" type="email" autoComplete="email" required maxLength={200} autoFocus />
            </div>
            <button className="btn btn-primary" type="submit">
              Email me a sign-in link <Arrow />
            </button>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
              By signing in you agree to our <a href="/terms">terms</a> and <a href="/privacy">privacy notice</a>.
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
