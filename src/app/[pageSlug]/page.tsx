import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPage } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const PAGE_ROUTES: Record<string, { title: string; apiSlug: string }> = {
  structure: { title: "組織架構", apiSlug: "structure" },
  message: { title: "理事長的話", apiSlug: "message" },
  "logo-represent": { title: "Logo象徵", apiSlug: "logo_represent" },
  logo_represent: { title: "Logo象徵", apiSlug: "logo_represent" },
};

export function generateStaticParams() {
  return ["structure", "message", "logo-represent"].map((pageSlug) => ({
    pageSlug,
  }));
}

interface PageProps {
  params: Promise<{ pageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pageSlug } = await params;
  const route = PAGE_ROUTES[pageSlug];

  if (!route) {
    return {};
  }

  try {
    let page;
    try {
      page = await getPage(route.apiSlug);
    } catch {
      page = route.apiSlug === pageSlug ? undefined : await getPage(pageSlug);
    }

    if (!page) {
      throw new Error("Page not found");
    }

    return {
      title: page.title || route.title,
      description: page.meta_description || `台灣尤塞氏症暨視聽弱協會 - ${page.title}`,
      keywords: page.meta_keywords || undefined,
    };
  } catch {
    return {
      title: route.title,
      description: `台灣尤塞氏症暨視聽弱協會 - ${route.title}`,
    };
  }
}

export default async function StaticPage({ params }: PageProps) {
  const { pageSlug } = await params;
  const route = PAGE_ROUTES[pageSlug];

  if (!route) {
    notFound();
  }

  if (pageSlug === "logo_represent") {
    permanentRedirect("/logo-represent");
  }

  let page;
  try {
    try {
      page = await getPage(route.apiSlug);
    } catch {
      page = route.apiSlug === pageSlug ? undefined : await getPage(pageSlug);
    }
  } catch {
    notFound();
  }

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={page.title}
        items={[{ label: page.title }]}
      />

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8">

        <MarkdownRenderer content={page.content} />
      </article>
    </>
  );
}
