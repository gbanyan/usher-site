import type { Metadata } from "next";
import { getSiteUrl } from "./site";
import { stripMarkdown } from "./utils";

const DEFAULT_OG_IMAGE = "/og-default.jpg";

/**
 * Build metadata for article pages (blog, notice, document, related-news, guides, story).
 */
export function buildArticleMetadata(
  article: {
    title: string;
    meta_description: string | null;
    meta_keywords?: string | null;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
  },
  pathname: string,
  fallbackDescription: string
): Metadata {
  const siteUrl = getSiteUrl();
  const rawDesc = article.meta_description || article.excerpt || fallbackDescription;
  const description = stripMarkdown(rawDesc);
  const image = article.featured_image_url || DEFAULT_OG_IMAGE;
  const url = `${siteUrl}${pathname}`;

  return {
    title: article.title,
    description,
    keywords: article.meta_keywords || undefined,
    openGraph: {
      title: article.title,
      description,
      url,
      type: "article",
      publishedTime: article.published_at || undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Build metadata for static pages (about, contact, [pageSlug]).
 */
export function buildPageMetadata(
  title: string,
  description: string,
  pathname: string,
  options?: {
    image?: string;
    keywords?: string;
  }
): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${pathname}`;
  const image = options?.image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords: options?.keywords || undefined,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}
