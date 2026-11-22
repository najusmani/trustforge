import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { HeroDemo } from "@/components/HeroDemo";
import { Arrow, Check } from "@/components/Logo";

const HOW = [
  { n: "01", title: "Describe", text: "Say what you need in plain words and upload your radxml, tables, packages or JS." },
  { n: "02", title: "Discuss", text: "TrustForge asks only what it needs and builds the plan with you." },
  { n: "03", title: "Build", text: "Approve the plan and watch each file being made and checked." },
  { n: "04", title: "Deliver", text: "Download the files, the deploy order and the tests. Load them in ODT." },
];

const JOBS = [
  "Create a new screen",
  "Customize a function",
  "Review a radxml",
  "Write hook code",
  "Run Silent ODT",
  "Ask about ODT",
];

const SAFETY = [
  { title: "Oracle’s code is never edited", text: "Changes go in the CUSTOM layer. Kernel values are checked and stay exactly as shipped." },
  { title: "You approve before anything is built", text: "TrustForge shows the plan and the files it will make. Nothing is written until you agree." },
  { title: "No secrets in files", text: "Passwords and keys are left as placeholders for your team to fill in." },
  { title: "Your bank’s data stays yours", text: "Uploaded objects are used for your job only. A private install keeps everything in your network." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "",
    hot: false,
    cta: "Start free",
    href: "/early-access?plan=free",
    items: ["Radxml review against ODT rules", "ODT questions answered from the guides", "One person"],
  },
  {
    name: "Partner",
    price: "$500",
    per: "USD per seat / month",
    hot: true,
    cta: "Start with your team",
    href: "/early-access?plan=partner",
    items: ["All six kinds of job", "Start with 1 seat, add more any time", "Shared job history and lessons"],
  },
  {
    name: "Private install",
    price: "Talk to us",
    per: "",
    hot: false,
    cta: "Contact TrustRoute",
    href: "/early-access?plan=private",
    items: [
      "Runs in your bank’s own cloud",
      "Your own model account: Anthropic, AWS Bedrock or Google Vertex",
      "Nothing leaves your network",
    ],
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="hero-h">
          <span className="glow" style={{ right: -120, top: -160, width: 760, height: 560 }} aria-hidden="true" />
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="badge enter d1">
                <span className="dot" />
                For Oracle FLEXCUBE UBS 14.6 and 14.7
              </span>
              <h1 id="hero-h" className="enter d2">
                FLEXCUBE customizations, <em className="ember">forged</em> in conversation.
              </h1>
              <p className="hero-sub enter d3">
                Tell TrustForge what you need and upload your objects. It asks what it’s missing, shows you a plan, and
                builds the radxml, hook packages, JS and scripts, ready to load in ODT.
              </p>
              <div className="hero-actions enter d4">
                <Link className="btn btn-primary" href="/early-access">
                  Start your first job <Arrow />
                </Link>
                <Link className="btn btn-ghost" href="#how">See how it works</Link>
              </div>
              <span className="hero-note enter d5">Free radxml review and ODT questions. No card needed.</span>
            </div>
            <HeroDemo />
          </div>
        </section>

        <section className="strip" aria-label="What makes it different">
          <ul>
            <li><strong>CUSTOM layer only</strong><span>Oracle’s code stays as shipped</span></li>
            <li><strong>Checked before you load</strong><span>Against ODT load and save rules</span></li>
            <li><strong>Nothing without approval</strong><span>You agree the plan first</span></li>
            <li><strong>Proven in FLEXCUBE</strong><span>Verified on 14.7.0.6.0</span></li>
          </ul>
        </section>

        <section id="how" className="section" aria-labelledby="how-h">
          <div className="wrap stack">
            <div className="head reveal">
              <span className="eyebrow">How it works</span>
              <h2 id="how-h" className="h2">
                Like briefing a senior ODT developer. <em className="ember">Only faster.</em>
              </h2>
            </div>
            <ol className="steps">
              {HOW.map((s) => (
                <li key={s.n} className="card lift reveal step">
                  <span className="step-n">{s.n}</span>
                  <span className="step-t">{s.title}</span>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="build" className="section" style={{ paddingTop: 20 }} aria-labelledby="build-h">
          <div className="wrap split">
            <div className="side reveal">
              <span className="eyebrow">What you can build</span>
              <h2 id="build-h" className="h2">
                Six kinds of job. <em className="ember">One conversation.</em>
              </h2>
              <p className="lead">
                Maintenance, online, call and launch forms, reports and dashboards. New functions, or changes to
                Oracle’s own, with every element tagged to your release.
              </p>
            </div>
            <ul className="main jobs">
              {JOBS.map((j, i) => (
                <li key={j} className="card lift reveal job">
                  <span className="job-n">{String(i + 1).padStart(2, "0")}</span>
                  {j}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="proof" aria-labelledby="proof-h">
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div className="head reveal">
              <span className="eyebrow">Built with TrustForge</span>
              <h2 id="proof-h" className="h2">
                Real jobs, on a real <em className="ember">FLEXCUBE</em>.
              </h2>
            </div>
            <div className="cases">
              <article className="card lift reveal case">
                <span className="case-id">STDCURSK</span>
                <h3>Customer risk profile screen</h3>
              </article>
              <article className="card lift reveal case">
                <span className="case-id">IFDATMMN</span>
                <h3>Sixth charge on ARC maintenance</h3>
              </article>
            </div>
          </div>
        </section>

        <section id="safety" className="section" aria-labelledby="safety-h">
          <div className="wrap split" style={{ gap: 56 }}>
            <div className="side reveal">
              <span className="eyebrow">Safety</span>
              <h2 id="safety-h" className="h2">
                Built for how <em className="ember">banks</em> work.
              </h2>
            </div>
            <ul className="main safety">
              {SAFETY.map((s) => (
                <li key={s.title} className="reveal">
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="plans" className="plans-sec" aria-labelledby="plans-h">
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div className="head reveal">
              <span className="eyebrow">Plans</span>
              <h2 id="plans-h" className="h2">
                Start free. <em className="ember">Bring your team</em> when you’re ready.
              </h2>
            </div>
            <div className="plans">
              {PLANS.map((p) => (
                <article key={p.name} className={`card lift reveal plan${p.hot ? " hot" : ""}`}>
                  <div className="plan-top">
                    <h3>{p.name}</h3>
                    {p.hot && <span className="tag">For teams</span>}
                  </div>
                  <span className="price">
                    {p.price}
                    {p.per && <small> {p.per}</small>}
                  </span>
                  <ul>
                    {p.items.map((it) => (
                      <li key={it}>
                        <Check />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Link className={`btn btn-sm ${p.hot ? "btn-solid" : "btn-ghost"}`} href={p.href}>
                    {p.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final" aria-labelledby="cta-h">
          <span
            className="glow"
            style={{ left: "50%", top: "50%", width: 820, height: 420, marginLeft: -410, marginTop: -210 }}
            aria-hidden="true"
          />
          <div className="inner reveal">
            <h2 id="cta-h">
              What shall we <em className="ember">forge</em> first?
            </h2>
            <p className="lead" style={{ fontSize: 18 }}>
              Bring a requirement and your objects. Leave with files ready for ODT.
            </p>
            <Link className="btn btn-primary" href="/early-access">
              Start a job <Arrow />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
