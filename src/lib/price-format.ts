/** Price shape and formatting shared by server pages and the browser (no server-only imports). */

export type PartnerPrice = {
  /** Amount per seat in the currency's smallest unit (e.g. cents), as Paddle stores it. */
  amountMinor: number;
  currency: string;
  /** Digits after the decimal point for this currency (2 for USD, 0 for JPY). */
  fractionDigits: number;
  /** "month", "year", ... and how many of them per billing cycle. */
  interval: string;
  frequency: number;
  fromPaddle: boolean;
};

/** "$100" for 1 seat, or the total for `seats`. Whole amounts drop the decimals. */
export function formatPrice(p: PartnerPrice, seats = 1): string {
  const value = (p.amountMinor * seats) / 10 ** p.fractionDigits;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency,
    minimumFractionDigits: whole ? 0 : p.fractionDigits,
    maximumFractionDigits: p.fractionDigits,
  }).format(value);
}

/** "month", "3 months", "year". */
export function cycleLabel(p: PartnerPrice): string {
  return p.frequency === 1 ? p.interval : `${p.frequency} ${p.interval}s`;
}
