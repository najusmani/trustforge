import "server-only";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { type Role, teamInvites, teamMembers, teams, users } from "@/db/schema";

export type CurrentUser = { id: string; email: string; name: string | null };

/** The signed-in user, or a redirect to sign-in that returns to `returnTo`. */
export async function requireUser(returnTo = "/app"): Promise<CurrentUser> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`);
  return { id, email: email.toLowerCase(), name: session.user?.name ?? null };
}

/** The user's team and role. One team per user for now. */
export async function getMembership(userId: string) {
  const rows = await db
    .select({ team: teams, role: teamMembers.role })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .orderBy(asc(teamMembers.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMembers(teamId: string) {
  return db
    .select({ userId: users.id, email: users.email, name: users.name, role: teamMembers.role, joined: teamMembers.createdAt })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(asc(teamMembers.createdAt));
}

export async function listPendingInvites(teamId: string) {
  return db
    .select()
    .from(teamInvites)
    .where(and(eq(teamInvites.teamId, teamId), isNull(teamInvites.acceptedAt), gt(teamInvites.expiresAt, new Date())))
    .orderBy(asc(teamInvites.createdAt));
}

/** Seats in use = members + invites still waiting. */
export async function seatsUsed(teamId: string): Promise<number> {
  const [m] = await db.select({ n: sql<number>`count(*)::int` }).from(teamMembers).where(eq(teamMembers.teamId, teamId));
  const [i] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(teamInvites)
    .where(and(eq(teamInvites.teamId, teamId), isNull(teamInvites.acceptedAt), gt(teamInvites.expiresAt, new Date())));
  return Number(m?.n ?? 0) + Number(i?.n ?? 0);
}

export function canManage(role: Role): boolean {
  return role === "owner" || role === "admin";
}

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", member: "Member" };
