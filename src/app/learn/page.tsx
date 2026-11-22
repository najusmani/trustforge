import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ARTICLES } from "@/lib/learn";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn Oracle FLEXCUBE development and ODT customization",
  description:
    "Free guides to Oracle FLEXCUBE Universal Banking development: ODT (Development Workbench), radxml, new screens, the CUSTOM layer, hook packages, Silent ODT and a learning roadmap.",
  alternates: { canonical: "/learn" },
  openGraph: { title: "Learn Oracle FLEXCUBE development", url: `${SITE.url}/learn`, images: ["/opengraph-image"] },
};

export default function LearnHub() {
  return (
    <>
      <SiteHeader />
      <main className="page learn">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Learn Oracle FLEXCUBE development",
            url: `${SITE.url}/learn`,
            hasPart: ARTICLES.map((a) => ({ "@type": "TechArticle", headline: a.title, url: `${SITE.url}/learn/${a.slug}` })),
          }}
        />
        <div className="wrap" style={{ maxWidth: 1000 }}>
          <span className="eyebrow">Learn</span>
          <h1>
            Learn Oracle FLEXCUBE development, <em className="ember">one guide at a time.</em>
          </h1>
          <p className="lead" style={{ maxWidth: 700 }}>
            Practical guides to building and customizing Oracle FLEXCUBE Universal Banking 14.6 and 14.7 with ODT, the
            Development Workbench. Written by the team behind TrustForge.
          </p>
          <ol className="learn-list">
            {ARTICLES.map((a, i) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`} className="learn-item">
                  <span className="learn-n">{["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii."][i]}</span>
                  <span className="learn-body">
                    <span className="learn-t">{a.title}</span>
                    <span className="learn-d">{a.description}</span>
                    <span className="learn-meta">{a.minutes} min read</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
