import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/Flash";
import { billingReady, topupReady } from "@/lib/paddle";
import { cycleLabel, formatPrice, getPartnerPrice, getTopupPrice } from "@/lib/pricing";
import { PLAN_CONFIG, TOPUP, topupValueCents } from "@/lib/plans";
import { topupBalance } from "@/lib/usage";
import { getMembership, requireUser, seatsUsed } from "@/lib/teams";
import { changeSeats, openPortal } from "./actions";
import { TopupForm } from "./TopupForm";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: "Billing" };

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });
const STATUS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment failed: Paddle is retrying",
  paused: "Paused",
  canceled: "Cancelled",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const user = await requireUser("/app/billing");
  const m = await getMembership(user.id);
  if (!m) redirect("/app");
  const { team, role } = m;
  const [used, price, unit, balance] = await Promise.all([seatsUsed(team.id), getPartnerPrice(), getTopupPrice(), topupBalance(team.id)]);
  const extra = topupValueCents(balance);
  const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
  const cycle = cycleLabel(price);
  const owner = role === "owner";
  const subscribed = Boolean(team.paddleSubscriptionId) && team.plan === "partner";
  const contract = team.plan === "partner" && !team.paddleSubscriptionId;

  return (
    <div className="app-wide" style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="eyebrow">Billing</span>
        <h1 className="app-h1">
          {PLAN_CONFIG[team.plan].label} <em className="ember">plan</em>
        </h1>
      </div>
      <Flash error={error} notice={notice} />

      {subscribed && (
        <section className="card panel">
          <dl className="kv">
            <dt>Status</dt><dd>{STATUS[team.subscriptionStatus ?? ""] ?? team.subscriptionStatus}</dd>
            <dt>Seats</dt><dd>{team.seats} ({used} in use)</dd>
            <dt>Price</dt><dd>{formatPrice(price, team.seats)} {price.currency} per {cycle} ({formatPrice(price)} per seat)</dd>
            {team.currentPeriodEnd && <><dt>Next bill</dt><dd>{dateFmt.format(team.currentPeriodEnd)}</dd></>}
          </dl>
          {owner ? (
            <>
              <form action={changeSeats} className="invite-form" style={{ alignItems: "flex-end" }}>
                <div className="field" style={{ flex: "0 1 160px" }}>
                  <label htmlFor="seats">Change seats</label>
                  <input className="input" id="seats" name="seats" type="number" min={Math.max(1, used)} max={100} defaultValue={team.seats} inputMode="numeric" />
                </div>
                <button type="submit" className="btn btn-ghost btn-sm" style={{ minHeight: 48 }}>Update seats</button>
              </form>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
                Adding seats charges the difference for the rest of this month now; removing seats gives a credit.
              </p>
              <form action={openPortal}>
                <button type="submit" className="btn btn-ghost btn-sm">Manage billing: invoices, card, cancel</button>
              </form>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Only the team owner can change billing.</p>
          )}
        </section>
      )}

      {team.plan === "partner" && (
        <section className="card panel" id="extra" aria-labelledby="extra-h">
          <h2 id="extra-h" className="panel-h">Extra usage</h2>
          <p className="lead" style={{ fontSize: 15 }}>
            When someone reaches their daily, weekly or monthly limit, they can keep working on your team’s extra usage.
            It’s shared by the whole team and doesn’t expire while you’re on Partner.
          </p>
          <dl className="kv">
            <dt>Left</dt><dd>{usd(extra)}</dd>
          </dl>
          {!owner ? (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Ask your team owner to add extra usage.</p>
          ) : !topupReady() ? (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Extra usage can’t be bought online yet. Contact TrustRoute.</p>
          ) : (
            <>
              <TopupForm unit={unit} maxUnits={TOPUP.maxUnits} />
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
                One-time payment through Paddle; taxes are added where they apply. See the <a href="/refunds">refund policy</a>.
              </p>
            </>
          )}
        </section>
      )}

      {contract && (
        <section className="card panel">
          <p className="lead" style={{ fontSize: 15 }}>
            Your Partner plan ({team.seats} seat{team.seats === 1 ? "" : "s"}) is managed by TrustRoute Technologies under
            your agreement. Contact TrustRoute to change it.
          </p>
        </section>
      )}

      {team.plan === "free" && (
        <section className="card panel">
          <h2 className="panel-h">Upgrade to Partner</h2>
          <ul className="plan-points">
            <li>All six kinds of job: new screens, customizations, hook code, Silent ODT, reviews, questions</li>
            <li>Anthropic’s most capable AI, with a daily, weekly and monthly usage allowance per seat</li>
            <li>Seats for your team: {formatPrice(price)} {price.currency} per seat per {cycle}, cancel any time</li>
          </ul>
          {!owner ? (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Ask your team owner to upgrade.</p>
          ) : !billingReady() ? (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Online upgrades aren’t open yet. Contact TrustRoute.</p>
          ) : (
            <>
              <UpgradeForm minSeats={used} price={price} />
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
                Payment is handled by Paddle, our reseller and merchant of record. Taxes are added where they apply. By upgrading you agree to our{" "}
                <a href="/terms">terms</a>, <a href="/refunds">refund policy</a> and <a href="/privacy">privacy notice</a>.
              </p>
            </>
          )}
          {team.subscriptionStatus === "canceled" && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Your previous subscription was cancelled.</p>
          )}
        </section>
      )}
    </div>
  );
}
