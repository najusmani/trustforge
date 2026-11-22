"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { db } from "@/db";
import { type Role, teamInvites, teamMembers, teams, users } from "@/db/schema";
import { buttonEmail, sendEmail } from "@/lib/email";
import { canManage, getMembership, requireUser, seatsUsed } from "@/lib/teams";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_DAYS = 7;

function back(path: string, kind: "error" | "notice", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  if (await getMembership(user.id)) redirect("/app");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) back("/app", "error", "Team name must be 2 to 80 characters.");

  const [team] = await db.insert(teams).values({ name, seats: 1 }).returning();
  await db.insert(teamMembers).values({ teamId: team.id, userId: user.id, role: "owner" });
  redirect("/app");
}

export async function inviteMember(formData: FormData) {
  const user = await requireUser("/app/team");
  const m = await getMembership(user.id);
  if (!m || !canManage(m.role)) back("/app/team", "error", "Only owners and admins can invite.");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as Role;
  if (!EMAIL_RE.test(email) || email.length > 200) back("/app/team", "error", "Enter a valid email address.");
  if (role !== "member" && role !== "admin") back("/app/team", "error", "Invalid role.");
  if (role === "admin" && m.role !== "owner") back("/app/team", "error", "Only the owner can invite admins.");

  const already = await db
    .select({ id: users.id })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(and(eq(teamMembers.teamId, m.team.id), sql`lower(${users.email}) = ${email}`))
    .limit(1);
  if (already.length) back("/app/team", "error", `${email} is already on the team.`);

  // A new invite to the same address replaces the old one.
  await db
    .delete(teamInvites)
    .where(and(eq(teamInvites.teamId, m.team.id), eq(teamInvites.email, email), isNull(teamInvites.acceptedAt)));

  if ((await seatsUsed(m.team.id)) >= m.team.seats) {
    back("/app/team", "error", `All ${m.team.seats} seat(s) are in use. Add seats before inviting.`);
  }

  const token = randomBytes(32).toString("base64url");
  await db.insert(teamInvites).values({
    teamId: m.team.id,
    email,
    role,
    token,
    invitedBy: user.id,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
  });

  const url = `${await siteOrigin()}/invite/${token}`;
  const inviter = user.name || user.email;
  const { html, text } = buttonEmail({
    heading: `Join ${m.team.name} on TrustForge`,
    body: `${inviter} invited you to their TrustForge team. Accept with this email address: ${email}.`,
    button: "Accept invite",
    url,
    footer: `This invite expires in ${INVITE_DAYS} days. If you weren’t expecting it, you can ignore this email.`,
  });
  try {
    await sendEmail({ to: email, subject: `You’re invited to ${m.team.name} on TrustForge`, html, text, replyTo: user.email });
  } catch (err) {
    console.error("[invite] email failed", err);
    back("/app/team", "error", "The invite was saved but the email could not be sent. Copy the link and send it yourself.");
  }
  back("/app/team", "notice", `Invite sent to ${email}.`);
}

export async function revokeInvite(formData: FormData) {
  const user = await requireUser("/app/team");
  const m = await getMembership(user.id);
  if (!m || !canManage(m.role)) back("/app/team", "error", "Only owners and admins can revoke invites.");
  const id = String(formData.get("inviteId") ?? "");
  await db.delete(teamInvites).where(and(eq(teamInvites.id, id), eq(teamInvites.teamId, m.team.id)));
  back("/app/team", "notice", "Invite revoked.");
}

export async function removeMember(formData: FormData) {
  const user = await requireUser("/app/team");
  const m = await getMembership(user.id);
  if (!m || !canManage(m.role)) back("/app/team", "error", "Only owners and admins can remove people.");
  const targetId = String(formData.get("userId") ?? "");
  if (targetId === user.id) back("/app/team", "error", "Use “Leave team” to remove yourself.");

  const [target] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, m.team.id), eq(teamMembers.userId, targetId)));
  if (!target) back("/app/team", "error", "That person is not on the team.");
  if (target.role === "owner") back("/app/team", "error", "The owner can’t be removed.");
  if (target.role === "admin" && m.role !== "owner") back("/app/team", "error", "Only the owner can remove admins.");

  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, m.team.id), eq(teamMembers.userId, targetId)));
  back("/app/team", "notice", "Removed from the team.");
}

export async function leaveTeam() {
  const user = await requireUser("/app/team");
  const m = await getMembership(user.id);
  if (!m) redirect("/app");
  if (m.role === "owner") back("/app/team", "error", "The owner can’t leave the team.");
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, m.team.id), eq(teamMembers.userId, user.id)));
  redirect("/app");
}

/** Until billing is connected, the owner sets the seat count by hand. */
export async function setSeats(formData: FormData) {
  const user = await requireUser("/app/team");
  const m = await getMembership(user.id);
  if (!m || m.role !== "owner") back("/app/team", "error", "Only the owner can change seats.");
  const seats = Number(formData.get("seats"));
  if (!Number.isInteger(seats) || seats < 1 || seats > 100) back("/app/team", "error", "Seats must be 1 to 100.");
  const used = await seatsUsed(m.team.id);
  if (seats < used) back("/app/team", "error", `${used} seat(s) are in use. Remove people or invites first.`);
  await db.update(teams).set({ seats }).where(eq(teams.id, m.team.id));
  back("/app/team", "notice", `Seats set to ${seats}.`);
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const path = `/invite/${encodeURIComponent(token)}`;
  const user = await requireUser(path);

  const [invite] = await db.select().from(teamInvites).where(eq(teamInvites.token, token));
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) back(path, "error", "This invite is no longer valid.");
  if (invite.email !== user.email) {
    back(path, "error", `This invite is for ${invite.email}. Sign in with that address to accept it.`);
  }
  if (await getMembership(user.id)) back(path, "error", "You’re already on a team. Leave it first to join another.");

  await db.insert(teamMembers).values({ teamId: invite.teamId, userId: user.id, role: invite.role });
  await db.update(teamInvites).set({ acceptedAt: new Date() }).where(eq(teamInvites.id, invite.id));
  redirect("/app");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
