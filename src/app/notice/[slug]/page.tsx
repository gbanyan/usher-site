import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";
import { getAllArticleSlugs, getArticle } from "@/lib/api";
import { buildArticleMetadata } from "@/lib/metadata";
import { ARTICLE_SECTION_CONFIG } from "@/lib/article-sections";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs("notice");
  return slugs.map((slug) => ({ slug }));
}

interface NoticeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NoticeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    return buildArticleMetadata(
      article,
      `/notice/${slug}`,
      ARTICLE_SECTION_CONFIG.notice.fallbackDescription
    );
  } catch {
    return { title: "公告未找到" };
  }
}

export default async function NoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
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
      type="notice"
      slug={slug}
      article={article}
      related={related}
    />
  );
}
