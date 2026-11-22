import { EventName } from "@paddle/paddle-node-sdk";
import { revalidateTag } from "next/cache";
import { applySubscription, applyTopup, paddle, paddleConfig, type SubscriptionLike, type TransactionLike } from "@/lib/paddle";
import { PRICE_CACHE_TAG } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_EVENTS = new Set<string>([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionTrialing,
]);

/** Paddle notifications. Only signed events are accepted; only the TrustForge Partner and top-up prices are acted on. */
export async function POST(req: Request) {
  const { webhookSecret } = paddleConfig();
  const signature = req.headers.get("paddle-signature") ?? "";
  const body = await req.text();
  if (!webhookSecret || !signature) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = await paddle().webhooks.unmarshal(body, webhookSecret, signature);
  } catch (err) {
    console.error("[paddle] invalid webhook", err);
    return new Response("Invalid signature", { status: 401 });
  }

  const updatedPrice = (event.data as { id?: string }).id;
  if (event.eventType === EventName.PriceUpdated && (updatedPrice === paddleConfig().priceId || updatedPrice === paddleConfig().topupPriceId)) {
    revalidateTag(PRICE_CACHE_TAG); // show the new Partner price on the site straight away
    console.log(`[paddle] price.updated ${event.eventId}: price cache cleared`);
  }

  if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
    try {
      const result = await applySubscription(event.data as unknown as SubscriptionLike);
      console.log(`[paddle] ${event.eventType} ${event.eventId}: ${result}`);
    } catch (err) {
      console.error("[paddle] apply failed", err);
      return new Response("Retry later", { status: 500 }); // Paddle retries
    }
  }
  if (event.eventType === EventName.TransactionCompleted) {
    try {
      const result = await applyTopup(event.data as unknown as TransactionLike);
      console.log(`[paddle] ${event.eventType} ${event.eventId}: ${result}`);
    } catch (err) {
      console.error("[paddle] top-up failed", err);
      return new Response("Retry later", { status: 500 });
    }
  }
  return new Response("ok");
}
