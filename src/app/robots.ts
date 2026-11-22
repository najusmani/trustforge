import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Private areas stay out of search results; search engines and AI crawlers are welcome everywhere else. */
const PRIVATE = ["/app", "/admin", "/api/", "/invite/", "/sign-in/confirm", "/sign-in/check-email"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // AI search and assistants (named so they're explicitly allowed to read the public pages and guides)
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"], allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
