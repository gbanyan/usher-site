import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage, getPublicDocuments } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { PublicDocumentSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const GOVERNANCE_DOCUMENTS = [
  {
    key: "license",
    title: "內政部立案證書",
    purpose: "證明本會依法完成立案",
  },
  {
    key: "registration",
    title: "法人登記證書",
    purpose: "證明法人主體登記狀態",
  },
  {
    key: "letter",
    title: "內政部立案函",
    purpose: "主管機關核准立案公函",
  },
  {
    key: "charter",
    title: "台灣尤塞氏症暨視聽弱協會章程（2024-01-27）",
    purpose: "組織治理與會員權責規範",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getPage("about");
    return {
      title: page.title || "創立目的",
      description: page.meta_description || "台灣尤塞氏症暨視聽弱協會的創立目的與宗旨",
      keywords: page.meta_keywords || undefined,
    };
  } catch {
    return {
      title: "創立目的",
      description: "台灣尤塞氏症暨視聽弱協會的創立目的與宗旨",
    };
  }
}

export default async function AboutPage() {
  let page;
  let documents: PublicDocumentSummary[] = [];
  try {
    page = await getPage("about");
  } catch {
    notFound();
  }

  try {
    const response = await getPublicDocuments({ per_page: 500 });
    documents = response.data;
  } catch {
    documents = [];
  }

  const governanceRows = GOVERNANCE_DOCUMENTS.map((item) => ({
    ...item,
    document: documents.find((doc) => doc.title === item.title) ?? null,
  }));

  const incorporationLetter = governanceRows.find(
    (row) => row.key === "letter"
  )?.document;
  const registrationCertificate = governanceRows.find(
    (row) => row.key === "registration"
  )?.document;

  return (
    <>
      <PageHeader
        title={page.title}
        items={[{ label: "創立目的" }]}
      />

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8">

        <MarkdownRenderer content={page.content} />

        <section
          className="mt-12 rounded-xl border border-white/10 bg-primary/40 p-6 shadow-sm"
          aria-labelledby="governance-heading"
        >
          <h2 id="governance-heading" className="text-2xl font-semibold text-white">
            合法設立與治理
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            本會依法完成立案與法人登記，並持續公開章程與立案文件版本資訊，供外部單位、合作夥伴及大眾查核。
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-400">統一編號</dt>
              <dd className="mt-1 font-medium text-white">00577231</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-400">立案機關</dt>
              <dd className="mt-1 font-medium text-white">內政部</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-400">立案函文號</dt>
              <dd className="mt-1 font-medium text-white">
                {incorporationLetter?.document_number ?? "請參閱下方文件"}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-primary-dark/70 px-4 py-3">
              <dt className="text-gray-400">法人登記文號</dt>
              <dd className="mt-1 font-medium text-white">
                {registrationCertificate?.document_number ?? "請參閱下方文件"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full divide-y divide-white/10">
              <caption className="sr-only">協會合法設立與治理文件清單</caption>
              <thead className="bg-primary-dark/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                    文件
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                    用途
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                    版本
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                    最近更新
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">
                    檔案雜湊
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-200">
                    下載
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {governanceRows.map((row) => {
                  const document = row.document;
                  const hash = document?.current_version?.file_hash;
                  const updatedAt = document?.updated_at || document?.published_at;

                  return (
                    <tr key={row.key}>
                      <td className="px-4 py-3 text-sm text-white">
                        {document ? (
                          <Link
                            href={`/document/${document.slug}`}
                            className="font-medium text-accent hover:text-accent-light"
                          >
                            {document.title}
                          </Link>
                        ) : (
                          <span>{row.title}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{row.purpose}</td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {document?.current_version?.version_number ?? "未同步"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {updatedAt ? formatDate(updatedAt) : "未同步"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {hash ? `${hash.slice(0, 16)}...` : "未提供"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {document?.links.download_url ? (
                          <a
                            href={document.links.download_url}
                            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                          >
                            下載
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">未提供</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {page.children.length > 0 && (
          <nav className="mt-16 border-t border-gray-200 pt-10">
            <h2 className="mb-6 text-xl font-semibold text-white">
              相關頁面
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {page.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/${child.slug}`}
                    className="block rounded-lg border border-white/10 p-5 transition-colors hover:border-accent hover:bg-primary/20"
                  >
                    <span className="font-medium text-accent">
                      {child.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </>
  );
}
