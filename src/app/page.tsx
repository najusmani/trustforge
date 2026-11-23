import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteChrome";
import { LogoMark } from "@/components/Logo";
import { Presentation } from "@/components/Presentation";
import { ARTICLES } from "@/lib/learn";
import { cycleLabel, formatPrice, getPartnerPrice } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import s from "./home.module.css";

/** Re-read the Partner price from Paddle at most every 10 minutes. */
export const revalidate = 600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

function Arrow() {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
      <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Thin gold lines suggesting a city skyline, drawn in code (no stock photography). */
function Skyline() {
  const towers = [
    [880, 260], [960, 120], [1040, 330], [1140, 200], [1215, 410],
    [1330, 170], [1400, 300], [760, 470], [640, 560], [540, 600],
  ];
  return (
    <svg className={s.skyline} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9AE78" stopOpacity="0.55" />
          <stop offset="1" stopColor="#C9AE78" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {towers.map(([x, top], i) => (
        <g key={i} stroke="url(#fade)" strokeWidth="1" fill="none" className={s.draw} style={{ animationDelay: `${i * 0.12}s` }}>
          <path d={`M${x} 900 V${top} H${x + 62} V900`} />
          {Array.from({ length: Math.floor((900 - top) / 48) }).map((_, k) => (
            <path key={k} d={`M${x + 10} ${top + 26 + k * 48} H${x + 52}`} strokeOpacity="0.35" />
          ))}
        </g>
      ))}
      <path d="M1180 120 L1300 420 L1120 640" stroke="#C9AE78" strokeOpacity="0.35" strokeWidth="0.8" fill="none" className={s.draw} />
      <circle cx="1300" cy="420" r="2.5" fill="#C9AE78" />
      <circle cx="1180" cy="120" r="1.8" fill="#C9AE78" fillOpacity="0.8" />
      <circle cx="1120" cy="640" r="1.8" fill="#C9AE78" fillOpacity="0.8" />
    </svg>
  );
}

const STEPS = [
  ["i.", "Describe", "Say what you need in plain words and upload your radxml, tables, packages or JavaScript."],
  ["ii.", "Discuss", "TrustForge asks only what it needs and agrees the plan with you, item by item."],
  ["iii.", "Build", "Once you approve, it builds each file and checks it against ODT’s load and save rules."],
  ["iv.", "Deliver", "Download the files, the deploy order and the unit tests, ready to load in ODT."],
];

const JOBS = [
  ["New FLEXCUBE screens", "Maintenance · Online · Call & launch forms"],
  ["Customize Oracle functions", "CUSTOM layer only · Extension tables"],
  ["Radxml review", "ODT load & save rules"],
  ["Hook packages & release JS", "Validations · Defaults · Processing"],
  ["Silent ODT", "Bulk generation · Refresh · SOAP & REST"],
  ["ODT questions", "Answered from the guides"],
];

const COST_BEFORE = [
  ["Tens to hundreds of thousands of dollars", "for a single FLEXCUBE customization through an implementation partner"],
  ["Weeks of analysis and development", "before the first file reaches your ODT"],
  ["Large partner teams", "tens to hundreds of developers billed by the hour across a programme"],
];

const COST_AFTER = [
  ["Hundreds of dollars", "a Partner seat, with a daily, weekly and monthly usage allowance"],
  ["Minutes to the first files", "radxml, CUSTOM hook packages, JavaScript and scripts, checked against ODT rules"],
  ["Your own developers", "review, load, compile and test; TrustForge does the heavy lifting"],
];

const SAFETY = [
  ["Oracle’s code is never edited", "Changes go in the CUSTOM layer. Kernel values are checked and stay exactly as shipped."],
  ["Nothing without approval", "TrustForge shows the plan and the files it will make. Nothing is built until you agree."],
  ["No secrets in files", "Passwords and keys are left as placeholders for your team to fill in."],
  ["Your bank’s data stays yours", "Uploaded objects are used for your job only, and deleted with it. A private install keeps everything in your network."],
];

function faqFor(price: string, cycle: string) {
  return [
    {
      q: "What is TrustForge?",
      a: "TrustForge is an AI assistant for Oracle FLEXCUBE Universal Banking developers. You describe a change and upload your objects; it asks what it needs, agrees a plan with you, and delivers radxml, CUSTOM hook packages, release JavaScript and scripts ready to load in ODT (the Development Workbench).",
    },
    {
      q: "Which Oracle FLEXCUBE releases does TrustForge support?",
      a: "FLEXCUBE Universal Banking (FCUBS) 14.6 and 14.7. Output has been verified end to end on 14.7.0.6.0, where TrustForge-built screens were loaded, generated and deployed.",
    },
    {
      q: "Can TrustForge customize an existing Oracle FLEXCUBE screen?",
      a: "Yes. It extends Oracle (KERNEL) functions in the CUSTOM layer: new fields, tabs, sub-screens, validations and extension tables, and it checks that no Oracle value changes.",
    },
    {
      q: "Does TrustForge change Oracle’s code?",
      a: "No. Everything goes in the CUSTOM layer: the radxml CUSTOM section, the CUSTOM hook package and the CUSTOM release JavaScript. Oracle’s KERNEL code stays as shipped, which keeps upgrades safe.",
    },
    {
      q: "What do I need to upload?",
      a: "Development objects only: the function’s radxml, table definitions (DDL or DESC output), and for processing changes the related packages or JavaScript. Never upload customer data, production data or passwords.",
    },
    {
      q: "Can TrustForge help me learn FLEXCUBE development?",
      a: "Yes. The free Learn guides cover ODT, radxml, new screens, the CUSTOM layer, hook packages and Silent ODT, and the Free plan answers ODT questions from the guides and reviews your radxml.",
    },
    {
      q: "Which AI does TrustForge use?",
      a: "TrustForge is an AI agent built on Anthropic’s AI, running on Anthropic’s platform with FLEXCUBE ODT knowledge, rules and checks built in. A private install can run on your bank’s own Anthropic, AWS Bedrock or Google Vertex account.",
    },
    {
      q: "How much can TrustForge save on a FLEXCUBE customization?",
      a: "Banks often pay tens to hundreds of thousands of dollars for a FLEXCUBE customization through an implementation partner. With TrustForge, the same change costs hundreds of dollars and the first files arrive in minutes, which can cut development cost by up to 90%. Your developers still review, deploy and test every change, and savings depend on the scope.",
    },
    {
      q: "How much does TrustForge cost?",
      a: `The Free plan costs nothing and includes radxml reviews and ODT questions, 5 a month. The Partner plan is ${price} per seat per ${cycle} with all job types and a daily, weekly and monthly usage allowance for each seat. Banks can also arrange a private install in their own cloud.`,
    },
  ];
}

export default async function Home() {
  const price = await getPartnerPrice();
  const priceText = `${formatPrice(price)} ${price.currency}`;
  const cycle = cycleLabel(price);
  const faq = faqFor(priceText, cycle);

  return (
    <div className={s.page}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE.companyLegal,
            alternateName: SITE.company,
            url: SITE.companyUrl,
            email: SITE.email,
            address: { "@type": "PostalAddress", addressLocality: SITE.locality, addressRegion: SITE.region, addressCountry: SITE.country },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            publisher: { "@type": "Organization", name: SITE.companyLegal },
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
            applicationCategory: "DeveloperApplication",
            applicationSubCategory: "Oracle FLEXCUBE customization and ODT development",
            operatingSystem: "Web",
            keywords: SITE.keywords.join(", "),
            publisher: { "@type": "Organization", name: SITE.companyLegal, url: SITE.companyUrl },
            offers: [
              { "@type": "Offer", name: "Free", price: "0", priceCurrency: price.currency },
              {
                "@type": "Offer",
                name: "Partner",
                price: String(price.amountMinor / 10 ** price.fractionDigits),
                priceCurrency: price.currency,
                description: `Per seat per ${cycle}`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />

      <header className={s.header}>
        <nav aria-label="Main" className={`${s.wrap} ${s.nav}`}>
          <Link href="/" className={s.brand} aria-label="TrustForge home">
            <LogoMark size={38} />
            <span className={s.brandText}>
              <span className={s.brandName}>TrustForge</span>
              <span className={s.brandSub}>TrustRoute Technologies</span>
            </span>
          </Link>
          <div className={`${s.links} ${s.caps}`}>
            <a href="#watch" className={s.hideSm}>Watch</a>
            <a href="#how" className={s.hideSm}>How it works</a>
            <Link href="/learn" className={s.hideSm}>Learn</Link>
            <a href="#plans">Plans</a>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/app" className={`${s.btn} ${s.navBtn}`}>Start a job</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className={`${s.hero} ${s.onNavy}`} aria-labelledby="hero-h">
          <Skyline />
          <div className={`${s.wrap} ${s.heroInner}`}>
            <div className={s.heroGrid}>
              <div>
                <span className={`${s.eyebrow} ${s.rise} ${s.r1}`}>AI agent for Oracle FLEXCUBE · Built on Anthropic</span>
                <h1 id="hero-h" className={`${s.serif} ${s.h1} ${s.rise} ${s.r2}`}>
                  FLEXCUBE customizations,<br />
                  <em className={s.gold}>forged in conversation.</em>
                </h1>
                <p className={`${s.heroLead} ${s.rise} ${s.r3}`}>
                  Describe the change and upload your objects. TrustForge, an AI assistant for FLEXCUBE UBS 14.6 and
                  14.7, asks what it needs, agrees a plan with you, and delivers radxml, CUSTOM hook packages,
                  JavaScript and scripts ready to load in ODT. Up to 90% less than the usual cost.
                </p>
                <div className={`${s.heroActions} ${s.rise} ${s.r4}`}>
                  <Link href="/app" className={s.btn}>Start your first job <Arrow /></Link>
                  <a href="#watch" className={s.textLink}>Watch the 5-minute overview</a>
                </div>
              </div>
              <aside className={`${s.heroAside} ${s.rise} ${s.r5}`} aria-label="From a recent job">
                <p className={`${s.serif} ${s.quote}`}>“Add a sixth charge to IFDATMMN, the same as charge five.”</p>
                <span className={s.quoteBy}>A recent request</span>
                <div className={s.asideRow}><span>Fields added in the CUSTOM layer</span><strong>36</strong></div>
                <div className={s.asideRow}><span>Oracle values changed</span><strong>0</strong></div>
              </aside>
            </div>
          </div>
          <div className={s.strip}>
            <div className={`${s.stripInner} ${s.caps}`}>
              <span>New screens</span><span>Customizations</span><span>Radxml review</span><span>Hook code</span><span>Silent ODT</span>
            </div>
          </div>
        </section>

        <section id="watch" className={s.section} aria-labelledby="watch-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Watch</span>
              <h2 id="watch-h" className={`${s.serif} ${s.h2}`}>
                TrustForge in <em className={s.gold}>five minutes.</em>
              </h2>
            </div>
            <div style={{ marginTop: 48 }}>
              <Presentation price={formatPrice(price)} />
            </div>
          </div>
        </section>

        <section id="how" className={`${s.section} ${s.ivory}`} aria-labelledby="how-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>How it works</span>
              <h2 id="how-h" className={`${s.serif} ${s.h2}`}>
                Like briefing a senior ODT developer. <em className={s.gold}>Only faster.</em>
              </h2>
            </div>
            <div className={s.cols}>
              {STEPS.map(([n, t, p]) => (
                <div key={t} className={s.col}>
                  <span className={s.colN}>{n}</span>
                  <h3 className={`${s.serif} ${s.colT}`}>{t}</h3>
                  <p className={s.colP}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cost" className={`${s.section} ${s.navy} ${s.onNavy}`} aria-labelledby="cost-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Cost</span>
              <h2 id="cost-h" className={`${s.serif} ${s.h2}`}>
                FLEXCUBE customization at a fraction of the cost. <em className={s.gold}>Up to 90% less.</em>
              </h2>
            </div>
            <div className={s.costGrid}>
              <div className={s.costCol}>
                <span className={`${s.caps} ${s.costHead}`}>The usual way</span>
                <ul className={s.costList}>
                  {COST_BEFORE.map(([big, small]) => (
                    <li key={big}>
                      <strong className={s.serif}>{big}</strong>
                      <span>{small}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${s.costCol} ${s.costNew}`}>
                <span className={`${s.caps} ${s.costHead}`}>With TrustForge</span>
                <ul className={s.costList}>
                  {COST_AFTER.map(([big, small]) => (
                    <li key={big}>
                      <strong className={s.serif}>{big}</strong>
                      <span>{small}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={s.costBig} aria-label="Up to 90 percent lower development cost">
                <span className={`${s.serif} ${s.costPct}`}>90%</span>
                <span className={s.costPctLabel}>up to 90% lower development cost</span>
              </div>
            </div>
            <p className={s.costNote}>
              Typical market figures for illustration. Savings depend on the scope of the change. Your team still reviews,
              deploys and tests every change in its own environments.
            </p>
          </div>
        </section>

        <section id="build" className={`${s.section} ${s.ivory}`} aria-labelledby="build-h">
          <div className={`${s.wrap} ${s.split}`}>
            <div>
              <span className={s.eyebrow}>Capabilities</span>
              <h2 id="build-h" className={`${s.serif} ${s.h2}`} style={{ marginTop: 22 }}>
                Six kinds of job. <em className={s.gold}>One conversation.</em>
              </h2>
              <p className={s.lead}>
                New FLEXCUBE functions or changes to Oracle’s own, every element tagged to your release and checked
                before you load it in ODT.
              </p>
            </div>
            <ul className={s.rows}>
              {JOBS.map(([name, meta]) => (
                <li key={name} className={s.row}>
                  <h3 className={`${s.serif} ${s.rowName}`} style={{ margin: 0, fontWeight: 400 }}>{name}</h3>
                  <span className={`${s.caps} ${s.rowMeta}`}>{meta}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.section} aria-labelledby="proof-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Built with TrustForge</span>
              <h2 id="proof-h" className={`${s.serif} ${s.h2}`}>
                Real jobs, on a real <em className={s.gold}>FLEXCUBE.</em>
              </h2>
            </div>
            <div className={s.cases}>
              <article className={s.case}>
                <span className={`${s.caps} ${s.caseId}`}>STDCURSK</span>
                <h3 className={`${s.serif} ${s.caseT}`}>Customer risk profile screen</h3>
              </article>
              <article className={s.case}>
                <span className={`${s.caps} ${s.caseId}`}>IFDATMMN</span>
                <h3 className={`${s.serif} ${s.caseT}`}>Sixth charge on ARC maintenance</h3>
              </article>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.ivory}`} aria-labelledby="safety-h">
          <div className={`${s.wrap} ${s.split}`}>
            <div>
              <span className={s.eyebrow}>Safety</span>
              <h2 id="safety-h" className={`${s.serif} ${s.h2}`} style={{ marginTop: 22 }}>
                Built for how <em className={s.gold}>banks</em> work.
              </h2>
            </div>
            <div className={s.safety}>
              {SAFETY.map(([t, p]) => (
                <div key={t} className={s.safe}>
                  <h3 className={`${s.serif} ${s.safeT}`}>{t}</h3>
                  <p className={s.safeP}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="plans" className={s.section} aria-labelledby="plans-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Plans</span>
              <h2 id="plans-h" className={`${s.serif} ${s.h2}`}>
                Start free. <em className={s.gold}>Bring your team</em> when you’re ready.
              </h2>
            </div>
            <div className={s.plans}>
              <article className={s.plan}>
                <h3 className={`${s.serif} ${s.planName}`}>Free</h3>
                <div><span className={s.price}>{formatPrice({ ...price, amountMinor: 0 })}</span></div>
                <ul className={s.points}>
                  <li>Radxml review against ODT rules</li>
                  <li>ODT questions answered from the guides</li>
                  <li>One person, 5 questions a month</li>
                </ul>
                <Link href="/sign-in" className={`${s.btn} ${s.btnDark}`}>Start free</Link>
              </article>
              <article className={`${s.plan} ${s.planHot}`}>
                <h3 className={`${s.serif} ${s.planName}`}>Partner</h3>
                <div>
                  <span className={s.price}>{formatPrice(price)}</span>{" "}
                  <span className={s.per}>{price.currency} per seat / {cycle}</span>
                </div>
                <ul className={s.points}>
                  <li>All six kinds of job</li>
                  <li>Daily, weekly and monthly usage per seat</li>
                  <li>Start with one seat, add more any time</li>
                  <li>Shared job history for your team</li>
                </ul>
                <Link href="/app/billing" className={`${s.btn} ${s.btnSolid}`}>Start with your team</Link>
              </article>
              <article className={s.plan}>
                <h3 className={`${s.serif} ${s.planName}`}>Private install</h3>
                <div><span className={s.price} style={{ fontSize: 40 }}>By arrangement</span></div>
                <ul className={s.points}>
                  <li>Runs in your bank’s own cloud</li>
                  <li>Your own model account: Anthropic, AWS Bedrock or Google Vertex</li>
                  <li>Nothing leaves your network</li>
                </ul>
                <Link href="/early-access?plan=private" className={`${s.btn} ${s.btnDark}`}>Arrange a consultation</Link>
              </article>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.ivory}`} aria-labelledby="learn-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Learn</span>
              <h2 id="learn-h" className={`${s.serif} ${s.h2}`}>
                Learn FLEXCUBE development, <em className={s.gold}>free.</em>
              </h2>
            </div>
            <div className={s.learnGrid}>
              {ARTICLES.slice(0, 6).map((a) => (
                <Link key={a.slug} href={`/learn/${a.slug}`} className={s.learnCard}>
                  <span className={s.learnT}>{a.title}</span>
                  <span className={s.learnD}>{a.description}</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 32 }}><Link href="/learn" className={s.textLink}>All guides</Link></p>
          </div>
        </section>

        <section id="faq" className={s.section} aria-labelledby="faq-h">
          <div className={s.wrap}>
            <div className={s.split}>
              <span className={s.eyebrow}>Questions</span>
              <h2 id="faq-h" className={`${s.serif} ${s.h2}`}>
                What FLEXCUBE teams <em className={s.gold}>ask us.</em>
              </h2>
            </div>
            <div className={s.faq}>
              {faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={s.cta} aria-labelledby="cta-h">
          <div className={`${s.ctaInner} ${s.onNavy}`}>
            <span className={s.eyebrow}>Begin the conversation</span>
            <h2 id="cta-h" className={`${s.serif} ${s.ctaH}`}>
              Planning a FLEXCUBE change? <em className={s.gold}>Let’s forge it.</em>
            </h2>
            <p className={s.ctaP}>Bring a requirement and your objects. Leave with files ready for ODT.</p>
            <Link href="/app" className={s.btn}>Start a job <Arrow /></Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
