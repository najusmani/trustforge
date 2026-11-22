import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { cycleLabel, formatPrice, getPartnerPrice } from "@/lib/pricing";

export const metadata: Metadata = { title: "Terms of service", description: "Terms of service for TrustForge, the AI assistant for Oracle FLEXCUBE customization by TrustRoute Technologies.", alternates: { canonical: "/terms" } };
export const revalidate = 600;

export default async function TermsPage() {
  const price = await getPartnerPrice();
  const L = LEGAL;
  return (
    <LegalPage
      title="Terms of service"
      intro={`These terms are an agreement between you and ${L.entity} (“${L.brand}”, “we”, “us”) for the use of ${L.product} at ${L.productUrl}.`}
    >
      <h2>1. Who we are</h2>
      <p>
        {L.product} is provided by {L.entity}, {L.address}. Contact: <a href={`mailto:${L.email}`}>{L.email}</a>.
      </p>

      <h2>2. The service</h2>
      <p>
        {L.product} is an AI assistant for developers working with Oracle FLEXCUBE Universal Banking (releases 14.6 and
        14.7) and its development tool, ODT. You describe a change and upload your development objects (such as radxml
        files, table definitions, packages and JavaScript). {L.product} asks questions, proposes a plan and produces
        files for you to review and load in ODT yourself.
      </p>
      <p>
        {L.product} is not affiliated with, endorsed or sponsored by Oracle. Oracle and FLEXCUBE are registered
        trademarks of Oracle and/or its affiliates.
      </p>

      <h2>3. Accounts and teams</h2>
      <ul>
        <li>You sign in with your work email. Keep access to that mailbox secure; anyone who can read it can sign in.</li>
        <li>A team has one owner. The owner manages members, roles, seats and billing, and is responsible for the team’s use of {L.product}.</li>
        <li>You must be at least 18 and able to agree to these terms for yourself or your employer.</li>
      </ul>

      <h2>4. Your content</h2>
      <ul>
        <li>You keep all rights in the files you upload and in the files {L.product} produces for you.</li>
        <li>You give us the permission needed to process your content to run your jobs, as described in our <Link href="/privacy">privacy notice</Link>.</li>
        <li>
          Only upload what you are allowed to share. Do not upload customer data, personal data of your bank’s customers,
          production data, passwords or keys. Development objects (code and definitions) are what {L.product} needs.
        </li>
      </ul>

      <h2>5. Review before use</h2>
      <p>
        {L.product} uses AI. Its output can be wrong or incomplete. You are responsible for reviewing, testing and
        approving everything before you load it in ODT or deploy it to any environment, following your bank’s own change,
        security and testing procedures. {L.product} does not compile, deploy or test anything in your FLEXCUBE environment.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law, or infringe anyone’s rights, including Oracle’s licence terms that apply to you;</li>
        <li>try to access other teams’ data, probe or disrupt the service, or get around plan limits;</li>
        <li>resell or share access outside your team, or use {L.product} to build a competing service;</li>
        <li>upload malicious code or content you are not allowed to share.</li>
      </ul>

      <h2>7. Plans, prices and billing</h2>
      <ul>
        <li>The Free plan includes one person and a limited number of questions each month, and can change.</li>
        <li>
          The Partner plan costs {formatPrice(price)} {price.currency} per seat per {cycleLabel(price)}, plus any tax
          that applies, billed in advance for the seats you choose. The current price is always shown on our website
          and at checkout.
        </li>
        <li>
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all
          our orders. Paddle provides all customer service inquiries and handles returns.
        </li>
        <li>
          Subscriptions renew automatically until cancelled. Adding seats is charged for the rest of the current period
          straight away; removing seats gives a credit. You can cancel any time from Billing; you keep Partner until the
          end of the period you paid for.
        </li>
        <li>We may change prices with at least 30 days’ notice; the new price applies from your next renewal.</li>
        <li>Refunds are covered by our <Link href="/refunds">refund policy</Link>.</li>
      </ul>

      <h2>8. Availability and changes</h2>
      <p>
        We work to keep {L.product} available but don’t promise it will be uninterrupted. We may improve or change
        features; if we remove something material from a paid plan, we will tell you in advance.
      </p>

      <h2>9. Suspension and ending</h2>
      <p>
        You can stop using {L.product} and delete your jobs at any time. We may suspend or close an account that breaks
        these terms or puts the service or other customers at risk, and will tell you why where we can.
      </p>

      <h2>10. Disclaimers and liability</h2>
      <p>
        {L.product} is provided “as is”. To the extent the law allows, we exclude all implied warranties, and we are not
        liable for indirect or consequential losses, or for losses caused by using output that you did not review and
        test. Our total liability in any 12 months is limited to the amount you paid us in that period. Nothing in these
        terms limits liability that cannot be limited by law.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms. We will post the new version here with a new effective date and, for material
        changes, tell team owners by email before they apply.
      </p>

      <h2>12. Law</h2>
      <p>These terms are governed by the laws of {L.governingLaw}.</p>
    </LegalPage>
  );
}
