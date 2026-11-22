import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ---------- Auth.js tables (shape required by @auth/drizzle-adapter) ---------- */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ---------- Teams ---------- */

export const ROLES = ["owner", "admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export const PLANS = ["free", "partner"] as const;
export type Plan = (typeof PLANS)[number];

export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  /** Seats the team may fill (members + pending invites). Set by billing later; 1 = Free. */
  seats: integer("seats").notNull().default(1),
  /** free: smaller model, 5 questions a month, review + Q&A only. partner: everything. */
  plan: text("plan").$type<Plan>().notNull().default("free"),
  /* Paddle billing. Empty for Free teams and for Partner teams set by hand (contracts). */
  paddleCustomerId: text("paddle_customer_id"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  /** Paddle subscription status: active, trialing, past_due, paused, canceled. */
  subscriptionStatus: text("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  /** Paddle's updated_at of the last subscription event applied; older events are ignored. */
  billingUpdatedAt: timestamp("billing_updated_at", { mode: "date" }),
  /** Per-seat usage limits in US cents at list price; null = the plan default (src/lib/plans.ts). Set in Admin. */
  limitDailyCents: integer("limit_daily_cents"),
  limitWeeklyCents: integer("limit_weekly_cents"),
  limitMonthlyCents: integer("limit_monthly_cents"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const teamMembers = pgTable(
  "team_member",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<Role>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] }), index("team_member_user_idx").on(t.userId)],
);

export const teamInvites = pgTable(
  "team_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<Role>().notNull(),
    token: text("token").notNull(),
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
  },
  (t) => [uniqueIndex("team_invite_token_idx").on(t.token), index("team_invite_team_idx").on(t.teamId)],
);

/* ---------- App settings (e.g. agent IDs created by the admin setup) ---------- */

export const appSettings = pgTable("app_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/* ---------- Jobs ---------- */

export const JOB_TYPES = ["new_screen", "customize", "review", "hook", "silent", "ask"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const jobs = pgTable(
  "job",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    jobType: text("job_type").$type<JobType>().notNull(),
    release: text("release").notNull(),
    layer: text("layer").notNull(),
    patchVersion: text("patch_version").notNull(),
    /** Plan the job was started on: decides the agent (model) for the whole job. */
    plan: text("plan").$type<Plan>().notNull(),
    /** Managed Agents session id (sesn_...). */
    sessionId: text("session_id"),
    /** Member whose message (or approval) started the current turn: new cost is counted against them. */
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    /** Session list cost already written to usage_event, in US cents. */
    billedCents: integer("billed_cents").notNull().default(0),
    /** Spend ceiling currently set on the session, in US cents. */
    budgetCents: integer("budget_cents"),
    /** True while the session may still spend (a turn was started and its cost isn't fully counted yet). */
    costOpen: integer("cost_open").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("job_team_idx").on(t.teamId, t.createdAt), index("job_actor_open_idx").on(t.actorId, t.costOpen)],
);

/** Model cost (list price, US cents) counted against a member; the basis of the daily/weekly/monthly limits. */
export const usageEvents = pgTable(
  "usage_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    costCents: integer("cost_cents").notNull(),
    /** Part of costCents beyond the member's limits, paid from the team's extra usage (top-up) balance. */
    topupCents: integer("topup_cents").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("usage_event_member_idx").on(t.teamId, t.userId, t.createdAt)],
);

/** Extra usage bought through Paddle (one-time). Credit is model cost (list price, US cents) the team may use. */
export const usageTopups = pgTable(
  "usage_topup",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    /** Paddle transaction (txn_...); unique so a repeated notification can't credit twice. "admin:..." for grants. */
    transactionId: text("transaction_id").notNull(),
    /** What the customer paid, before tax, in US cents (price × quantity). */
    paidCents: integer("paid_cents").notNull(),
    creditCents: integer("credit_cents").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("usage_topup_txn_idx").on(t.transactionId), index("usage_topup_team_idx").on(t.teamId)],
);

export const jobFiles = pgTable(
  "job_file",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Anthropic Files API id (file_...). */
    fileId: text("file_id").notNull(),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("job_file_job_idx").on(t.jobId)],
);

/** One row per question (user message) sent to TrustForge; used for the Free plan's monthly limit. */
export const jobMessages = pgTable(
  "job_message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("job_message_team_idx").on(t.teamId, t.createdAt)],
);
