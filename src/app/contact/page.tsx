import type { Metadata } from "next";
import { getPage, getPublicDocuments } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { Page, PublicDocumentSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "聯繫資訊",
  description: "台灣尤塞氏症暨視聽弱協會的聯繫方式與社群連結",
};

const SOCIAL_LINKS = [
  {
    name: "LINE 群組",
    href: "https://line.me/ti/g2/53ghCyQ0KSgYg4vKqt3GT19pWRe0PKydKIrGUQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
    icon: LineIcon,
    description: "加入協會 LINE 群組，與病友即時交流",
  },
  {
    name: "Facebook 社團",
    href: "http://facebook.com/groups/ushersyndrometw",
    icon: FacebookIcon,
    description: "追蹤協會最新動態與活動資訊",
  },
];

async function fetchContactPage(): Promise<Page | null> {
  try {
    return await getPage("contact");
  } catch {
    return null;
  }
}

async function fetchLegalDocuments(): Promise<PublicDocumentSummary[]> {
  try {
    const response = await getPublicDocuments({ per_page: 500 });
    return response.data;
  } catch {
    return [];
  }
}

export default async function ContactPage() {
  const page = await fetchContactPage();
  const legalDocuments = await fetchLegalDocuments();

  const incorporationLicense =
    legalDocuments.find((doc) => doc.title === "內政部立案證書") ?? null;
  const incorporationLetter =
    legalDocuments.find((doc) => doc.title === "內政部立案函") ?? null;
  const registrationCertificate =
    legalDocuments.find((doc) => doc.title === "法人登記證書") ?? null;

  return (
    <>
      <PageHeader
        title="聯繫資訊"
        description="歡迎與我們聯繫，我們將竭誠為您服務"
        items={[{ label: "聯繫資訊" }]}
      />

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">

        {page && page.content && (
          <div className="mb-12">
            <MarkdownRenderer
              content={page.content
                .replace('(待建立金流）', '帳戶 台北富邦銀行 帳號 82120000204387')
                .replace('（待建立金流）', '帳戶 台北富邦銀行 帳號 82120000204387')
                .replace('(待建立金流)', '帳戶 台北富邦銀行 帳號 82120000204387')
                .replace('（待建立金流)', '帳戶 台北富邦銀行 帳號 82120000204387')
              }
            />
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Contact details card */}
          <div className="rounded-xl border border-white/10 bg-primary/40 p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-white">
              協會資訊
            </h2>
            <dl className="space-y-5">
              <div className="flex items-start gap-3">
                <ContactMetaIcon
                  type="association"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                />
                <div>
                  <dt className="text-sm font-medium text-gray-400">協會名稱</dt>
                  <dd className="mt-1 text-white">
                    台灣尤塞氏症暨視聽弱協會
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ContactMetaIcon
                  type="address"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                />
                <div>
                  <dt className="text-sm font-medium text-gray-400">地址</dt>
                  <dd className="mt-1 text-white">
                    台北市中正區忠孝西路一段50號14樓之20、22號
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ContactMetaIcon
                  type="business-id"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                />
                <div>
                  <dt className="text-sm font-medium text-gray-400">統一編號</dt>
                  <dd className="mt-1 text-white">
                    00577231
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ContactMetaIcon
                  type="email"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                />
                <div>
                  <dt className="text-sm font-medium text-gray-400">電子信箱</dt>
                  <dd className="mt-1">
                    <a
                      href="mailto:president@usher.org.tw"
                      className="text-accent transition-colors hover:text-accent-light"
                    >
                      president@usher.org.tw
                    </a>
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-base font-semibold text-white">立案與法人資訊</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ContactMetaIcon
                    type="authority"
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  />
                  <div>
                    <dt className="text-sm font-medium text-gray-400">立案機關</dt>
                    <dd className="mt-1 text-white">內政部</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ContactMetaIcon
                    type="incorporation-letter"
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  />
                  <div>
                    <dt className="text-sm font-medium text-gray-400">立案函文號</dt>
                    <dd className="mt-1 text-white">
                      {incorporationLetter?.document_number ?? "請參考下列公開文件"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ContactMetaIcon
                    type="registration"
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  />
                  <div>
                    <dt className="text-sm font-medium text-gray-400">法人登記文號</dt>
                    <dd className="mt-1 text-white">
                      {registrationCertificate?.document_number ?? "請參考下列公開文件"}
                    </dd>
                  </div>
                </div>
              </dl>

              {incorporationLicense && (
                <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-gray-400">
                  <ContactMetaIcon
                    type="certificate"
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  />
                  <p>立案證明文件已公開：{incorporationLicense.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Social links card */}
          <div className="rounded-xl border border-white/10 bg-primary/40 p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-white">
              社群連結
            </h2>
            <ul className="space-y-4">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-white/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors group-hover:bg-white group-hover:text-accent">
                      <link.icon />
                    </span>
                    <div>
                      <span className="font-medium text-white group-hover:text-accent">
                        {link.name}
                      </span>
                      <p className="mt-0.5 text-sm text-gray-400">
                        {link.description}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

type ContactMetaIconType =
  | "association"
  | "address"
  | "business-id"
  | "email"
  | "authority"
  | "incorporation-letter"
  | "registration"
  | "certificate";

function ContactMetaIcon({
  type,
  className = "h-5 w-5",
}: {
  type: ContactMetaIconType;
  className?: string;
}) {
  switch (type) {
    case "association":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75L12 3.75l8.25 6v9.75a1.5 1.5 0 01-1.5 1.5h-13.5a1.5 1.5 0 01-1.5-1.5V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21v-6h6v6" />
        </svg>
      );
    case "address":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21s6-5.25 6-10.125A6 6 0 106 10.875C6 15.75 12 21 12 21z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.75a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z" />
        </svg>
      );
    case "business-id":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75l8.25-6 8.25 6v10.5a1.5 1.5 0 01-1.5 1.5h-13.5a1.5 1.5 0 01-1.5-1.5V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25h6M9 17.25h4.5" />
        </svg>
      );
    case "email":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5l9 6 9-6" />
        </svg>
      );
    case "authority":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3.75l8.25 3-8.25 3-8.25-3 8.25-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9v5.625A6 6 0 0012 21a6 6 0 006-6.375V9" />
        </svg>
      );
    case "incorporation-letter":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 3.75h9l4.5 4.5v12a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5v-15a1.5 1.5 0 011.5-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 3.75v4.5h4.5M7.5 12h9M7.5 15h6" />
        </svg>
      );
    case "registration":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 5.25h15v13.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V5.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 9h9M7.5 12h9M7.5 15h4.5" />
        </svg>
      );
    case "certificate":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3.75h10.5a1.5 1.5 0 011.5 1.5V15a1.5 1.5 0 01-1.5 1.5h-4.5L9 20.25V16.5H6.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 8.25h7.5M8.25 11.25h7.5" />
        </svg>
      );
    default:
      return null;
  }
}

function LineIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
