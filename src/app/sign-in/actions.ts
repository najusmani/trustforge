"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only same-site paths, never "//other.site" or absolute URLs. */
function safePath(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/app";
}

export async function requestSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const callbackUrl = safePath(formData.get("callbackUrl"));
  if (!EMAIL_RE.test(email) || email.length > 200) {
    redirect(`/sign-in?error=InvalidEmail&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  // Sends the email link, then redirects to /sign-in/check-email.
  await signIn("resend", { email, redirectTo: callbackUrl });
}
