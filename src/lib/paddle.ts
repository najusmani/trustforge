import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams, usageTopups } from "@/db/schema";
import { TOPUP } from "@/lib/plans";

/**
 * Paddle Billing (merchant of record). Partner = PADDLE_PRICE_PARTNER, quantity = seats.
 * The Paddle account is shared with another website, so everything here acts only on that price
 * and on teams we created a checkout for (custom_data.team_id).
 */

export function paddleConfig() {
  const env = process.env.PADDLE_ENV === "sandbox" ? "sandbox" : "production";
  return {
    env,
    apiKey: process.env.PADDLE_API_KEY ?? "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
    priceId: process.env.PADDLE_PRICE_PARTNER ?? "",
    /** One-time price for extra usage, sold in units (e.g. $10). */
    topupPriceId: process.env.PADDLE_PRICE_TOPUP ?? "",
    clientToken: process.env.PADDLE_CLIENT_TOKEN ?? "",
  } as const;
}

export function billingReady(): boolean {
  const c = paddleConfig();
  return Boolean(c.apiKey && c.priceId && c.clientToken);
}

export function topupReady(): boolean {
  return billingReady() && Boolean(paddleConfig().topupPriceId);
}

let client: Paddle | null = null;
export function paddle(): Paddle {
  const c = paddleConfig();
  if (!c.apiKey) throw new Error("PADDLE_API_KEY is not set.");
  client ??= new Paddle(c.apiKey, { environment: c.env === "sandbox" ? Environment.sandbox : Environment.production });
  return client;
}

/** Statuses that keep a team on Partner. past_due keeps access while Paddle retries the payment. */
const PAID = new Set(["active", "trialing", "past_due"]);

export type SubscriptionLike = {
  id: string;
  status: string;
  customerId: string;
  updatedAt: string;
  currentBillingPeriod: { endsAt: string } | null;
  items: { quantity: number; price: { id: string } | null }[];
  customData: Record<string, unknown> | null;
};

/**
 * Applies a Paddle subscription to its team. Ignores subscriptions for other products,
 * unknown teams, and events older than the last one applied.
 */
export async function applySubscription(sub: SubscriptionLike): Promise<string> {
  const { priceId } = paddleConfig();
  const item = sub.items.find((i) => i.price?.id === priceId);
  if (!item) return "ignored: not the TrustForge Partner price";

  // Team: from custom_data (set by our server on the checkout), else by subscription id.
  const fromData = typeof sub.customData?.team_id === "string" ? (sub.customData.team_id as string) : null;
  let [team] = fromData ? await db.select().from(teams).where(eq(teams.id, fromData)) : [];
  if (!team) [team] = await db.select().from(teams).where(eq(teams.paddleSubscriptionId, sub.id));
  if (!team) return "ignored: no matching team";

  const updatedAt = new Date(sub.updatedAt);
  if (team.billingUpdatedAt && team.billingUpdatedAt > updatedAt) return "ignored: older event";

  const paid = PAID.has(sub.status);
  await db
    .update(teams)
    .set({
      plan: paid ? "partner" : "free",
      seats: paid ? Math.max(1, item.quantity) : 1,
      paddleCustomerId: sub.customerId,
      paddleSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      currentPeriodEnd: sub.currentBillingPeriod ? new Date(sub.currentBillingPeriod.endsAt) : null,
      billingUpdatedAt: updatedAt,
    })
    .where(eq(teams.id, team.id));
  return `applied: team ${team.id} ${paid ? `partner, ${item.quantity} seat(s)` : `free (${sub.status})`}`;
}

export type TransactionLike = {
  id: string;
  status: string;
  customData: Record<string, unknown> | null;
  items: { quantity: number; price: { id: string; unitPrice?: { amount: string; currencyCode: string } } | null }[];
};

/**
 * Credits extra usage for a completed Paddle transaction of the top-up price. Ignores other products and
 * transactions without our team id; a repeated notification can't credit twice (unique transaction id).
 */
export async function applyTopup(tx: TransactionLike): Promise<string> {
  const { topupPriceId } = paddleConfig();
  if (!topupPriceId) return "ignored: no top-up price configured";
  const lines = tx.items.filter((i) => i.price?.id === topupPriceId);
  if (!lines.length) return "ignored: not a TrustForge top-up";
  const teamId = typeof tx.customData?.team_id === "string" ? (tx.customData.team_id as string) : null;
  if (!teamId) return "ignored: no team id";
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) return "ignored: unknown team";
  const paidCents = lines.reduce((s, i) => s + Number(i.price?.unitPrice?.amount ?? 0) * i.quantity, 0);
  if (!Number.isFinite(paidCents) || paidCents <= 0) return "ignored: no amount";
  const creditCents = Math.floor(paidCents * TOPUP.usageRatio);
  const inserted = await db
    .insert(usageTopups)
    .values({ teamId, transactionId: tx.id, paidCents, creditCents })
    .onConflictDoNothing({ target: usageTopups.transactionId })
    .returning({ id: usageTopups.id });
  return inserted.length ? `credited: team ${teamId}, paid ${paidCents}, credit ${creditCents}` : "ignored: already credited";
}
