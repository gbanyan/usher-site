/**
 * Detail pages that live under a different prefix than their nav listing:
 * blog and notice articles keep their URLs but belong to 活動與公告 (/news).
 */
const NAV_ALIASES: Record<string, string[]> = {
  "/news": ["/blog", "/notice"],
};

function isWithin(prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavHrefActive(href: string, pathname: string): boolean {
  return [href, ...(NAV_ALIASES[href] ?? [])].some((prefix) =>
    isWithin(prefix, pathname)
  );
}
