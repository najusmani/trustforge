import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy notice", description: "How TrustForge collects, uses and protects information, which services process it, and your rights.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  const L = LEGAL;
  return (
    <LegalPage
      title="Privacy notice"
      intro={`How ${L.entity} (“${L.brand}”, “we”) collects and uses information when you use ${L.product}.`}
    >
      <h2>1. Who is responsible</h2>
      <p>
        {L.entity}, {L.address}, is responsible for your information. Contact us at{" "}
        <a href={`mailto:${L.email}`}>{L.email}</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address, and your name if you give it.</li>
        <li><strong>Team:</strong> team name, members, roles, invitations and seats.</li>
        <li><strong>Jobs:</strong> what you write to {L.product}, the files you upload, the files it produces, and the job conversation.</li>
        <li><strong>Usage:</strong> how many questions your team sends, job activity, and the AI usage cost of each job.</li>
        <li><strong>Billing:</strong> handled by Paddle, our merchant of record. We receive your subscription status, seats and Paddle customer ID, not your card details.</li>
        <li><strong>Early-access requests:</strong> the name, email, company and notes you send us.</li>
        <li><strong>Technical:</strong> server logs (such as IP address and browser) kept briefly for security and troubleshooting.</li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>to provide {L.product}: sign-in, teams, running your jobs and keeping their results;</li>
        <li>to bill Partner plans through Paddle and enforce plan limits;</li>
        <li>to send you sign-in links, invitations and important service messages;</li>
        <li>to keep the service secure and fix problems.</li>
      </ul>
      <p>
        We use this information because we need it to provide the service you signed up for, and for our legitimate
        interest in running it securely. We do not sell your information, and we do not use your uploads or jobs for
        advertising.
      </p>

      <h2>4. Who processes it for us</h2>
      <ul>
        <li><strong>Anthropic</strong> runs the AI that does your jobs. Your messages and uploaded files are sent to Anthropic to process each job, and the job’s conversation and files are kept there until you delete the job.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
        <li><strong>Neon</strong> hosts our database (accounts, teams, job records).</li>
        <li><strong>Resend</strong> sends our emails.</li>
        <li><strong>Paddle</strong> processes payments as merchant of record, under its own privacy policy.</li>
      </ul>
      <p>
        These providers act on our instructions. Some are in the United States, so your information may be processed
        outside your country, with the safeguards the law requires.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li><strong>Jobs:</strong> until someone on your team deletes the job. Deleting a job deletes its conversation, its sandbox and every file uploaded or produced, with us and at Anthropic.</li>
        <li><strong>Account and team:</strong> while your account is active. Ask us to delete it at any time.</li>
        <li><strong>Billing records:</strong> as long as tax and accounting law requires.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use one essential cookie to keep you signed in. We don’t use advertising or tracking cookies. Paddle’s
        checkout may set its own cookies when you pay.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you can ask to access, correct, delete or export your information, or object to how
        we use it. Write to <a href={`mailto:${L.email}`}>{L.email}</a>. You can also complain to your data protection
        authority.
      </p>

      <h2>8. Security</h2>
      <p>
        Data is encrypted in transit. Each job runs in its own sandbox with no internet access. Access to your team’s
        jobs is limited to your team. Please don’t upload personal data of your bank’s customers, production data or
        credentials: {L.product} doesn’t need them.
      </p>

      <h2>9. Changes</h2>
      <p>We will post updates here with a new effective date, and tell team owners about material changes.</p>
    </LegalPage>
  );
}
