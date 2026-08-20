"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaginationControls from "@/components/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import type { PublicDocumentSummary } from "@/lib/types";

const PAGE_SIZE = 10;

interface PaginatedDocumentListProps {
  documents: PublicDocumentSummary[];
}

export default function PaginatedDocumentList({
  documents,
}: PaginatedDocumentListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pagination = useMemo(
    () => paginateItems(documents, currentPage, PAGE_SIZE),
    [documents, currentPage]
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-white/15 bg-primary-dark/70 shadow-sm shadow-black/20 md:block">
        <table className="min-w-full divide-y divide-white/10">
          <caption className="sr-only">協會文件公開資源列表</caption>
          <thead className="bg-primary/60">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-200"
              >
                文件
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-200"
              >
                分類與文號
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-200"
              >
                版本與更新
              </th>
              <th
                scope="col"
                className="min-w-[10rem] px-6 py-3 text-right text-xs font-semibold text-gray-200"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {pagination.items.map((document) => {
              const detailUrl = `/document/${document.slug}`;
              const updatedAt = document.updated_at || document.published_at;

              return (
                <tr key={document.slug} className="align-top hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={detailUrl}
                        className="text-base font-semibold text-white hover:text-accent"
                      >
                        {document.title}
                      </Link>
                      {document.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-300">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    <div className="flex flex-wrap gap-1.5">
                      {document.category && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-light">
                          {document.category.name}
                        </span>
                      )}
                      <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-gray-300">
                        {document.access_level_label}
                      </span>
                    </div>
                    {document.document_number && (
                      <p className="mt-2 text-xs text-gray-300">
                        文號：{document.document_number}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    <p>版本：{document.current_version?.version_number ?? "-"}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      更新：{updatedAt ? formatDate(updatedAt) : "未設定"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      檔案：{document.current_version?.file_size_human ?? "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-nowrap justify-end gap-2">
                      <Link
                        href={detailUrl}
                        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-accent-light"
                      >
                        查看詳情
                      </Link>
                      {document.links.download_url && (
                        <a
                          href={document.links.download_url}
                          aria-label={`下載「${document.title}」`}
                          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                        >
                          下載
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-4 md:hidden">
        {pagination.items.map((document) => {
          const detailUrl = `/document/${document.slug}`;
          const updatedAt = document.updated_at || document.published_at;

          return (
            <li
              key={document.slug}
              className="rounded-xl border border-white/15 bg-primary-dark/70 p-4 shadow-sm shadow-black/20"
            >
              <h3 className="text-balance text-base font-semibold text-white">
                <Link href={detailUrl} className="hover:text-accent">
                  {document.title}
                </Link>
              </h3>
              {document.description && (
                <p className="mt-2 line-clamp-3 text-pretty text-sm text-gray-300">
                  {document.description}
                </p>
              )}
              <dl className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-200">
                <div>
                  <dt className="sr-only">分類</dt>
                  <dd>分類：{document.category?.name ?? "未分類"}</dd>
                </div>
                <div>
                  <dt className="sr-only">版本</dt>
                  <dd>版本：{document.current_version?.version_number ?? "-"}</dd>
                </div>
                <div>
                  <dt className="sr-only">更新</dt>
                  <dd>更新：{updatedAt ? formatDate(updatedAt) : "未設定"}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-nowrap gap-2">
                <Link
                  href={detailUrl}
                  className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-accent-light"
                >
                  查看詳情
                </Link>
                {document.links.download_url && (
                  <a
                    href={document.links.download_url}
                    aria-label={`下載「${document.title}」`}
                    className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                  >
                    下載
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={documents.length}
        pageSize={pagination.pageSize}
        onPageChange={setCurrentPage}
        label="協會文件列表分頁"
      />
    </>
  );
}
