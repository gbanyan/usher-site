/**
 * Site URL for absolute URLs (canonical, OG, JSON-LD).
 * SITE_URL is preferred; NEXT_PUBLIC_SITE_URL is a transitional fallback.
 * Trailing slashes are stripped so paths can be appended safely.
 */
export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:4321";
  return url.replace(/\/+$/, "");
}
