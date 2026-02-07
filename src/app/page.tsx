import Link from "next/link";
import { getHomepage } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleSummary } from "@/lib/types";

export const revalidate = 300;

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-primary">{title}</h2>
      <Link
        href={href}
        className="text-sm font-medium text-primary-light hover:text-accent transition-colors"
      >
        查看更多 &rarr;
      </Link>
    </div>
  );
}

function ArticleList({
  articles,
  href,
  title,
}: {
  articles: ArticleSummary[];
  href: string;
  title: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={`section-${href.replace("/", "")}`}>
      <SectionHeader title={title} href={href} />
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  let data;
  try {
    data = await getHomepage();
  } catch {
    // API unavailable during build — render hero only
    data = null;
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section
        aria-label="首頁橫幅"
        className="bg-primary py-20 text-white"
      >
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            台灣尤塞氏症暨視聽弱協會
          </h1>
          <p className="mt-4 text-lg text-white/85 sm:text-xl">
            尤塞氏症以及視聽雙弱者之病友團體
          </p>
        </div>
      </section>

      {data && (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4">
        {/* Featured / Pinned Articles */}
        {data.featured.length > 0 && (
          <section aria-labelledby="section-featured">
            <h2
              id="section-featured"
              className="text-2xl font-bold text-primary"
            >
              精選文章
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Latest Blog Posts */}
        <ArticleList
          articles={data.latest_blog}
          href="/blog"
          title="最新文章"
        />

        {/* Latest Notices */}
        <ArticleList
          articles={data.latest_notice}
          href="/notice"
          title="最新公告"
        />

        {/* Latest Documents */}
        <ArticleList
          articles={data.latest_document}
          href="/document"
          title="最新文件"
        />

        {/* Latest Related News */}
        <ArticleList
          articles={data.latest_related_news}
          href="/related-news"
          title="相關報導"
        />

        {/* About Section */}
        {data.about && (
          <section aria-labelledby="section-about" className="rounded-lg bg-surface p-8">
            <div className="flex items-center justify-between">
              <h2
                id="section-about"
                className="text-2xl font-bold text-primary"
              >
                關於協會
              </h2>
              <Link
                href="/about"
                className="text-sm font-medium text-primary-light hover:text-accent transition-colors"
              >
                瞭解更多 &rarr;
              </Link>
            </div>
            <div
              className="prose prose-gray mt-4 line-clamp-4"
              dangerouslySetInnerHTML={{ __html: data.about.content }}
            />
          </section>
        )}
      </div>
      )}
    </div>
  );
}
