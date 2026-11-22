import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Main" className="wrap site-nav">
        <Link href="/" className="brand">
          <LogoMark />
          <span className="brand-name">TrustForge</span>
        </Link>
        <div className="nav-links">
          <Link className="nav-link hide-sm" href="/#how">How it works</Link>
          <Link className="nav-link hide-sm" href="/#build">What you can build</Link>
          <Link className="nav-link hide-sm" href="/#safety">Safety</Link>
          <Link className="nav-link" href="/#plans">Plans</Link>
          <Link className="nav-link strong" href="/sign-in">Sign in</Link>
          <Link className="btn btn-solid btn-sm" href="/app">Start a job</Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <span className="brand-name">TrustForge</span>
          <span style={{ fontSize: 14, color: "var(--text-3)" }}>
            A product of <a href="https://trustroutetechnologies.com">TrustRoute Technologies</a>. © {new Date().getFullYear()}.
          </span>
          <span className="footer-small">
            Oracle and FLEXCUBE are registered trademarks of Oracle and/or its affiliates. TrustForge is not affiliated
            with or endorsed by Oracle.
          </span>
        </div>
        <nav aria-label="Footer" className="footer-links">
          <Link className="nav-link" href="/#how">How it works</Link>
          <Link className="nav-link" href="/#safety">Safety</Link>
          <Link className="nav-link" href="/#plans">Plans</Link>
          <Link className="nav-link" href="/terms">Terms</Link>
          <Link className="nav-link" href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
