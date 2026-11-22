import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { getMembership, requireUser } from "@/lib/teams";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · TrustForge" },
  robots: { index: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/app");
  const membership = await getMembership(user.id);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/app" className="brand">
            <LogoMark size={30} />
            <span className="brand-name" style={{ fontSize: 19 }}>TrustForge</span>
          </Link>
          {membership && (
            <nav aria-label="Workspace" className="app-nav">
              <Link className="nav-link" href="/app">Jobs</Link>
              <Link className="nav-link" href="/app/team">Team</Link>
            </nav>
          )}
          <div className="app-user">
            {membership && <span className="app-team mono">{membership.team.name}</span>}
            <span className="app-email">{user.email}</span>
            <form action={signOutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
