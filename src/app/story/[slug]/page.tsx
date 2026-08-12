import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";
import { getArticle, getArticles } from "@/lib/api";
import { buildArticleMetadata } from "@/lib/metadata";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

const STORY_CATEGORY_SLUG = ARTICLE_SECTION_CONFIG.story.categorySlug!;

export async function generateStaticParams() {
  try {
    const res = await getArticles({
      type: "blog",
      category: STORY_CATEGORY_SLUG,
      per_page: 500,
    });
    return res.data.map((article) => ({ slug: article.slug }));
  } catch {
    return [];
  }
}

interface StoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    const isStory = article.categories?.some(
      (category) => category.slug === STORY_CATEGORY_SLUG
    );
    if (!isStory) {
      return { title: "文章未找到" };
    }

    return buildArticleMetadata(
      article,
      `/story/${slug}`,
      ARTICLE_SECTION_CONFIG.story.fallbackDescription
    );
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function StoryDetailPage({
  params,
}: StoryDetailPageProps) {
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

  const isStory = article.categories?.some(
    (category) => category.slug === STORY_CATEGORY_SLUG
  );
  if (!isStory) {
    notFound();
  }

  return (
    <ArticleDetail type="story" slug={slug} article={article} related={related} />
  );
}
