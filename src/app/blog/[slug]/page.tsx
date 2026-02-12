import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getArticle, getAllArticleSlugs } from "@/lib/api";
import { formatDate, stripMarkdown } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ArticleCard from "@/components/ArticleCard";
import ArticleAttachments from "@/components/ArticleAttachments";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs("blog");
  return slugs.map((slug) => ({ slug }));
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
    return {
      title: article.title,
      description: article.meta_description || stripMarkdown(article.excerpt || ""),
    };
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
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
    <>
      <PageHeader
        title={article.title}
        items={[
          { label: "部落格", href: "/blog" },
          { label: article.title },
        ]}
        description={article.published_at ? formatDate(article.published_at) : undefined}
      />

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        {/* Metadata */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
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
                  className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
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
                  className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs text-white/80"
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
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </figure>
        )}

        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={article.content} />
        </div>

        <ArticleAttachments articleSlug={slug} attachments={article.attachments} />

        {related.length > 0 && (
          <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-white"
            >
              相關文章
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </section>
        )}
      </article>

      <nav className="mx-auto max-w-4xl px-6 pb-12 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-medium text-accent transition-colors hover:text-accent-light"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">返回部落格列表</span>
        </Link>
      </nav>
    </>
  );
}
