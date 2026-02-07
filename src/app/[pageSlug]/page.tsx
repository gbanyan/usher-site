import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const VALID_SLUGS: Record<string, string> = {
  mission: "協會任務",
  structure: "組織架構",
  message: "理事長的話",
  "logo-represent": "Logo象徵",
  research: "研究資源",
};

interface PageProps {
  params: Promise<{ pageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pageSlug } = await params;

  if (!VALID_SLUGS[pageSlug]) {
    return {};
  }

  try {
    const page = await getPage(pageSlug);
    return {
      title: page.title || VALID_SLUGS[pageSlug],
      description: page.meta_description || `台灣尤塞氏症暨視聽弱協會 - ${page.title}`,
      keywords: page.meta_keywords || undefined,
    };
  } catch {
    return {
      title: VALID_SLUGS[pageSlug],
      description: `台灣尤塞氏症暨視聽弱協會 - ${VALID_SLUGS[pageSlug]}`,
    };
  }
}

export default async function StaticPage({ params }: PageProps) {
  const { pageSlug } = await params;

  if (!VALID_SLUGS[pageSlug]) {
    notFound();
  }

  let page;
  try {
    page = await getPage(pageSlug);
  } catch {
    notFound();
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: page.title }]}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {page.title}
          </h1>
        </header>

        <MarkdownRenderer content={page.content} />
      </article>
    </>
  );
}
