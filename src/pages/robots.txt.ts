import type { APIRoute } from "astro";
import { getSiteUrl } from "../lib/site";

export const GET: APIRoute = () =>
  new Response(
    `User-Agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${getSiteUrl()}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
