import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = buildPageMetadata(
  "相關報導",
  "與尤塞氏症相關的新聞報導與媒體報導",
  "/related-news"
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
        title="相關報導"
        description="與尤塞氏症相關的新聞報導與媒體報導"
        items={[
          { label: "相關報導" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        {articles && articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">目前沒有相關報導</p>
        )}
      </section>
    </>
  );
}
