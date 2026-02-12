import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllPublicDocumentSlugs,
  getPublicDocument,
} from "@/lib/api";
import { buildPageMetadata } from "@/lib/metadata";
import { getWebPageSchema } from "@/lib/jsonld";
import { formatDate } from "@/lib/utils";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";

interface DocumentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPublicDocumentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DocumentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: document } = await getPublicDocument(slug);
    const description =
      document.summary || document.description || "協會公開文件與下載";
    return buildPageMetadata(
      document.title,
      description,
      `/document/${slug}`,
      {}
    );
  } catch {
    return { title: "文件未找到" };
  }
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { slug } = await params;

  let document;
  let related;
  try {
    const response = await getPublicDocument(slug);
    document = response.data;
    related = response.related ?? [];
  } catch {
    notFound();
  }

  const updatedAt = document.updated_at || document.published_at;

  return (
    <>
      <JsonLd
        data={getWebPageSchema(
          document.title,
          document.summary || document.description || "協會公開文件與下載",
          `/document/${slug}`
        )}
      />
      <PageHeader
        title={document.title}
        items={[
          { label: "協會文件", href: "/document" },
          { label: document.title },
        ]}
        description={updatedAt ? `更新：${formatDate(updatedAt)}` : undefined}
      />

      <article className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <section className="rounded-xl border border-white/15 bg-primary-dark/70 p-6 shadow-sm shadow-black/20">
          <div className="flex flex-wrap items-center gap-2">
            {document.category && (
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-light">
                {document.category.name}
              </span>
            )}
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-gray-200">
              {document.access_level_label}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-gray-200">
              {document.status_label}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
            <div>
              <dt className="text-gray-400">文號</dt>
              <dd className="mt-1">{document.document_number ?? "未提供"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">目前版本</dt>
              <dd className="mt-1">
                {document.current_version?.version_number ?? "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">最近更新</dt>
              <dd className="mt-1">
                {updatedAt ? formatDate(updatedAt) : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">有效期限</dt>
              <dd className="mt-1">
                {document.expires_at
                  ? formatDate(document.expires_at)
                  : "無期限"}
              </dd>
            </div>
          </dl>

          {document.description && (
            <p className="mt-5 text-sm leading-relaxed text-gray-300">
              {document.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {document.current_version?.download_url && (
              <a
                href={document.current_version.download_url}
                className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary-dark hover:bg-accent-light"
              >
                下載目前版本
              </a>
            )}
            <a
              href={document.links.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10"
            >
              前往 member 文件頁
            </a>
          </div>
        </section>

        <section
          className="mt-8 rounded-xl border border-white/15 bg-primary-dark/70 p-6 shadow-sm shadow-black/20"
          aria-labelledby="versions-heading"
        >
          <h2 id="versions-heading" className="text-xl font-semibold text-white">
            版本資訊
          </h2>

          {document.versions.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <caption className="sr-only">文件版本歷程</caption>
                <thead className="bg-primary/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                      版本
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                      檔案
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                      更新日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                      雜湊
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-200">
                      下載
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {document.versions.map((version) => (
                    <tr key={version.id}>
                      <td className="px-4 py-3 text-sm text-gray-100">
                        {version.version_number}
                        {version.is_current && (
                          <span className="ml-2 rounded bg-green-700/60 px-2 py-0.5 text-xs text-green-100">
                            最新
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        <p className="break-all">{version.original_filename}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {version.file_size_human}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {version.uploaded_at
                          ? formatDate(version.uploaded_at)
                          : "未設定"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {version.file_hash
                          ? `${version.file_hash.slice(0, 16)}...`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={version.download_url}
                          className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                        >
                          下載
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-300">目前沒有版本資料。</p>
          )}
        </section>

        {related.length > 0 && (
          <section
            className="mt-8 rounded-xl border border-white/15 bg-primary-dark/70 p-6 shadow-sm shadow-black/20"
            aria-labelledby="related-heading"
          >
            <h2 id="related-heading" className="text-xl font-semibold text-white">
              相關文件
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <li
                  key={item.slug}
                  className="rounded-lg border border-white/15 bg-primary/30 p-4"
                >
                  <Link
                    href={`/document/${item.slug}`}
                    className="text-sm font-semibold text-white hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-xs text-gray-300">
                    {item.category?.name ?? "未分類"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <nav className="mx-auto max-w-5xl px-6 pb-12 lg:px-8">
        <Link
          href="/document"
          className="inline-flex items-center text-sm font-medium text-accent transition-colors hover:text-accent-light"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">返回協會文件列表</span>
        </Link>
      </nav>
    </>
  );
}
