import Link from "next/link";
import Image from "next/image";
import type { ArticleSummary } from "@/lib/types";
import { CONTENT_TYPE_PATHS } from "@/lib/types";
import { formatDate, stripMarkdown } from "@/lib/utils";

interface ArticleCardProps {
  article: ArticleSummary;
  showType?: boolean;
  basePath?: string;
}

function ArticlePlaceholderIcon({ article }: { article: ArticleSummary }) {
  const cls = "h-12 w-12 text-white/30";
  const categorySlugs = article.categories?.map((c) => c.slug) ?? [];

  if (article.content_type === "notice") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 11.25l9-3.75v9l-9-3.75v-1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 13.125V16.5A1.5 1.5 0 008.25 18h1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.75 9a3.75 3.75 0 013.75 3.75 3.75 3.75 0 01-3.75 3.75" />
      </svg>
    );
  }

  if (article.content_type === "related_news") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 5.25h15v13.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V5.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h3v3h-3v-3zM12.75 8.25h3.75M12.75 10.5h3.75M7.5 13.5h9M7.5 15.75h9" />
      </svg>
    );
  }

  if (article.content_type === "document") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }

  if (categorySlugs.includes("guides")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 5.25A2.25 2.25 0 016.75 3h11.25v15.75H6.75A2.25 2.25 0 004.5 21V5.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 7.5h6.75M8.25 10.5h6.75M8.25 13.5h4.5" />
      </svg>
    );
  }

  if (categorySlugs.includes("story")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 7.875a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.875 19.125a7.125 7.125 0 0114.25 0" />
      </svg>
    );
  }

  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 3.75l4.5 4.5M18 6l-9.75 9.75L6 20.25l4.5-2.25L20.25 8.25a1.591 1.591 0 000-2.25l-1.5-1.5a1.591 1.591 0 00-2.25 0z" />
    </svg>
  );
}

export default function ArticleCard({
  article,
  showType = false,
  basePath,
}: ArticleCardProps) {
  const resolveBasePath = () => {
    if (basePath) return basePath;

    if (article.content_type === "blog") {
      const categorySlugs = article.categories?.map((c) => c.slug) ?? [];
      if (categorySlugs.includes("guides")) return "/guides";
      if (categorySlugs.includes("story")) return "/story";
    }

    return CONTENT_TYPE_PATHS[article.content_type];
  };

  const articleUrl = `${resolveBasePath()}/${article.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-primary/40 shadow-sm transition-shadow hover:shadow-md hover:shadow-accent/50" aria-labelledby={`article-title-${article.id}`}>
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
              <ArticlePlaceholderIcon article={article} />
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
              aria-label={`發佈日期：${formatDate(article.published_at)}`}
            >
              {formatDate(article.published_at)}
            </time>
          )}
        </div>

        {/* Title */}
        <h3 id={`article-title-${article.id}`} className="mb-2 text-base font-semibold leading-snug text-white">
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
