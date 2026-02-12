import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = buildPageMetadata(
  "事務公告",
  "協會重要公告與通知事項",
  "/notice"
);

export default async function NoticeListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "notice", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title="事務公告"
        description="協會重要公告與通知事項"
        items={[
          { label: "事務公告" },
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
          <p className="py-12 text-center text-gray-400">目前沒有公告</p>
        )}
      </section>
    </>
  );
}
