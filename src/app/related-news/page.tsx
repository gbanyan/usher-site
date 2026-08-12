import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleListing from "@/components/ArticleListing";
import PageHeader from "@/components/PageHeader";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const config = ARTICLE_SECTION_CONFIG.related_news;

export const metadata: Metadata = buildPageMetadata(
  config.label,
  config.fallbackDescription,
  config.path
);

export default async function RelatedNewsListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "related_news", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.fallbackDescription}
        items={[{ label: config.label }]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <ArticleListing
          articles={articles?.data ?? []}
          emptyText="目前沒有相關報導"
          isError={articles === null}
          errorText="相關報導暫時無法載入"
        />
      </section>
    </>
  );
}
