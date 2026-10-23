import { getArticle, getAllArticles } from "./api";
import { mapWithConcurrency } from "./concurrency";
import type { ContentType } from "./types";

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
  const results = await mapWithConcurrency(summaries, CONCURRENCY, (summary) => getArticle(summary.slug));

  return summaries.map((summary, index) => ({
    params: { slug: summary.slug },
    props: { article: results[index].data, related: results[index].related },
  }));
}
