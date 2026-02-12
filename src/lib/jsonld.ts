import { getSiteUrl } from "./site";

const ORG_NAME = "台灣尤塞氏症暨視聽弱協會";
const ORG_DESCRIPTION =
  "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症（Usher Syndrome）及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。";

export function getOrganizationSchema(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: ORG_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressCountry: "TW",
      addressRegion: "台北市",
      addressLocality: "中正區",
      streetAddress: "忠孝西路一段50號14樓之20、22號",
    },
    sameAs: [
      "https://line.me/ti/g2/53ghCyQ0KSgYg4vKqt3GT19pWRe0PKydKIrGUQ",
      "https://www.facebook.com/groups/ushersyndrometw",
    ],
    email: "president@usher.org.tw",
  };
}

export function getArticleSchema(
  article: {
    title: string;
    meta_description: string | null;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
    author_name: string | null;
  },
  pathname: string,
  fallbackDescription: string
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${pathname}`;
  const description =
    article.meta_description || article.excerpt || fallbackDescription;
  const image = article.featured_image_url
    ? (article.featured_image_url.startsWith("http")
        ? article.featured_image_url
        : `${siteUrl}${article.featured_image_url}`)
    : `${siteUrl}/og-default.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    url,
    image,
    datePublished: article.published_at || undefined,
    dateModified: article.published_at || undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : { "@type": "Organization", name: ORG_NAME },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo.png`,
      },
    },
  };
}

export function getWebPageSchema(
  name: string,
  description: string,
  pathname: string
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${pathname}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      url: siteUrl,
    },
  };
}
