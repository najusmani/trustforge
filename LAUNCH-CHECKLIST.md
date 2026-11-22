# TrustForge: what is needed to go live

## Phase 1: public website (built, in this folder)
Needed from you:
1. **Domain: decided (2026-11-22)** `trustforge.trustroutetechnologies.com`. The domain is at GoDaddy; add one
   CNAME record named `trustforge` with the value Vercel shows (subdomains are free).
2. **GitHub account** (free) and a private repository for this folder, e.g. `trustroute/trustforge-web`.
3. **Vercel account.** Sign in to vercel.com with GitHub and import the repository. Vercel's free Hobby plan
   is for non-commercial use, so a business site needs a paid plan; check the current price on vercel.com.
   Any Node.js host (Azure, AWS, your own server) also works.
4. **Resend: done (2026-11-22).** Domain verified, settings in Vercel, test sign-up accepted.
5. **Legal review** before launch: terms of service, privacy notice, the Oracle/FLEXCUBE trademark notice,
   use of content derived from Oracle's ODT guides, and the safety promises on the home page.
6. **Confirm content:** $500 USD per seat per month (monthly?), the Free tier limits, the two case studies
   (STDCURSK, IFDATMMN) can be named publicly with your bank's agreement.

## Phase 2: the product (not built yet)
Decisions and accounts needed:
1. **Model account:** an Anthropic API key from console.anthropic.com (or AWS Bedrock / Google Vertex for
   private installs). Not a personal Claude subscription.
2. **Sign-in:** provider for user accounts and team seats (e.g. Clerk or Auth0), or Microsoft Entra ID for banks.
3. **Payments:** Stripe account for $500/seat/month subscriptions, with your company and bank details.
4. **Storage and database:** where uploaded radxml/packages and job history live (e.g. Postgres plus
   S3-compatible storage), and in which region (data residency for banks).
5. **Data handling:** how long uploads are kept, who can see them, and what you promise banks in contracts.
6. **Test environment:** a FLEXCUBE 14.6 environment if 14.6 is to be verified (only 14.7.0.6.0 is verified).
