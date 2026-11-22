import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LEGAL } from "@/lib/legal";

/** Shared layout for the Terms, Privacy and Refund pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap legal">
          <span className="eyebrow">Legal</span>
          <h1>{title}</h1>
          <p className="lead">{intro}</p>
          <p className="legal-meta">Effective {LEGAL.effective}</p>
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
