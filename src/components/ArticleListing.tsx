import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleSummary } from "@/lib/types";

interface ArticleListingProps {
  articles: ArticleSummary[];
  emptyText: string;
  errorText?: string;
  isError?: boolean;
  basePath?: string;
}

/**
 * Shared grid + empty state for the article listing pages. The empty state
 * mirrors the existing document-page pattern: a promise to check back later
 * and a direct route to the association.
 */
export default function ArticleListing({
  articles,
  emptyText,
  errorText,
  isError = false,
  basePath,
}: ArticleListingProps) {
  if (isError) {
    return (
      <div
        className="rounded-xl border border-dashed border-white/20 bg-primary/40 px-6 py-12 text-center"
        role="alert"
      >
        <p className="text-base font-medium text-white">
          {errorText ?? "內容暫時無法載入"}
        </p>
        <p className="mt-2 text-sm text-gray-300">
          請稍後重新整理頁面；若問題持續，請聯絡協會。
        </p>
        <div className="mt-4">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary-dark hover:bg-accent-light"
          >
            聯絡協會
          </Link>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-white/20 bg-primary/40 px-6 py-12 text-center"
        role="status"
      >
        <p className="text-base font-medium text-white">{emptyText}</p>
        <p className="mt-2 text-sm text-gray-300">
          可稍後再查看，或直接聯絡協會洽詢。
        </p>
        <div className="mt-4">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary-dark hover:bg-accent-light"
          >
            聯絡協會
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} basePath={basePath} />
      ))}
    </div>
  );
}
