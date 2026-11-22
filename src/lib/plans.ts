import type { JobType, Plan } from "@/db/schema";

/** What each plan gets. Shared by server code and pages. */
export const PLAN_CONFIG: Record<
  Plan,
  {
    label: string;
    /** Questions (messages to TrustForge) per team per calendar month; null = unlimited. */
    questionsPerMonth: number | null;
    jobTypes: readonly JobType[];
    /** Fixed spend cap per job, in US cents (Free). Partner jobs get a ceiling per turn from the member's limits. */
    budgetCents: number;
    /**
     * Per-seat usage limits in US cents of model cost at list price (null = none). Each member has their own.
     * Partner: $100 seat − $5.50 Paddle fee − $50 margin = $44.50 a month. Teams can be given other values in Admin.
     */
    limits: UsageLimits | null;
    /** Shown to customers. Never name the model; say Anthropic. */
    modelLabel: string;
  }
> = {
  free: {
    label: "Free",
    questionsPerMonth: 5,
    jobTypes: ["review", "ask"],
    budgetCents: 100,
    limits: null,
    modelLabel: "Anthropic AI",
  },
  partner: {
    label: "Partner",
    questionsPerMonth: null,
    jobTypes: ["new_screen", "customize", "review", "hook", "silent", "ask"],
    budgetCents: 2500,
    limits: { dailyCents: 1500, weeklyCents: 2500, monthlyCents: 4450 },
    modelLabel: "Anthropic AI, advanced",
  },
};

export type UsageLimits = { dailyCents: number; weeklyCents: number; monthlyCents: number };

/**
 * Extra usage (top-ups), bought once through Paddle (PADDLE_PRICE_TOPUP, sold in units, e.g. $10).
 * Each dollar paid buys the same share of model usage as a seat does: $44.50 of usage per $100.
 */
export const TOPUP = {
  usageRatio: 0.445,
  maxUnits: 50,
} as const;

/** Model-cost cents -> the dollars-paid value customers see (they never see model cost). */
export function topupValueCents(creditCents: number): number {
  return Math.max(0, Math.floor(creditCents / TOPUP.usageRatio));
}

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  new_screen: "Create a new screen",
  customize: "Customize a function",
  review: "Review a radxml",
  hook: "Write hook code",
  silent: "Run Silent ODT",
  ask: "Ask about ODT",
};

export const RELEASES = ["14.7", "14.6"] as const;
export const LAYERS = ["CUSTOM", "CLUSTER", "KERNEL"] as const;

/** Per submission. Vercel accepts request bodies up to about 4.5 MB. */
export const UPLOAD_LIMITS = {
  maxFiles: 20,
  maxFileBytes: 4 * 1024 * 1024,
  maxTotalBytes: 4 * 1024 * 1024,
};
