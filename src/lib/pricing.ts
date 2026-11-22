import "server-only";
import { unstable_cache } from "next/cache";
import { paddle, paddleConfig } from "@/lib/paddle";
import type { PartnerPrice } from "@/lib/price-format";

export { cycleLabel, formatPrice, type PartnerPrice } from "@/lib/price-format";

/**
 * The Partner price, read from Paddle (PADDLE_PRICE_PARTNER) so a change in Paddle shows everywhere on the site.
 * Cached for 10 minutes; a `price.updated` notification refreshes it at once (see the Paddle webhook).
 */

export const PRICE_CACHE_TAG = "paddle-partner-price";

const FALLBACK: PartnerPrice = {
  amountMinor: 10000,
  currency: "USD",
  fractionDigits: 2,
  interval: "month",
  frequency: 1,
  fromPaddle: false,
};

function fractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

const fetchPrice = unstable_cache(
  async (priceId: string): Promise<PartnerPrice> => {
    const p = await paddle().prices.get(priceId);
    const currency = p.unitPrice.currencyCode;
    return {
      amountMinor: Number(p.unitPrice.amount),
      currency,
      fractionDigits: fractionDigits(currency),
      interval: p.billingCycle?.interval ?? "month",
      frequency: p.billingCycle?.frequency ?? 1,
      fromPaddle: true,
    };
  },
  ["paddle-partner-price"],
  { revalidate: 600, tags: [PRICE_CACHE_TAG] },
);

export async function getPartnerPrice(): Promise<PartnerPrice> {
  const { apiKey, priceId } = paddleConfig();
  if (!apiKey || !priceId) return FALLBACK;
  try {
    const price = await fetchPrice(priceId);
    return Number.isFinite(price.amountMinor) ? price : FALLBACK;
  } catch (err) {
    console.error("[pricing] Paddle price lookup failed; using fallback", err);
    return FALLBACK;
  }
}
