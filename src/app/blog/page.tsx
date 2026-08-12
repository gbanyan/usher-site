import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleListing from "@/components/ArticleListing";
import PageHeader from "@/components/PageHeader";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const config = ARTICLE_SECTION_CONFIG.blog;

export const metadata: Metadata = buildPageMetadata(
  config.label,
  config.fallbackDescription,
  config.path
);

export default async function BlogListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "blog", per_page: 100 });
  } catch {
    articles = null;
  }

  // The blog listing excludes articles curated into the story/guides sections.
  const regularBlogArticles = (articles?.data ?? []).filter((article) => {
    const categorySlugs =
      article.categories?.map((category) => category.slug) ?? [];
    return (
      !categorySlugs.includes("guides") && !categorySlugs.includes("story")
    );
  });

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.fallbackDescription}
        items={[{ label: config.label }]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <ArticleListing
          articles={regularBlogArticles}
          emptyText="目前沒有文章"
          isError={articles === null}
          errorText="文章暫時無法載入"
        />
      </section>
    </>
  );
}
