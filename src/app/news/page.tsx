import type { Metadata } from "next";
import { getAllArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleListing from "@/components/ArticleListing";
import PageHeader from "@/components/PageHeader";
import { NEWS_LISTING, isNewsArticle } from "@/lib/article-sections";

export const metadata: Metadata = buildPageMetadata(
  NEWS_LISTING.label,
  NEWS_LISTING.description,
  NEWS_LISTING.path
);

function publishedTime(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

export default async function NewsListingPage() {
  let articles;
  try {
    const [blog, notice] = await Promise.all([
      getAllArticles({ type: "blog" }),
      getAllArticles({ type: "notice" }),
    ]);
    articles = [...blog, ...notice]
      .filter(isNewsArticle)
      .sort(
        (a, b) => publishedTime(b.published_at) - publishedTime(a.published_at)
      );
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title={NEWS_LISTING.label}
        description={NEWS_LISTING.description}
        items={[{ label: NEWS_LISTING.label }]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <ArticleListing
          articles={articles ?? []}
          emptyText="目前沒有活動與公告"
          isError={articles === null}
          errorText="活動與公告暫時無法載入"
        />
      </section>
    </>
  );
}
