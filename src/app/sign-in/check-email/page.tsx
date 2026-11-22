import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Check your email", robots: { index: false, follow: false } };

export default function CheckEmailPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 560 }}>
          <span className="eyebrow enter d1">Almost there</span>
          <h1 className="enter d2">
            Check your <em className="ember">email</em>.
          </h1>
          <p className="lead enter d3">
            We sent you a sign-in link. Open it on this device to continue. It works once and expires in 15 minutes.
          </p>
          <p className="enter d4" style={{ margin: 0, color: "var(--text-3)", fontSize: 15 }}>
            Nothing arrived? Check your spam folder, or <Link href="/sign-in">request a new link</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
