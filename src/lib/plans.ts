import type { JobType, Plan } from "@/db/schema";

/** What each plan gets. Shared by server code and pages. */
export const PLAN_CONFIG: Record<
  Plan,
  {
    label: string;
    /** Questions (messages to TrustForge) per team per calendar month; null = unlimited. */
    questionsPerMonth: number | null;
    jobTypes: readonly JobType[];
    /** Hard spend cap per job, in US cents, enforced by the platform. */
    budgetCents: number;
    modelLabel: string;
  }
> = {
  free: {
    label: "Free",
    questionsPerMonth: 5,
    jobTypes: ["review", "ask"],
    budgetCents: 100,
    modelLabel: "Claude Haiku 5.5",
  },
  partner: {
    label: "Partner",
    questionsPerMonth: null,
    jobTypes: ["new_screen", "customize", "review", "hook", "silent", "ask"],
    budgetCents: 2500,
    modelLabel: "Claude Opus 5.5",
  },
};

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
