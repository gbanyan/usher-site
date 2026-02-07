import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "部落格",
  description: "協會成員分享的生活經驗與心得",
};

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const articles = await getArticles({ type: "blog", page });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "首頁", href: "/" },
          { label: "部落格" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            部落格
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            協會成員分享的生活經驗與心得
          </p>
        </header>

        {articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">目前沒有文章</p>
        )}

        {articles.meta.last_page > 1 && (
          <Pagination
            currentPage={articles.meta.current_page}
            lastPage={articles.meta.last_page}
            basePath="/blog"
          />
        )}
      </section>
    </>
  );
}
