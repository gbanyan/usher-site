import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";
import { getAllArticleSlugs, getArticle } from "@/lib/api";
import { buildArticleMetadata } from "@/lib/metadata";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs("related_news");
  return slugs.map((slug) => ({ slug }));
}

interface RelatedNewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RelatedNewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    return buildArticleMetadata(
      article,
      `/related-news/${slug}`,
      ARTICLE_SECTION_CONFIG.related_news.fallbackDescription
    );
  } catch {
    return { title: "報導未找到" };
  }
}

export default async function RelatedNewsDetailPage({
  params,
}: RelatedNewsDetailPageProps) {
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

  return (
    <ArticleDetail
      type="related_news"
      slug={slug}
      article={article}
      related={related}
    />
  );
}
