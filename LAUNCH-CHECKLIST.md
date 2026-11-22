# TrustForge: what is needed to go live

## Phase 1: public website (live)
1. **Domain: done.** Live at `trustforge.trustroutetechnologies.com` (GoDaddy CNAME -> Vercel).
   Moving to `forge.trustroutetechnologies.com` (decided 2026-11-22): add it in Vercel > Settings > Domains,
   add a GoDaddy CNAME named `forge`, then redirect the `trustforge` address to it.
2. **GitHub: done.** `najusmani/trustforge`, branch `main`.
3. **Vercel: deployed.** Still to decide: the free Hobby plan is for non-commercial use, so a business site
   needs a paid plan (check the current price on vercel.com), or move to a host whose free plan allows it.
4. **Resend: done (2026-11-22).** Domain verified, settings in Vercel, test sign-up accepted.
5. **Legal review** before launch: terms of service, privacy notice, the Oracle/FLEXCUBE trademark notice,
   use of content derived from Oracle's ODT guides, and the safety promises on the home page.
6. **Confirm content:** $500 USD per seat per month (monthly?), the Free tier limits, naming the two case
   studies (STDCURSK, IFDATMMN) publicly.

## Phase 2: the product
1. **Sign-in and teams: built (2026-11-22).** Email-link sign-in, teams with owner/admin/member roles,
   invites, seats. Needs in Vercel before it works live:
   - `DATABASE_URL`: a Postgres database. Easiest: Vercel > Storage > Create Database > Neon (free tier),
     connected to the project, which adds `DATABASE_URL` automatically.
   - `AUTH_SECRET`: a random secret (run `npx auth secret` and copy the value, or any 32+ random characters).
   - `AUTH_EMAIL_FROM` (optional): e.g. `TrustForge <signin@trustroutetechnologies.com>`; otherwise
     `EARLY_ACCESS_FROM` is used.
2. **Model account:** an Anthropic API key from console.anthropic.com (an individual account is fine to start;
   move to a company organization later by swapping the key). Not a claude.ai Pro/Max subscription.
3. **Payments:** Stripe account for $500/seat/month subscriptions, with your company and bank details.
4. **Storage:** where uploaded radxml/packages and job files live (S3-compatible storage), and in which region.
5. **Data handling:** how long uploads are kept, who can see them, and what you promise banks in contracts.
6. **Test environment:** a FLEXCUBE 14.6 environment if 14.6 is to be verified (only 14.7.0.6.0 is verified).
