/**
 * Site URL for absolute URLs (canonical, OG, JSON-LD).
 * Fallback to localhost in development.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
