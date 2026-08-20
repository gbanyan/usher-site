import type { Metadata } from "next";
import { getAllArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleListing from "@/components/ArticleListing";
import PageHeader from "@/components/PageHeader";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const config = ARTICLE_SECTION_CONFIG.story;

export const metadata: Metadata = buildPageMetadata(
  config.label,
  config.fallbackDescription,
  config.path
);

export default async function StoryListingPage() {
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
          emptyText="目前沒有故事文章"
          isError={articles === null}
          errorText="病友故事暫時無法載入"
          basePath={config.path}
        />
      </section>
    </>
  );
}
