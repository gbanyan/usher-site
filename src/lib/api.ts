import type {
  PaginatedResponse,
  ArticleSummary,
  ArticleDetailResponse,
  Page,
  Category,
  HomepageData,
  ContentType,
} from "./types";

import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";

type ContentSource = "api" | "snapshot";

const CONTENT_SOURCE: ContentSource =
  (process.env.CONTENT_SOURCE as ContentSource | undefined) ?? "api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

const SNAPSHOT_DIR =
  process.env.CONTENT_SNAPSHOT_DIR || path.join(process.cwd(), "content-snapshots");

async function readSnapshot<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(SNAPSHOT_DIR, relativePath);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

async function fetchAPI<T>(
  path: string,
  options?: { revalidate?: number | false; tags?: string[] }
): Promise<T> {
  if (CONTENT_SOURCE === "snapshot") {
    throw new Error(
      `Network fetch blocked (CONTENT_SOURCE=snapshot). Missing snapshot for: ${path}`
    );
  }

  const res = await fetch(`${API_URL}${path}`, {
    next: {
      revalidate: options?.revalidate ?? false,
      tags: options?.tags,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getArticles(params?: {
  type?: ContentType;
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<ArticleSummary>> {
  if (CONTENT_SOURCE === "snapshot") {
    const type = params?.type;
    if (!type) {
      throw new Error("Snapshot mode requires params.type for getArticles().");
    }

    const res = await readSnapshot<PaginatedResponse<ArticleSummary>>(
      path.join("articles", `list-${type}.json`)
    );

    let filtered = res.data;
    if (params?.category) {
      filtered = filtered.filter((a) =>
        (a.categories ?? []).some((c) => c.slug === params.category)
      );
    }
    if (params?.tag) {
      filtered = filtered.filter((a) =>
        (a.tags ?? []).some((t) => t.slug === params.tag)
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((a) =>
        `${a.title} ${a.excerpt ?? ""} ${a.summary ?? ""}`.toLowerCase().includes(q)
      );
    }

    const perPage = Math.max(1, params?.per_page ?? res.meta?.per_page ?? 100);
    const currentPage = Math.max(1, params?.page ?? 1);
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    return {
      data: pageItems,
      meta: {
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: pageItems.length ? start + 1 : null,
        to: pageItems.length ? start + pageItems.length : null,
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
      },
    };
  }

  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.tag) searchParams.set("tag", params.tag);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  return fetchAPI<PaginatedResponse<ArticleSummary>>(
    `/articles${query ? `?${query}` : ""}`,
    { tags: ["articles"] }
  );
}

export async function getArticle(slug: string): Promise<ArticleDetailResponse> {
  if (CONTENT_SOURCE === "snapshot") {
    return readSnapshot<ArticleDetailResponse>(
      path.join("articles", "by-slug", `${slug}.json`)
    );
  }

  return fetchAPI<ArticleDetailResponse>(`/articles/${slug}`, {
    tags: ["articles", `article-${slug}`],
  });
}

export async function getCategories(): Promise<Category[]> {
  if (CONTENT_SOURCE === "snapshot") {
    const res = await readSnapshot<{ data: Category[] }>("categories.json");
    return res.data;
  }

  const res = await fetchAPI<{ data: Category[] }>("/categories", {
    tags: ["categories"],
  });
  return res.data;
}

export async function getPage(slug: string): Promise<Page> {
  if (CONTENT_SOURCE === "snapshot") {
    const res = await readSnapshot<{ data: Page }>(
      path.join("pages", `${slug}.json`)
    );
    return res.data;
  }

  const res = await fetchAPI<{ data: Page }>(`/pages/${slug}`, {
    tags: ["pages", `page-${slug}`],
  });
  return res.data;
}

export async function getHomepage(): Promise<HomepageData> {
  if (CONTENT_SOURCE === "snapshot") {
    return readSnapshot<HomepageData>("homepage.json");
  }

  return fetchAPI<HomepageData>("/homepage", {
    tags: ["homepage"],
  });
}

export async function getAllArticleSlugs(
  type: ContentType
): Promise<string[]> {
  if (CONTENT_SOURCE === "snapshot") {
    try {
      const res = await readSnapshot<PaginatedResponse<ArticleSummary>>(
        path.join("articles", `list-${type}.json`)
      );
      return res.data.map((a) => a.slug);
    } catch {
      return [];
    }
  }

  try {
    const res = await fetchAPI<PaginatedResponse<ArticleSummary>>(
      `/articles?type=${type}&per_page=500`,
      { tags: ["articles"] }
    );
    return res.data.map((a) => a.slug);
  } catch {
    return [];
  }
}

function sanitizeFilename(filename: string): string {
  // Keep URLs stable across OS/filesystems.
  return filename.replace(/[^A-Za-z0-9._-]+/g, "_");
}

export function getAttachmentDownloadUrl(
  articleSlug: string,
  attachmentId: number,
  originalFilename?: string
): string {
  if (CONTENT_SOURCE === "snapshot") {
    const safeName = sanitizeFilename(originalFilename ?? "attachment");
    return `/attachments/${encodeURIComponent(articleSlug)}/${attachmentId}-${safeName}`;
  }

  return `${API_URL}/articles/${articleSlug}/attachments/${attachmentId}/download`;
}
