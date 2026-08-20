import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicDocuments } from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import PageHeader from "@/components/PageHeader";
import PaginatedDocumentList from "@/components/PaginatedDocumentList";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata(
  "協會文件",
  "協會公開文件、版本資訊與下載列表",
  "/document"
);

export default async function DocumentListingPage() {
  let documents;
  try {
    documents = await getAllPublicDocuments();
  } catch {
    documents = null;
  }

  const categoryOptions = Array.from(
    new Map(
      (documents ?? [])
        .map((document) => document.category)
        .filter(
          (category): category is NonNullable<
          NonNullable<typeof documents>[number]["category"]
          > => category !== null
        )
        .map((category) => [category.slug, category])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  const latestUpdatedDate = (documents ?? [])
    .map((document) => document.updated_at || document.published_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <>
      <PageHeader
        title="協會文件"
        description="公開文件、版本資訊與下載入口"
        items={[{ label: "協會文件" }]}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <header className="mb-8 rounded-xl border border-white/15 bg-primary/40 p-6 shadow-sm shadow-black/20">
          <h2 className="text-balance text-2xl font-semibold text-white">
            公開文件列表
          </h2>
          <p className="mt-2 max-w-3xl text-pretty text-sm text-gray-300">
            本頁資料由 member 文件庫同步。每筆文件保留版本資訊、更新日期與下載連結。
          </p>
          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-300">公開文件總數</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {documents?.length ?? 0}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-300">分類數量</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {categoryOptions.length}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-300">已索引狀態</dt>
              <dd className="mt-1 text-lg font-semibold text-white">公開中</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-300">最近更新日</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {latestUpdatedDate ? formatDate(latestUpdatedDate) : "尚無資料"}
              </dd>
            </div>
          </dl>
        </header>

        {documents && documents.length > 0 ? (
          <PaginatedDocumentList documents={documents} />
        ) : documents ? (
          <div
            className="rounded-xl border border-dashed border-white/20 bg-primary/40 px-6 py-12 text-center"
            role="status"
          >
            <p className="text-base font-medium text-white">
              目前尚無可顯示的協會文件
            </p>
            <p className="mt-2 text-sm text-gray-300">
              可稍後再查看，或直接聯絡協會索取所需資源。
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
        ) : (
          <div
            className="rounded-xl border border-dashed border-white/20 bg-primary/40 px-6 py-12 text-center"
            role="alert"
          >
            <p className="text-base font-medium text-white">
              協會文件暫時無法載入
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
        )}
      </section>
    </>
  );
}
