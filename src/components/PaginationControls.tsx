"use client";

import { getPaginationPages, type PaginationPage } from "@/lib/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label: string;
}

function getPageLabel(page: PaginationPage) {
  if (page === "ellipsis-start" || page === "ellipsis-end") return "…";
  return String(page);
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <nav
      aria-label={label}
      className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-gray-300" aria-live="polite">
        顯示第 {from}–{to} 筆，共 {totalItems} 筆
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`上一頁，共 ${totalPages} 頁`}
        >
          上一頁
        </button>

        {pages.map((page) => {
          const isEllipsis = typeof page !== "number";
          if (isEllipsis) {
            return (
              <span
                key={page}
                aria-hidden="true"
                className="px-1 text-gray-400"
              >
                {getPageLabel(page)}
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`第 ${page} 頁`}
              className={
                isCurrent
                  ? "min-w-9 rounded-md bg-accent px-2.5 py-1.5 text-sm font-semibold text-primary-dark"
                  : "min-w-9 rounded-md border border-white/20 px-2.5 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10"
              }
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`下一頁，共 ${totalPages} 頁`}
        >
          下一頁
        </button>
      </div>
    </nav>
  );
}
