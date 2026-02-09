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
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links but keep text
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
