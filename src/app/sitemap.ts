import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/learn";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...ARTICLES.map((a) => ({
      url: `${SITE.url}/learn/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE.url}/early-access`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
