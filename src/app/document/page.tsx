import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "協會文件",
  description: "協會相關文件與資源",
};

export default async function DocumentListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "document", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title="協會文件"
        description="協會相關文件與資源"
        items={[
          { label: "協會文件" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {articles && articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} showExcerpt={false} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">目前沒有文件</p>
        )}
      </section>
    </>
  );
}
