import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { formatDate, stripMarkdown } from "@/lib/utils";

export const metadata: Metadata = {
  title: "協會文件",
  description: "協會公開文件與資源列表",
};

export default async function DocumentListingPage() {
  let articles;
  try {
    articles = await getArticles({ type: "document", per_page: 100 });
  } catch {
    articles = null;
  }

  const allDocuments = articles?.data ?? [];
  const categoryOptions = Array.from(
    new Map(
      allDocuments
        .flatMap((article) => article.categories ?? [])
        .map((category) => [category.slug, category])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  const tagOptions = Array.from(
    new Map(
      allDocuments
        .flatMap((article) => article.tags ?? [])
        .map((tag) => [tag.slug, tag])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  const latestPublishedDate = allDocuments
    .map((article) => article.published_at)
    .filter((publishedAt): publishedAt is string => Boolean(publishedAt))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <>
      <PageHeader
        title="協會文件"
        description="公開文件、指引與資源下載入口"
        items={[{ label: "協會文件" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-balance text-2xl font-semibold text-gray-900">
            文件資源列表
          </h2>
          <p className="mt-2 max-w-3xl text-pretty text-sm text-gray-600">
            可透過分類與標籤快速判讀文件用途，點入文件頁面可查看說明與附件下載資訊。
          </p>
          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">公開文件總數</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {allDocuments.length}
              </dd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">分類數量</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {categoryOptions.length}
              </dd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">主題標籤</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {tagOptions.length}
              </dd>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">最近更新日</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {latestPublishedDate ? formatDate(latestPublishedDate) : "尚無資料"}
              </dd>
            </div>
          </dl>
        </header>

        {articles && allDocuments.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <caption className="sr-only">協會文件公開資源列表</caption>
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600"
                    >
                      文件資源
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600"
                    >
                      分類與標籤
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600"
                    >
                      更新資訊
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-600"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allDocuments.map((article) => {
                    const articleUrl = `/document/${article.slug}`;
                    const summaryText = stripMarkdown(
                      article.summary ?? article.excerpt ?? ""
                    );

                    return (
                      <tr key={article.id} className="align-top">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            {article.is_pinned && (
                              <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-primary-dark">
                                置頂
                              </span>
                            )}
                            <div>
                              <Link
                                href={articleUrl}
                                className="text-base font-semibold text-primary hover:text-accent"
                              >
                                {article.title}
                              </Link>
                              {summaryText && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                  {summaryText}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(article.categories ?? []).map((category) => (
                              <span
                                key={category.slug}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              >
                                {category.name}
                              </span>
                            ))}
                            {(article.tags ?? []).map((tag) => (
                              <span
                                key={tag.slug}
                                className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600"
                              >
                                #{tag.name}
                              </span>
                            ))}
                            {(!article.categories || article.categories.length === 0) &&
                              (!article.tags || article.tags.length === 0) && (
                                <span className="text-xs text-gray-500">未分類</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p className="tabular-nums">
                            {article.published_at ? formatDate(article.published_at) : "未設定"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {article.author_name ?? "社團法人台灣尤塞氏症病友協會"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={articleUrl}
                              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
                            >
                              查看內容
                            </Link>
                            <Link
                              href={`${articleUrl}#attachments-heading`}
                              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              附件下載
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-4 md:hidden">
              {allDocuments.map((article) => {
                const articleUrl = `/document/${article.slug}`;
                const summaryText = stripMarkdown(
                  article.summary ?? article.excerpt ?? ""
                );

                return (
                  <li
                    key={article.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-balance text-base font-semibold text-primary">
                        <Link href={articleUrl} className="hover:text-accent">
                          {article.title}
                        </Link>
                      </h3>
                      {article.is_pinned && (
                        <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-primary-dark">
                          置頂
                        </span>
                      )}
                    </div>
                    {summaryText && (
                      <p className="mt-2 line-clamp-3 text-pretty text-sm text-gray-600">
                        {summaryText}
                      </p>
                    )}
                    <dl className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-700">
                      <div>
                        <dt className="sr-only">更新日</dt>
                        <dd className="tabular-nums">
                          更新：{article.published_at ? formatDate(article.published_at) : "未設定"}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">來源</dt>
                        <dd>來源：{article.author_name ?? "社團法人台灣尤塞氏症病友協會"}</dd>
                      </div>
                    </dl>
                    {(article.categories?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {article.categories.map((category) => (
                          <span
                            key={category.slug}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={articleUrl}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
                      >
                        查看內容
                      </Link>
                      <Link
                        href={`${articleUrl}#attachments-heading`}
                        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        附件下載
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-base font-medium text-gray-900">
              目前尚無可顯示的協會文件
            </p>
            <p className="mt-2 text-sm text-gray-600">
              可稍後再查看，或直接聯絡協會索取所需資源。
            </p>
            <div className="mt-4">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
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
