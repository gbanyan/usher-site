import type { Metadata } from "next";
import Link from "next/link";
import { getPublicDocuments } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "協會文件",
  description: "協會公開文件、版本資訊與下載列表",
};

export default async function DocumentListingPage() {
  let response;
  try {
    response = await getPublicDocuments({ per_page: 500 });
  } catch {
    response = null;
  }

  const allDocuments = response?.data ?? [];
  const categoryOptions = Array.from(
    new Map(
      allDocuments
        .map((document) => document.category)
        .filter(
          (category): category is NonNullable<(typeof allDocuments)[number]["category"]> =>
            category !== null
        )
        .map((category) => [category.slug, category])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  const latestUpdatedDate = allDocuments
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
                {allDocuments.length}
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

        {response && allDocuments.length > 0 ? (
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
                  {allDocuments.map((document) => {
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
              {allDocuments.map((document) => {
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
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 bg-primary/40 px-6 py-12 text-center">
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
        )}
      </section>
    </>
  );
}
