import Link from "next/link";
import { ARTICLES } from "@/lib/learn";
import { SITE } from "@/lib/site";
import { LogoMark } from "./Logo";

export function Brand({ sub = true }: { sub?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="TrustForge home">
      <LogoMark size={36} />
      <span className="brand-text">
        <span className="brand-name">TrustForge</span>
        {sub && <span className="brand-sub">TrustRoute Technologies</span>}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Main" className="wrap site-nav">
        <Brand />
        <div className="nav-links">
          <Link className="nav-link hide-sm" href="/#how">How it works</Link>
          <Link className="nav-link hide-sm" href="/learn">Learn</Link>
          <Link className="nav-link" href="/#plans">Plans</Link>
          <Link className="nav-link strong" href="/sign-in">Sign in</Link>
          <Link className="btn" href="/app">Start a job</Link>
        </div>
      </nav>
    </header>
  );
}

function FooterExt({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <span className="brand-name">TrustForge</span>
          <span>
            AI for <FooterExt href={SITE.oracleUrl}>Oracle</FooterExt> FLEXCUBE customization and ODT development, built on{" "}
            <FooterExt href={SITE.anthropicUrl}>Anthropic</FooterExt>. A product of{" "}
            <a href={SITE.companyUrl}>{SITE.companyLegal}</a>, {SITE.locality}, {SITE.region}, Canada. ©{" "}
            {new Date().getFullYear()}.
          </span>
          <span className="footer-small">
            FLEXCUBE and Oracle Banking Payments are products of{" "}
            <FooterExt href={SITE.oracleFsUrl}>Oracle Financial Services</FooterExt>. Oracle and FLEXCUBE are registered
            trademarks of Oracle and/or its affiliates; Anthropic is a trademark of Anthropic, PBC. TrustForge is not
            affiliated with or endorsed by Oracle or Anthropic.
          </span>
        </div>
        <div className="footer-cols">
          <nav aria-label="Learn" className="footer-col">
            <span className="footer-col-h">Learn FLEXCUBE</span>
            {ARTICLES.slice(0, 5).map((a) => (
              <Link key={a.slug} href={`/learn/${a.slug}`}>{a.short}</Link>
            ))}
            <Link href="/learn">All guides</Link>
          </nav>
          <nav aria-label="Product" className="footer-col">
            <span className="footer-col-h">TrustForge</span>
            <Link href="/#how">How it works</Link>
            <Link href="/#plans">Plans</Link>
            <Link href="/#faq">Questions</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
          <nav aria-label="Company" className="footer-col">
            <span className="footer-col-h">Company</span>
            <a href={SITE.companyUrl}>{SITE.company}</a>
            <a href={SITE.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={`mailto:${SITE.email}`}>Contact</a>
          </nav>
          <nav aria-label="Legal" className="footer-col">
            <span className="footer-col-h">Legal</span>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refunds">Refunds</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
