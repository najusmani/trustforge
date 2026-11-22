import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/teams";

/** Admins are listed in ADMIN_EMAILS (comma separated). Everyone else gets a 404. */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
