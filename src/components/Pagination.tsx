import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

function buildPageUrl(
  basePath: string,
  page: number,
  searchParams?: Record<string, string>
): string {
  const params = new URLSearchParams(searchParams);
  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function getPageNumbers(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < last - 2) {
    pages.push("ellipsis");
  }

  pages.push(last);

  return pages;
}

export default function Pagination({
  currentPage,
  lastPage,
  basePath,
  searchParams,
}: PaginationProps) {
  if (lastPage <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, lastPage);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <nav
      aria-label="分頁導覽"
      className="mt-8 flex items-center justify-center"
    >
      <ul className="inline-flex items-center gap-1">
        {/* Previous */}
        <li>
          {hasPrev ? (
            <Link
              href={buildPageUrl(basePath, currentPage - 1, searchParams)}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
              aria-label="上一頁"
              rel="prev"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              上一頁
            </Link>
          ) : (
            <span
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-medium text-gray-400"
              aria-disabled="true"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              上一頁
            </span>
          )}
        </li>

        {/* Page numbers */}
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true">
              <span className="inline-flex h-10 w-10 items-center justify-center text-sm text-gray-400">
                ...
              </span>
            </li>
          ) : (
            <li key={page}>
              {page === currentPage ? (
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
                  aria-current="page"
                  aria-label={`第 ${page} 頁，目前所在頁面`}
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={buildPageUrl(basePath, page, searchParams)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
                  aria-label={`前往第 ${page} 頁`}
                >
                  {page}
                </Link>
              )}
            </li>
          )
        )}

        {/* Next */}
        <li>
          {hasNext ? (
            <Link
              href={buildPageUrl(basePath, currentPage + 1, searchParams)}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
              aria-label="下一頁"
              rel="next"
            >
              下一頁
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <span
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-medium text-gray-400"
              aria-disabled="true"
            >
              下一頁
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
