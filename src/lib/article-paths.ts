import { getArticle, getAllArticles } from "./api";
import type { ArticleDetailResponse, ContentType } from "./types";

const CONCURRENCY = 8;

/**
 * Shared getStaticPaths helper for article detail routes. Lists the articles
 * for a type, keeps those accepted by `include`, then loads each detail once.
 * Errors propagate so the build fails all-or-nothing.
 */
export async function getArticlePaths(
  params: { type: ContentType; category?: string },
  include: (article: { categories?: { slug: string }[] }) => boolean = () => true
) {
  const summaries = (await getAllArticles(params)).filter(include);
  const results: ArticleDetailResponse[] = new Array(summaries.length);
  let next = 0;

  async function worker() {
    while (next < summaries.length) {
      const index = next++;
      results[index] = await getArticle(summaries[index].slug);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, summaries.length) }, worker)
  );

  return summaries.map((summary, index) => ({
    params: { slug: summary.slug },
    props: { article: results[index].data, related: results[index].related },
  }));
}
