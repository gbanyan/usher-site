import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "建議與指引",
  description: "尤塞氏症相關照護、資源與實務建議",
};

export default async function GuidesListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "blog", category: "guides", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title="建議與指引"
        description="尤塞氏症相關照護、資源與實務建議"
        items={[{ label: "建議與指引" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {articles && articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">目前沒有建議與指引文章</p>
        )}
      </section>
    </>
  );
}
