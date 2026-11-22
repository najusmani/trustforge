# TrustForge website

Public website for TrustForge (TrustRoute Technologies): home page, early-access sign-up, terms and privacy.
Built with Next.js 15 (App Router), React 19 and TypeScript. The design follows the "forge" mock
(`../marketing/website/project/Home.dc.html`).

## Pages
| Path | What it is |
|---|---|
| `/` | Home page |
| `/early-access` | Sign-up form (`?plan=free`, `partner` or `private` preselects a plan) |
| `/api/early-access` | Receives the form and emails it through Resend |
| `/terms`, `/privacy` | Placeholders until legal counsel provides the texts |

## Run on this PC
```
npm install
npm run dev
```
Open http://localhost:3000. Without email settings, sign-ups are printed in the terminal.

## Settings
Copy `.env.example` to `.env.local` and fill it in. In production, set the same names in the hosting
provider. Without them, the sign-up form refuses requests in production rather than losing them.

## Deploy (Vercel)
1. Push this folder to a GitHub repository.
2. In Vercel: Add New > Project > import the repository. Framework preset: Next.js. No build settings to change.
3. Add the environment variables from `.env.example`.
4. Domains: add `trustforge.trustroutetechnologies.com`. In GoDaddy (My Products > trustroutetechnologies.com >
   DNS), add a CNAME record named `trustforge` with the value Vercel shows. Leave the existing `@`, MX and TXT
   records alone.

## Not built yet
The product itself (sign-in, jobs, chat with TrustForge, billing). See `../HANDOFF.md`.
