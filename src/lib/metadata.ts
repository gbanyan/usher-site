import { getSiteUrl } from "./site";
import { stripMarkdown } from "./utils";

const DEFAULT_OG_IMAGE = "/images/banner/hero-support.jpg";

const ZH_SITE_NAME = "台灣尤塞氏症暨視聽弱協會";
const ZH_HOME_DESCRIPTION =
  "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症（Usher Syndrome）及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。";
const ZH_HOME_OG_DESCRIPTION =
  "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。";
const EN_SITE_NAME = "Taiwan Usher Syndrome and Deafblind Association";
const EN_HOME_DESCRIPTION =
  "Supporting people with Usher syndrome and deafblind people through connection, resources, advocacy, and community.";

export interface PageMeta {
  title: string;
  /** When true, the layout must not append the site-name suffix. */
  absoluteTitle?: boolean;
  description: string;
  /** og:/twitter: description when production differs from the meta description. */
  ogDescription?: string;
  canonical: string;
  /** Emitted as og:url only when set (production omits it on /en). */
  ogUrl?: string;
  keywords?: string;
  /** Emitted only when set; production omits og:type on the zh-TW home page. */
  ogType?: "website" | "article";
  image: string;
  publishedTime?: string;
  /** og:locale / og:site_name are emitted only when set (production: /en only). */
  locale?: "zh_TW" | "en_US";
  siteName?: string;
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
    ogUrl: `${getSiteUrl()}${pathname}`,
    keywords: article.meta_keywords || undefined,
    ogType: "article",
    image: article.featured_image_url || DEFAULT_OG_IMAGE,
    publishedTime: article.published_at || undefined,
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
    ogUrl: `${getSiteUrl()}${pathname}`,
    keywords: options?.keywords || undefined,
    ogType: "website",
    image: options?.image || DEFAULT_OG_IMAGE,
  };
}

/**
 * Build metadata for the zh-TW home page (/) and the English home page (/en).
 */
export function buildHomeMetadata(lang: "zh-TW" | "en"): PageMeta {
  const siteUrl = getSiteUrl();

  if (lang === "en") {
    return {
      title: EN_SITE_NAME,
      absoluteTitle: true,
      description: EN_HOME_DESCRIPTION,
      canonical: `${siteUrl}/en`,
      ogType: "website",
      image: DEFAULT_OG_IMAGE,
      locale: "en_US",
      siteName: EN_SITE_NAME,
      alternates: { "zh-TW": siteUrl, en: `${siteUrl}/en` },
    };
  }

  return {
    title: ZH_SITE_NAME,
    absoluteTitle: true,
    description: ZH_HOME_DESCRIPTION,
    ogDescription: ZH_HOME_OG_DESCRIPTION,
    canonical: siteUrl,
    ogUrl: siteUrl,
    image: DEFAULT_OG_IMAGE,
  };
}
