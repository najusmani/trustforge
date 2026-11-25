import { ARTICLES } from "@/lib/learn";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt (https://llmstxt.org): a plain summary of the site for AI assistants and answer engines. */
export function GET() {
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.name} is built by ${SITE.companyLegal} (${SITE.locality}, ${SITE.region}, Canada). It supports Oracle FLEXCUBE Universal Banking (FCUBS) and Oracle Banking Payments (OBPM) releases 14.6 and 14.7, including OBPM Java screens and processing hooks (PMTM_EXTENSION_CLASSES). Work follows Oracle's extensibility rules: changes go in the CUSTOM layer, Oracle-shipped values are never edited, and every output is loaded and compiled by the bank's own team in ODT (Open Development Tool, also called the Development Workbench, formerly the RAD tool).`,
    "",
    "## What it does",
    "",
    "- Customize an existing FLEXCUBE screen: add fields, blocks, LOVs and validations to a function's radxml",
    "- Design a new FLEXCUBE screen (maintenance, online, call form, launch form, report, dashboard) from tables and a requirement",
    "- Write CUSTOM hook packages (<MOD>PKS_<FID>_CUSTOM) and release JavaScript (<FID>_CUSTOM.js)",
    "- Prepare Silent ODT configurations for bulk generation and SOAP/REST service artifacts",
    "- Review a radxml and its hooks against ODT rules",
    "- Answer FLEXCUBE ODT and development questions",
    "",
    "## Learn FLEXCUBE development",
    "",
    ...ARTICLES.map((a) => `- [${a.title}](${SITE.url}/learn/${a.slug}): ${a.description}`),
    "",
    "## Product",
    "",
    `- [Home](${SITE.url}/): overview, how it works, plans and FAQ`,
    `- [All guides](${SITE.url}/learn): FLEXCUBE customization and ODT learning hub`,
    `- [Early access](${SITE.url}/early-access)`,
    `- [Terms](${SITE.url}/terms), [Privacy](${SITE.url}/privacy), [Refunds](${SITE.url}/refunds)`,
    "",
    "## Contact",
    "",
    `- ${SITE.email}`,
    `- ${SITE.companyUrl}`,
    "",
    "Oracle and FLEXCUBE are registered trademarks of Oracle and/or its affiliates. TrustForge is independent and not affiliated with or endorsed by Oracle.",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
