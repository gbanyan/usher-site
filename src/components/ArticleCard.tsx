import Link from "next/link";
import Image from "next/image";
import type { ArticleSummary } from "@/lib/types";
import { CONTENT_TYPE_PATHS } from "@/lib/types";
import { formatDate, stripMarkdown } from "@/lib/utils";

interface ArticleCardProps {
  article: ArticleSummary;
  showType?: boolean;
}

export default function ArticleCard({
  article,
  showType = false,
}: ArticleCardProps) {
  const basePath = CONTENT_TYPE_PATHS[article.content_type];
  const articleUrl = `${basePath}/${article.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-primary/40 shadow-sm transition-shadow hover:shadow-md hover:shadow-accent/50">
      {/* Pinned indicator */}
      {article.is_pinned && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary-dark shadow">
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
          <span>置頂</span>
        </div>
      )}

      {/* Featured image */}
      <Link href={articleUrl} tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/80 to-primary-light/60">
          {article.featured_image_url ? (
            <Image
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 bg-primary-dark/80 backdrop-blur-sm">
        {/* Meta: type badge + date */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {showType && (
            <span className="inline-block rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {article.content_type_label}
            </span>
          )}
          {article.published_at && (
            <time
              dateTime={article.published_at}
              className="text-xs text-gray-400"
            >
              {formatDate(article.published_at)}
            </time>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base font-semibold leading-snug text-white">
          <Link
            href={articleUrl}
            className="after:absolute after:inset-0 hover:text-accent transition-colors"
          >
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="mb-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-300">
            {stripMarkdown(article.excerpt)}
          </p>
        )}

        {/* Categories */}
        {article.categories?.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {article.categories.map((category) => (
              <span
                key={category.id}
                className="inline-block rounded-full border border-white/20 px-2 py-0.5 text-xs text-gray-400"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
