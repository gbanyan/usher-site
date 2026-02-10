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
        <header className="mb-8 rounded-xl border border-white/15 bg-primary/40 p-6 shadow-sm shadow-black/20">
          <h2 className="text-balance text-2xl font-semibold text-white">
            文件資源列表
          </h2>
          <p className="mt-2 max-w-3xl text-pretty text-sm text-gray-300">
            可透過分類與標籤快速判讀文件用途，點入文件頁面可查看說明與附件下載資訊。
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
              <dt className="text-gray-300">主題標籤</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {tagOptions.length}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-300">最近更新日</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {latestPublishedDate ? formatDate(latestPublishedDate) : "尚無資料"}
              </dd>
            </div>
          </dl>
        </header>

        {articles && allDocuments.length > 0 ? (
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
                      文件資源
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-200"
                    >
                      分類與標籤
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-200"
                    >
                      更新資訊
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-200"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {allDocuments.map((article) => {
                    const articleUrl = `/document/${article.slug}`;
                    const summaryText = stripMarkdown(
                      article.summary ?? article.excerpt ?? ""
                    );

                    return (
                      <tr key={article.id} className="align-top hover:bg-white/5">
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
                                className="text-base font-semibold text-white hover:text-accent"
                              >
                                {article.title}
                              </Link>
                              {summaryText && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-300">
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
                                className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-light"
                              >
                                {category.name}
                              </span>
                            ))}
                            {(article.tags ?? []).map((tag) => (
                              <span
                                key={tag.slug}
                                className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-gray-300"
                              >
                                #{tag.name}
                              </span>
                            ))}
                            {(!article.categories || article.categories.length === 0) &&
                              (!article.tags || article.tags.length === 0) && (
                                <span className="text-xs text-gray-400">未分類</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-200">
                          <p className="tabular-nums">
                            {article.published_at ? formatDate(article.published_at) : "未設定"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {article.author_name ?? "社團法人台灣尤塞氏症病友協會"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={articleUrl}
                              className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-accent-light"
                            >
                              查看內容
                            </Link>
                            <Link
                              href={`${articleUrl}#attachments-heading`}
                              className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
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
                    className="rounded-xl border border-white/15 bg-primary-dark/70 p-4 shadow-sm shadow-black/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-balance text-base font-semibold text-white">
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
                      <p className="mt-2 line-clamp-3 text-pretty text-sm text-gray-300">
                        {summaryText}
                      </p>
                    )}
                    <dl className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-200">
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
                            className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-light"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={articleUrl}
                        className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-accent-light"
                      >
                        查看內容
                      </Link>
                      <Link
                        href={`${articleUrl}#attachments-heading`}
                        className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
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
