"use client";

import { useMemo, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import PaginationControls from "@/components/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import type { ArticleSummary } from "@/lib/types";

const PAGE_SIZE = 12;

interface PaginatedArticleGridProps {
  articles: ArticleSummary[];
  basePath?: string;
}

export default function PaginatedArticleGrid({
  articles,
  basePath,
}: PaginatedArticleGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pagination = useMemo(
    () => paginateItems(articles, currentPage, PAGE_SIZE),
    [articles, currentPage]
  );

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {pagination.items.map((article) => (
          <ArticleCard key={article.id} article={article} basePath={basePath} />
        ))}
      </div>

      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={articles.length}
        pageSize={pagination.pageSize}
        onPageChange={setCurrentPage}
        label="文章列表分頁"
      />
    </>
  );
}
