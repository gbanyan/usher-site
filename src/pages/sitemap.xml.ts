import type { APIRoute } from "astro";
import { getAllArticles, getAllPublicDocuments } from "../lib/api";
import { getSiteUrl } from "../lib/site";
import { buildSitemapEntries, renderSitemapXml } from "../lib/sitemap";

export const GET: APIRoute = async () => {
  // Errors propagate: the build must fail rather than ship a partial sitemap.
  const [blog, notice, related_news, documents] = await Promise.all([
    getAllArticles({ type: "blog" }),
    getAllArticles({ type: "notice" }),
    getAllArticles({ type: "related_news" }),
    getAllPublicDocuments(),
  ]);
  const entries = buildSitemapEntries({
    articles: { blog, notice, related_news },
    documents,
    siteUrl: getSiteUrl(),
  });
  return new Response(renderSitemapXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
