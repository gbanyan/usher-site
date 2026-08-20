import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";
import { getAllArticles, getArticle } from "@/lib/api";
import { buildArticleMetadata } from "@/lib/metadata";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const GUIDES_CATEGORY_SLUG = ARTICLE_SECTION_CONFIG.guides.categorySlug!;

export async function generateStaticParams() {
  try {
    const articles = await getAllArticles({
      type: "blog",
      category: GUIDES_CATEGORY_SLUG,
    });
    return articles.map((article) => ({ slug: article.slug }));
  } catch {
    return [];
  }
}

interface GuidesDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GuidesDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    const isGuide = article.categories?.some(
      (category) => category.slug === GUIDES_CATEGORY_SLUG
    );
    if (!isGuide) {
      return { title: "文章未找到" };
    }

    return buildArticleMetadata(
      article,
      `/guides/${slug}`,
      ARTICLE_SECTION_CONFIG.guides.fallbackDescription
    );
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function GuidesDetailPage({
  params,
}: GuidesDetailPageProps) {
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

  const isGuide = article.categories?.some(
    (category) => category.slug === GUIDES_CATEGORY_SLUG
  );
  if (!isGuide) {
    notFound();
  }

  return (
    <ArticleDetail
      type="guides"
      slug={slug}
      article={article}
      related={related}
    />
  );
}
