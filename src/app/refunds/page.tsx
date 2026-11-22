import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund policy", description: "TrustForge refund policy: 14-day money-back on your first Partner payment, cancel any time, refunds through Paddle.", alternates: { canonical: "/refunds" } };

export default function RefundsPage() {
  const L = LEGAL;
  return (
    <LegalPage title="Refund policy" intro={`How refunds and cancellations work for ${L.product} Partner subscriptions.`}>
      <h2>1. {L.refundDays}-day money-back on your first payment</h2>
      <p>
        If {L.product} isn’t right for your team, ask for a refund within {L.refundDays} days of your team’s first
        Partner payment and we will refund that payment in full.
      </p>

      <h2>2. After that</h2>
      <ul>
        <li>You can cancel any time from Billing. Your team keeps Partner until the end of the period already paid, and you won’t be charged again.</li>
        <li>We don’t refund partly used billing periods, except where the law requires it.</li>
        <li>When you remove seats, the unused part of the current period is credited to your next bill.</li>
        <li>If you were charged by mistake (for example, twice), we will refund the mistaken charge.</li>
      </ul>

      <h2>3. How to ask</h2>
      <p>
        Our order process is conducted by our online reseller Paddle.com, the Merchant of Record for all our orders.
        Request a refund through Paddle (the link in your receipt email, or <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>),
        or write to us at <a href={`mailto:${L.email}`}>{L.email}</a> with your team name and receipt number. Refunds go
        back to the original payment method, usually within 5 to 10 business days.
      </p>

      <h2>4. Your legal rights</h2>
      <p>
        This policy doesn’t affect any rights you have under the law where you live. See also our{" "}
        <Link href="/terms">terms of service</Link>.
      </p>
    </LegalPage>
  );
}
