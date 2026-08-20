export type PaginationPage = number | "ellipsis-start" | "ellipsis-end";

export function paginateItems<T>(
  items: T[],
  requestedPage: number,
  pageSize: number
) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(
    Math.max(1, Math.floor(requestedPage) || 1),
    totalPages
  );
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    currentPage,
    totalPages,
    pageSize: safePageSize,
  };
}

export function getPaginationPages(
  currentPage: number,
  totalPages: number
): PaginationPage[] {
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(currentPage) || 1),
    safeTotalPages
  );

  if (safeTotalPages <= 7) {
    return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
  }

  const candidates = new Set([
    1,
    safeTotalPages,
    safeCurrentPage - 1,
    safeCurrentPage,
    safeCurrentPage + 1,
  ]);
  const pages = Array.from(candidates)
    .filter((page) => page >= 1 && page <= safeTotalPages)
    .sort((a, b) => a - b);
  const result: PaginationPage[] = [];

  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous && page - previous > 1) {
      result.push(index === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    result.push(page);
  });

  return result;
}
