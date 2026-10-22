import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function stripMarkdown(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/&nbsp;/g, " ") // Remove non-breaking spaces
    .replace(/&[a-z0-9]+;/gi, "") // Remove other HTML entities
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    // Excerpts can be truncated before the closing parenthesis or contain a
    // line break between the label and URL. Keep the label readable either way.
    .replace(/\[([^\]]+)\]\(\s*[^\s)]*(?:\))?/g, "$1")
    .replace(/([*_~`]{1,3})(.*?)\1/g, "$2") // Remove formatting
    .replace(/^#+\s+/gm, "") // Remove headers
    .replace(/^\s*>\s+/gm, "") // Remove blockquotes
    .replace(/[-*_]{3,}/g, "") // Remove horizontal rules
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Consolidate spaces
    .trim();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

/**
 * Returns the video id for a YouTube watch, youtu.be or live URL, or null for
 * anything else (channels, playlists, other hosts, malformed URLs).
 */
export function getYouTubeVideoId(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1);
  } else if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/live/")) {
      id = url.pathname.slice("/live/".length);
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

/**
 * A link is embedded as a player only when its visible text is the URL itself
 * (a pasted or autolinked URL). Descriptive link text stays a normal link.
 */
export function getEmbeddableYouTubeId(
  href: string,
  text: string
): string | null {
  return text.trim() === href ? getYouTubeVideoId(href) : null;
}
