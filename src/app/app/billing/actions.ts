"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { applySubscription, billingReady, paddle, paddleConfig, topupReady } from "@/lib/paddle";
import { TOPUP } from "@/lib/plans";
import { getMembership, requireUser, seatsUsed } from "@/lib/teams";

const PATH = "/app/billing";

function fail(message: string): never {
  redirect(`${PATH}?error=${encodeURIComponent(message)}`);
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function requireOwner() {
  const user = await requireUser(PATH);
  const m = await getMembership(user.id);
  if (!m) redirect("/app");
  if (m.role !== "owner") fail("Only the team owner can change billing.");
  return { user, team: m.team };
}

export type CheckoutStart = { ok: true; transactionId: string; clientToken: string; env: "sandbox" | "production" } | { ok: false; error: string };

/**
 * Creates the Paddle transaction on the server (team and seat count can't be changed in the browser),
 * then the browser opens Paddle's checkout for it.
 */
export async function startCheckout(seatsInput: number): Promise<CheckoutStart> {
  const user = await requireUser(PATH);
  const m = await getMembership(user.id);
  if (!m || m.role !== "owner") return { ok: false, error: "Only the team owner can upgrade." };
  if (!billingReady()) return { ok: false, error: "Billing isn’t available yet. Please try again later." };
  if (m.team.paddleSubscriptionId && m.team.plan === "partner") return { ok: false, error: "Your team already has a subscription." };

  const used = await seatsUsed(m.team.id);
  const seats = Math.floor(Number(seatsInput));
  if (!Number.isFinite(seats) || seats < 1 || seats > 100) return { ok: false, error: "Choose 1 to 100 seats." };
  if (seats < used) return { ok: false, error: `${used} seat(s) are in use. Choose at least ${used}.` };

  const cfg = paddleConfig();
  try {
    const tx = await paddle().transactions.create({
      items: [{ priceId: cfg.priceId, quantity: seats }],
      customData: { team_id: m.team.id, app: "trustforge" },
      ...(m.team.paddleCustomerId ? { customerId: m.team.paddleCustomerId } : {}),
      checkout: { url: `${await origin()}${PATH}` },
    });
    return { ok: true, transactionId: tx.id, clientToken: cfg.clientToken, env: cfg.env };
  } catch (err) {
    console.error("[billing] transaction create failed", err);
    return { ok: false, error: "Paddle couldn’t start the checkout. Please try again." };
  }
}

/** One-time purchase of extra usage for the team (Partner, owner only). Credited when Paddle confirms payment. */
export async function startTopup(unitsInput: number): Promise<CheckoutStart> {
  const user = await requireUser(PATH);
  const m = await getMembership(user.id);
  if (!m || m.role !== "owner") return { ok: false, error: "Only the team owner can buy extra usage." };
  if (m.team.plan !== "partner") return { ok: false, error: "Extra usage is for Partner teams." };
  if (!topupReady()) return { ok: false, error: "Extra usage isn’t available yet. Please try again later." };
  const units = Math.floor(Number(unitsInput));
  if (!Number.isFinite(units) || units < 1 || units > TOPUP.maxUnits) return { ok: false, error: `Choose 1 to ${TOPUP.maxUnits}.` };
  const cfg = paddleConfig();
  try {
    const tx = await paddle().transactions.create({
      items: [{ priceId: cfg.topupPriceId, quantity: units }],
      customData: { team_id: m.team.id, app: "trustforge", kind: "topup" },
      ...(m.team.paddleCustomerId ? { customerId: m.team.paddleCustomerId } : {}),
      checkout: { url: `${await origin()}${PATH}` },
    });
    return { ok: true, transactionId: tx.id, clientToken: cfg.clientToken, env: cfg.env };
  } catch (err) {
    console.error("[billing] top-up transaction failed", err);
    return { ok: false, error: "Paddle couldn’t start the checkout. Please try again." };
  }
}

/** Changes the seat count on an active subscription; Paddle bills or credits the difference now. */
export async function changeSeats(formData: FormData) {
  const { team } = await requireOwner();
  if (!team.paddleSubscriptionId) fail("Your team has no subscription to change.");
  const seats = Math.floor(Number(formData.get("seats")));
  if (!Number.isFinite(seats) || seats < 1 || seats > 100) fail("Choose 1 to 100 seats.");
  const used = await seatsUsed(team.id);
  if (seats < used) fail(`${used} seat(s) are in use. Remove people or invites first.`);

  try {
    const sub = await paddle().subscriptions.update(team.paddleSubscriptionId!, {
      items: [{ priceId: paddleConfig().priceId, quantity: seats }],
      prorationBillingMode: "prorated_immediately",
    });
    await applySubscription(sub as unknown as Parameters<typeof applySubscription>[0]);
  } catch (err) {
    console.error("[billing] seat change failed", err);
    fail("Paddle couldn’t change the seats. Please try again, or use Manage billing.");
  }
  redirect(`${PATH}?notice=${encodeURIComponent(`Seats changed to ${seats}. Paddle bills the difference for this month.`)}`);
}

/** Opens Paddle's customer portal: invoices, payment method, cancel. */
export async function openPortal() {
  const { team } = await requireOwner();
  if (!team.paddleCustomerId) fail("Your team has no billing account yet.");
  let url: string;
  try {
    const session = await paddle().customerPortalSessions.create(
      team.paddleCustomerId!,
      team.paddleSubscriptionId ? [team.paddleSubscriptionId] : [],
    );
    url = session.urls.general.overview;
  } catch (err) {
    console.error("[billing] portal failed", err);
    fail("Paddle’s billing page couldn’t be opened. Please try again.");
  }
  redirect(url);
}
