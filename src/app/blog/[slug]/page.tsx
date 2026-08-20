import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";
import { getAllArticles, getArticle } from "@/lib/api";
import { buildArticleMetadata } from "@/lib/metadata";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

export async function generateStaticParams() {
  try {
    const articles = await getAllArticles({ type: "blog" });
    return articles
      .filter((article) => {
        const categories = article.categories?.map((category) => category.slug) ?? [];
        return !categories.includes("guides") && !categories.includes("story");
      })
      .map((article) => ({ slug: article.slug }));
  } catch {
    return [];
  }
}

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    const isCurated = article.categories?.some((category) =>
      ["guides", "story"].includes(category.slug)
    );
    if (isCurated) return { title: "文章未找到" };

    return buildArticleMetadata(
      article,
      `/blog/${slug}`,
      ARTICLE_SECTION_CONFIG.blog.fallbackDescription
    );
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function BlogDetailPage({
  params,
}: BlogDetailPageProps) {
  const { slug } = await params;

  let article;
  let related;
  try {
    const response = await getArticle(slug);
    article = response.data;
    related = response.related;
  } catch {
    notFound();
  }

  const isCurated = article.categories?.some((category) =>
    ["guides", "story"].includes(category.slug)
  );
  if (isCurated) notFound();

  return (
    <ArticleDetail type="blog" slug={slug} article={article} related={related} />
  );
}
