# TrustForge website

Website and workspace for TrustForge (TrustRoute Technologies): home page, early-access sign-up, sign-in,
teams, terms and privacy. Built with Next.js 15 (App Router), React 19, TypeScript, Auth.js v5 and Drizzle ORM
on Postgres. The design follows the "forge" mock (`../marketing/website/project/Home.dc.html`).

## Pages
| Path | What it is |
|---|---|
| `/` | Home page |
| `/early-access` | Sign-up form (`?plan=free`, `partner` or `private` preselects a plan) |
| `/api/early-access` | Receives the form and emails it through Resend |
| `/sign-in` | Email-link sign-in (no passwords). The same link creates an account |
| `/app` | Workspace home: create a team, then the jobs area (job workspace not built yet) |
| `/app/team` | People, roles (owner, admin, member), invites, seats |
| `/invite/<token>` | Accept a team invite (must be signed in with the invited email) |
| `/app/jobs/new` | Start a job: job type, requirement, files, release, layer, release code |
| `/app/jobs/<id>` | The job: conversation with TrustForge, approvals, results to download, replies, stop, delete |
| `/admin` | For `ADMIN_EMAILS` only: set up the agents, switch teams between Free and Partner |

## How jobs run
- Each job is a Claude Managed Agents session (beta) on Anthropic: Anthropic runs the conversation and a sandbox
  where the TrustForge skill's Python scripts run. The site only stores the job, its file list and question counts.
- The skill is `agent/skill/trustforge` (a copy of the plugin's skills and reference). After changing it, open
  `/admin` and click "Update agents and skill".
- Plans (`src/lib/plans.ts`): Free = Claude Haiku 5.5, 5 questions per team per calendar month, radxml review and
  ODT questions only, $1 spending cap per job. Partner = Claude Opus 5.5 at medium effort, all job types, no
  question limit, $25 cap per job. Each message sent to TrustForge counts as one question.
- Uploads: 20 files and 4 MB per send (Vercel's request limit). Files go to Anthropic's Files API.
- Deleting a job deletes its session (conversation and sandbox) and every file uploaded or produced.
| `/terms`, `/privacy` | Placeholders until legal counsel provides the texts |

## Teams and seats
- Every user belongs to one team. The person who creates it is the owner.
- Owners and admins invite by email; only the owner can invite or remove admins and change seats.
- Each member and each waiting invite uses a seat. Invites expire after 7 days.
- Until Stripe billing is connected, the owner sets the seat count on the Team page.

## Run on this PC
```
npm install
npm run dev
```
Open http://localhost:3000. With no `DATABASE_URL`, an embedded Postgres in `./.data/pglite` is created
and migrated automatically. Without email settings, sign-in links, invites and sign-ups are printed in the
terminal instead of being sent. `.env.local` needs `AUTH_SECRET` (`npx auth secret` writes one).
If the dev server is killed abruptly the local database can be left damaged (`npm run dev` fails with
`Failed query: CREATE SCHEMA ... Aborted()`); delete `./.data/pglite` (test data only) and start again.

## Database
- Schema: `src/db/schema.ts`. After changing it: `npm run db:generate` (writes SQL to `./drizzle`).
- `npm run dev` and `npm run build` apply pending migrations first (`scripts/migrate.mjs`).

## Settings
See `.env.example`. In production set them in the hosting provider:
`AUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM` (or `EARLY_ACCESS_FROM`), `EARLY_ACCESS_TO`,
`ANTHROPIC_API_KEY`, `ADMIN_EMAILS`.
Without `DATABASE_URL` the public pages still work, but sign-in and the workspace don't.

## Deploy (Vercel)
1. Push to GitHub (`najusmani/trustforge`, branch `main`); Vercel deploys every push.
2. Settings > Environment Variables: the names above, for Production.
3. Domains: `forge.trustroutetechnologies.com`. In GoDaddy (My Products > trustroutetechnologies.com > DNS),
   add a CNAME record named `forge` with the value Vercel shows. Leave the existing `@`, MX and TXT records alone.

## Not built yet
Stripe billing (plans and seats are set by hand on `/admin` and the Team page for now). See `../HANDOFF.md`.
