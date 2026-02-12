import type { MetadataRoute } from "next";
import {
  getAllPublicDocumentSlugs,
  getArticles,
  getPublicDocuments,
} from "@/lib/api";
import { getSiteUrl } from "@/lib/site";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "yearly" | "monthly" | "weekly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/notice", priority: 0.8, changeFrequency: "weekly" },
  { path: "/document", priority: 0.8, changeFrequency: "weekly" },
  { path: "/related-news", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/story", priority: 0.8, changeFrequency: "weekly" },
  { path: "/structure", priority: 0.7, changeFrequency: "yearly" },
  { path: "/message", priority: 0.7, changeFrequency: "yearly" },
  { path: "/logo-represent", priority: 0.7, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Blog articles
  try {
    const blogRes = await getArticles({ type: "blog", per_page: 500 });
    for (const a of blogRes.data) {
      entries.push({
        url: `${baseUrl}/blog/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // Snapshot/API may fail during build
  }

  // Notice articles
  try {
    const noticeRes = await getArticles({ type: "notice", per_page: 500 });
    for (const a of noticeRes.data) {
      entries.push({
        url: `${baseUrl}/notice/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  // Related news
  try {
    const newsRes = await getArticles({ type: "related_news", per_page: 500 });
    for (const a of newsRes.data) {
      entries.push({
        url: `${baseUrl}/related-news/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  // Guides (blog with category)
  try {
    const guidesRes = await getArticles({
      type: "blog",
      category: "guides",
      per_page: 500,
    });
    for (const a of guidesRes.data) {
      entries.push({
        url: `${baseUrl}/guides/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  // Story (blog with category)
  try {
    const storyRes = await getArticles({
      type: "blog",
      category: "story",
      per_page: 500,
    });
    for (const a of storyRes.data) {
      entries.push({
        url: `${baseUrl}/story/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  // Documents
  try {
    const docsRes = await getPublicDocuments({ per_page: 500 });
    for (const d of docsRes.data) {
      const updated = d.updated_at || d.published_at;
      entries.push({
        url: `${baseUrl}/document/${d.slug}`,
        lastModified: updated ? new Date(updated) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // Fallback to legacy document slugs
    try {
      const slugs = await getAllPublicDocumentSlugs();
      for (const slug of slugs) {
        entries.push({
          url: `${baseUrl}/document/${slug}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        });
      }
    } catch {
      // ignore
    }
  }

  return entries;
}
