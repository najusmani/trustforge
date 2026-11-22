import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JsonLd } from "@/components/JsonLd";
import { Arrow } from "@/components/Logo";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ARTICLES, getArticle } from "@/lib/learn";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `/learn/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.description,
      url: `${SITE.url}/learn/${a.slug}`,
      publishedTime: a.published,
      modifiedTime: a.updated,
      authors: [SITE.company],
      images: ["/opengraph-image"],
    },
  };
}

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const url = `${SITE.url}/learn/${a.slug}`;
  const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className="page">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "TechArticle",
              headline: a.title,
              description: a.description,
              keywords: a.keywords.join(", "),
              datePublished: a.published,
              dateModified: a.updated,
              url,
              mainEntityOfPage: url,
              inLanguage: "en",
              about: [{ "@type": "SoftwareApplication", name: "Oracle FLEXCUBE Universal Banking" }],
              author: { "@type": "Organization", name: SITE.company, url: SITE.companyUrl },
              publisher: { "@type": "Organization", name: SITE.companyLegal, url: SITE.companyUrl },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "TrustForge", item: SITE.url },
                { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE.url}/learn` },
                { "@type": "ListItem", position: 3, name: a.short, item: url },
              ],
            },
          ]}
        />
        <article className="wrap article">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link href="/">TrustForge</Link><span aria-hidden="true">/</span>
            <Link href="/learn">Learn</Link><span aria-hidden="true">/</span>
            <span>{a.short}</span>
          </nav>
          <h1>{a.title}</h1>
          <p className="lead">{a.description}</p>
          <p className="legal-meta">
            Updated <time dateTime={a.updated}>{dateFmt.format(new Date(a.updated))}</time> · {a.minutes} min read · {SITE.company}
          </p>
          <div className="article-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) =>
                  href?.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href} rel="noopener">{children}</a>,
              }}
            >
              {a.body}
            </ReactMarkdown>
          </div>

          <section aria-labelledby="faq-h" className="article-faq">
            <h2 id="faq-h">Frequently asked questions</h2>
            {a.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>

          <aside className="article-cta">
            <span className="eyebrow">TrustForge</span>
            <p className="article-cta-t">Bring your FLEXCUBE change. Leave with files ready for ODT.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <Link href="/sign-in" className="btn">Start free <Arrow /></Link>
              <Link href="/#how" className="btn btn-ghost">How it works</Link>
            </div>
          </aside>

          <nav aria-label="More guides" className="article-related">
            <span className="eyebrow">More guides</span>
            {related.map((r) => (
              <Link key={r.slug} href={`/learn/${r.slug}`}>{r.title}</Link>
            ))}
          </nav>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
