import type { Metadata } from "next";
import { getAllArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleListing from "@/components/ArticleListing";
import PageHeader from "@/components/PageHeader";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const config = ARTICLE_SECTION_CONFIG.guides;

export const metadata: Metadata = buildPageMetadata(
  config.label,
  config.fallbackDescription,
  config.path
);

export default async function GuidesListingPage() {
  let articles;
  try {
    articles = await getAllArticles({
      type: "blog",
      category: config.categorySlug,
    });
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
          articles={articles ?? []}
          emptyText="目前沒有建議與指引文章"
          isError={articles === null}
          errorText="建議與指引暫時無法載入"
          basePath={config.path}
        />
      </section>
    </>
  );
}
