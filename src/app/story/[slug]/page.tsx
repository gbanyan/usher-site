import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getArticle, getArticles } from "@/lib/api";
import { formatDate, stripMarkdown } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ArticleCard from "@/components/ArticleCard";
import ArticleAttachments from "@/components/ArticleAttachments";

export async function generateStaticParams() {
  try {
    const res = await getArticles({ type: "blog", category: "story", per_page: 500 });
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
    const hasStoryCategory = article.categories?.some((category) => category.slug === "story");
    if (!hasStoryCategory) {
      return { title: "文章未找到" };
    }

    return {
      title: article.title,
      description: article.meta_description || stripMarkdown(article.excerpt || ""),
    };
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { slug } = await params;

  let article;
  let related;
  try {
    const response = await getArticle(slug);
    article = response.data;
    related = response.related.filter((item) =>
      (item.categories ?? []).some((category) => category.slug === "story")
    );
  } catch {
    notFound();
  }

  const hasStoryCategory = article.categories?.some((category) => category.slug === "story");
  if (!hasStoryCategory) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={article.title}
        items={[
          { label: "病友故事", href: "/story" },
          { label: article.title },
        ]}
        description={article.published_at ? formatDate(article.published_at) : undefined}
      />

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {article.author_name && (
              <span>
                <span className="sr-only">作者：</span>
                {article.author_name}
              </span>
            )}
          </div>

          {article.categories?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}

          {article.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {article.featured_image_url && (
          <figure className="mb-8 overflow-hidden rounded-lg">
            <Image
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority
            />
          </figure>
        )}

        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={article.content} />
        </div>

        <ArticleAttachments articleSlug={slug} attachments={article.attachments} />

        {related.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-gray-900"
            >
              相關文章
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} basePath="/story" />
              ))}
            </div>
          </section>
        )}
      </article>

      <nav className="mx-auto max-w-4xl px-6 pb-12 lg:px-8">
        <Link
          href="/story"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-light"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">返回病友故事列表</span>
        </Link>
      </nav>
    </>
  );
}
