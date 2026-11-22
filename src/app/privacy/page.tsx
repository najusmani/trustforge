import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap">
          <span className="eyebrow">Legal</span>
          <h1>Privacy notice</h1>
          <p className="notice">
            Our full privacy notice is being prepared with legal counsel and will be published here before TrustForge
            opens for general use.
          </p>
          <p className="lead">
            Until then: if you request early access, we use your name, email, company and the details you give us only
            to contact you about TrustForge. We don’t sell them or share them for marketing. To have them deleted,
            contact <a href="https://trustroutetechnologies.com">TrustRoute Technologies</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
