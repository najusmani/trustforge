import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { EarlyAccessForm } from "./EarlyAccessForm";

export const metadata: Metadata = {
  title: "Early access",
  description: "Get early access to TrustForge for Oracle FLEXCUBE UBS 14.6 and 14.7.",
  alternates: { canonical: "/early-access" },
};

const PLANS = ["free", "partner", "private"] as const;
type Plan = (typeof PLANS)[number];

export default async function EarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan: Plan = PLANS.includes(plan as Plan) ? (plan as Plan) : "free";

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap">
          <span className="eyebrow enter d1">Early access</span>
          <h1 className="enter d2">
            Be first to <em className="ember">forge</em> with us.
          </h1>
          <p className="lead enter d3">
            TrustForge is opening to FLEXCUBE teams in stages. Tell us about yours and we’ll set up your workspace.
          </p>
          <div className="card enter d4">
            <EarlyAccessForm initialPlan={initialPlan} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
