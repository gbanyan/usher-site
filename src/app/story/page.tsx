import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = buildPageMetadata(
  "病友故事",
  "病友與家屬的真實經驗分享",
  "/story"
);

export default async function StoryListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "blog", category: "story", per_page: 100 });
  } catch {
    articles = null;
  }

  return (
    <>
      <PageHeader
        title="病友故事"
        description="病友與家屬的真實經驗分享"
        items={[{ label: "病友故事" }]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {articles && articles.data.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} basePath="/story" />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">目前沒有故事文章</p>
        )}
      </section>
    </>
  );
}
