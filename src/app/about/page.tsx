import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import MarkdownRenderer from "@/components/MarkdownRenderer";

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
  try {
    page = await getPage("about");
  } catch {
    notFound();
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "創立目的" }]}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {page.title}
          </h1>
        </header>

        <MarkdownRenderer content={page.content} />

        {page.children.length > 0 && (
          <nav className="mt-16 border-t border-gray-200 pt-10">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              相關頁面
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {page.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/${child.slug}`}
                    className="block rounded-lg border border-gray-200 p-5 transition-colors hover:border-accent hover:bg-surface"
                  >
                    <span className="font-medium text-primary">
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
