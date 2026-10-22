import { getSiteUrl } from "./site";
import { stripMarkdown } from "./utils";

const DEFAULT_OG_IMAGE = "/images/banner/hero-support.jpg";

const ZH_SITE_NAME = "台灣尤塞氏症暨視聽弱協會";
const ZH_HOME_TITLE = "台灣尤塞氏症暨視聽弱協會 | 尤塞氏症以及視聽雙弱者之病友團體";
const ZH_HOME_DESCRIPTION =
  "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症（Usher Syndrome）及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。";
const EN_SITE_NAME = "Taiwan Usher Syndrome and Deafblind Association";
const EN_HOME_DESCRIPTION =
  "Supporting people with Usher syndrome and deafblind people through connection, resources, advocacy, and community.";

export interface PageMeta {
  title: string;
  /** When true, the layout must not append the site-name suffix. */
  absoluteTitle?: boolean;
  description: string;
  canonical: string;
  keywords?: string;
  ogType: "website" | "article";
  image: string;
  publishedTime?: string;
  locale: "zh_TW" | "en_US";
  siteName: string;
  alternates?: { "zh-TW": string; en: string };
}

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
): PageMeta {
  const rawDesc = article.meta_description || article.excerpt || fallbackDescription;

  return {
    title: article.title,
    description: stripMarkdown(rawDesc),
    canonical: `${getSiteUrl()}${pathname}`,
    keywords: article.meta_keywords || undefined,
    ogType: "article",
    image: article.featured_image_url || DEFAULT_OG_IMAGE,
    publishedTime: article.published_at || undefined,
    locale: "zh_TW",
    siteName: ZH_SITE_NAME,
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
): PageMeta {
  return {
    title,
    description,
    canonical: `${getSiteUrl()}${pathname}`,
    keywords: options?.keywords || undefined,
    ogType: "website",
    image: options?.image || DEFAULT_OG_IMAGE,
    locale: "zh_TW",
    siteName: ZH_SITE_NAME,
  };
}

/**
 * Build metadata for the zh-TW home page (/) and the English home page (/en).
 */
export function buildHomeMetadata(lang: "zh-TW" | "en"): PageMeta {
  const siteUrl = getSiteUrl();
  const alternates = { "zh-TW": `${siteUrl}/`, en: `${siteUrl}/en` };
  const isEn = lang === "en";

  return {
    title: isEn ? EN_SITE_NAME : ZH_HOME_TITLE,
    absoluteTitle: true,
    description: isEn ? EN_HOME_DESCRIPTION : ZH_HOME_DESCRIPTION,
    canonical: isEn ? alternates.en : alternates["zh-TW"],
    ogType: "website",
    image: DEFAULT_OG_IMAGE,
    locale: isEn ? "en_US" : "zh_TW",
    siteName: isEn ? EN_SITE_NAME : ZH_SITE_NAME,
    alternates,
  };
}
