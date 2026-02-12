import type { Metadata } from "next";
import { getArticles } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import ArticleCard from "@/components/ArticleCard";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = buildPageMetadata(
  "部落格",
  "協會成員分享的生活經驗與心得",
  "/blog"
);

export default async function BlogListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "blog", per_page: 100 });
  } catch {
    articles = null;
  }

  const regularBlogArticles = (articles?.data ?? []).filter((article) => {
    const categorySlugs = article.categories?.map((category) => category.slug) ?? [];
    return !categorySlugs.includes("guides") && !categorySlugs.includes("story");
  });

  return (
    <>
      <PageHeader
        title="部落格"
        description="協會成員分享的生活經驗與心得"
        items={[
          { label: "部落格" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        {articles && regularBlogArticles.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {regularBlogArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">目前沒有文章</p>
        )}
      </section>
    </>
  );
}
