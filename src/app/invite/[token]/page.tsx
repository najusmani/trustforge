import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { teamInvites, teams } from "@/db/schema";
import { Flash } from "@/components/Flash";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Arrow } from "@/components/Logo";
import { acceptInvite } from "@/app/app/actions";

export const metadata: Metadata = { title: "Team invite", robots: { index: false } };

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const [row] = await db
    .select({ invite: teamInvites, teamName: teams.name })
    .from(teamInvites)
    .innerJoin(teams, eq(teams.id, teamInvites.teamId))
    .where(eq(teamInvites.token, token));

  const valid = row && !row.invite.acceptedAt && row.invite.expiresAt > new Date();
  const session = await auth();
  const here = `/invite/${encodeURIComponent(token)}`;

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 560 }}>
          <span className="eyebrow enter d1">Team invite</span>
          {!valid ? (
            <>
              <h1 className="enter d2">This invite has expired.</h1>
              <p className="lead enter d3">
                It may have been used already, revoked or be more than 7 days old. Ask your team owner to send a new
                one.
              </p>
            </>
          ) : (
            <>
              <h1 className="enter d2">
                Join <em className="ember">{row.teamName}</em>.
              </h1>
              <p className="lead enter d3">
                You’ve been invited to TrustForge as {row.invite.role === "admin" ? "an admin" : "a member"}. The invite
                is for <strong className="mono">{row.invite.email}</strong>.
              </p>
              <Flash error={error} />
              {session?.user ? (
                <form action={acceptInvite} className="enter d4">
                  <input type="hidden" name="token" value={token} />
                  <button type="submit" className="btn btn-primary">
                    Accept and join <Arrow />
                  </button>
                </form>
              ) : (
                <Link className="btn btn-primary enter d4" href={`/sign-in?callbackUrl=${encodeURIComponent(here)}`}>
                  Sign in to accept <Arrow />
                </Link>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
