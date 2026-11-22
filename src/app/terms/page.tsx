import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap">
          <span className="eyebrow">Legal</span>
          <h1>Terms of service</h1>
          <p className="notice">
            Our terms of service are being prepared with legal counsel and will be published here before TrustForge
            opens for paid use. Questions: contact{" "}
            <a href="https://trustroutetechnologies.com">TrustRoute Technologies</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
