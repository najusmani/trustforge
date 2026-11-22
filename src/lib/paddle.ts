import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";

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
    clientToken: process.env.PADDLE_CLIENT_TOKEN ?? "",
  } as const;
}

export function billingReady(): boolean {
  const c = paddleConfig();
  return Boolean(c.apiKey && c.priceId && c.clientToken);
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
