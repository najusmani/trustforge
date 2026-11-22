import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { buttonEmail, sendEmail } from "@/lib/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
    error: "/sign-in",
  },
  providers: [
    Resend({
      // The key is only used by our own sender below.
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM || process.env.EARLY_ACCESS_FROM,
      maxAge: 15 * 60, // sign-in links expire after 15 minutes
      async sendVerificationRequest({ identifier, url }) {
        const { html, text } = buttonEmail({
          heading: "Sign in to TrustForge",
          body: "Click the button to sign in. The link works once and expires in 15 minutes.",
          button: "Sign in",
          url,
          footer: "If you didn’t ask to sign in, you can ignore this email.",
        });
        await sendEmail({ to: identifier, subject: "Your TrustForge sign-in link", html, text });
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
