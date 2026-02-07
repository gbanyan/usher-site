import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "事務公告",
  description: "協會重要公告與通知事項",
};

export default async function NoticeListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "notice", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "首頁", href: "/" },
          { label: "事務公告" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            事務公告
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            協會重要公告與通知事項
          </p>
        </header>

        {articles && articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">目前沒有公告</p>
        )}
      </section>
    </>
  );
}
