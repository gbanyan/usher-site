import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getArticle, getAttachmentDownloadUrl } from "@/lib/api";
import { formatDate, formatFileSize } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ArticleCard from "@/components/ArticleCard";

interface DocumentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DocumentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await getArticle(slug);
    return {
      title: article.title,
      description: article.meta_description || article.excerpt,
    };
  } catch {
    return { title: "文件未找到" };
  }
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
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
      <Breadcrumbs
        items={[
          { label: "首頁", href: "/" },
          { label: "協會文件", href: "/document" },
          { label: article.title },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {article.published_at && (
              <time dateTime={article.published_at}>
                {formatDate(article.published_at)}
              </time>
            )}
            {article.author_name && (
              <span>
                <span className="sr-only">作者：</span>
                {article.author_name}
              </span>
            )}
          </div>

          {article.categories.length > 0 && (
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

          {article.tags.length > 0 && (
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
        </header>

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

        {article.attachments.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="attachments-heading">
            <h2
              id="attachments-heading"
              className="text-xl font-semibold text-gray-900"
            >
              附件下載
            </h2>
            <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {article.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={getAttachmentDownloadUrl(slug, attachment.id)}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface"
                    download
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary">
                        {attachment.original_filename}
                      </p>
                      {attachment.description && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-4 shrink-0 text-xs text-gray-400">
                      {formatFileSize(attachment.file_size)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-gray-900"
            >
              相關文件
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </section>
        )}
      </article>

      <nav className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <Link
          href="/document"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-light"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">返回協會文件列表</span>
        </Link>
      </nav>
    </>
  );
}
