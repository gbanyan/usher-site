import type {
  PaginatedResponse,
  ArticleSummary,
  ArticleDetailResponse,
  Page,
  Category,
  HomepageData,
  ContentType,
  PublicDocumentSummary,
  PublicDocument,
  PublicDocumentDetailResponse,
  PublicDocumentVersion,
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

function normalizeFeaturedImageUrl(url: string | null): string | null {
  if (!url) return null;

  if (url.startsWith("/migrated-images/")) {
    return `/images/${url.slice("/migrated-images/".length)}`;
  }

  if (url.startsWith("migrated-images/")) {
    return `/images/${url.slice("migrated-images/".length)}`;
  }

  return url;
}

function normalizeArticleSummary<T extends { featured_image_url: string | null }>(
  article: T
): T {
  return {
    ...article,
    featured_image_url: normalizeFeaturedImageUrl(article.featured_image_url),
  };
}

function normalizePaginatedArticles<T extends { featured_image_url: string | null }>(
  res: PaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    ...res,
    data: res.data.map(normalizeArticleSummary),
  };
}

function mapLegacyArticleSummaryToPublicDocument(
  article: ArticleSummary
): PublicDocumentSummary {
  return {
    id: article.id,
    slug: article.slug,
    public_uuid: article.slug,
    title: article.title,
    document_number: null,
    summary: article.summary ?? article.excerpt,
    description: article.summary ?? article.excerpt,
    status: "active",
    status_label: "啟用",
    access_level: "public",
    access_level_label: "公開",
    published_at: article.published_at,
    updated_at: article.published_at,
    expires_at: null,
    version_count: 1,
    category: article.categories?.[0]
      ? {
          id: article.categories[0].id,
          name: article.categories[0].name,
          slug: article.categories[0].slug,
          icon: null,
        }
      : null,
    current_version: null,
    links: {
      api_url: `${API_URL}/articles/${article.slug}`,
      detail_url: `/document/${article.slug}`,
      web_url: `/document/${article.slug}`,
      download_url: null,
    },
    metadata: {
      document_type: article.categories?.[0]?.name ?? null,
      expiration_status: null,
      auto_archive_on_expiry: false,
      expiry_notice: null,
    },
  };
}

function mapLegacyAttachmentToVersion(
  articleSlug: string,
  attachment: {
    id: number;
    original_filename: string;
    mime_type: string;
    file_size: number;
    description: string | null;
  },
  index: number
): PublicDocumentVersion {
  const extension = attachment.original_filename.includes(".")
    ? attachment.original_filename.split(".").pop() ?? ""
    : "";

  return {
    id: attachment.id,
    version_number: `${index + 1}.0`,
    version_notes: attachment.description,
    is_current: index === 0,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_extension: extension.toLowerCase(),
    file_size: attachment.file_size,
    file_size_human: `${(attachment.file_size / 1024).toFixed(1)} KB`,
    file_hash: null,
    uploaded_by: null,
    uploaded_at: null,
    download_url: getAttachmentDownloadUrl(
      articleSlug,
      attachment.id,
      attachment.original_filename
    ),
  };
}

function mapLegacyArticleDetailToPublicDocument(
  response: ArticleDetailResponse
): PublicDocumentDetailResponse {
  const article = response.data;
  const versions = (article.attachments ?? []).map((attachment, index) =>
    mapLegacyAttachmentToVersion(article.slug, attachment, index)
  );

  const mapped: PublicDocument = {
    ...mapLegacyArticleSummaryToPublicDocument(article),
    current_version: versions[0] ?? null,
    version_count: versions.length > 0 ? versions.length : 1,
    versions,
    links: {
      api_url: `${API_URL}/articles/${article.slug}`,
      detail_url: `/document/${article.slug}`,
      web_url: `/document/${article.slug}`,
      download_url: versions[0]?.download_url ?? null,
    },
  };

  return {
    data: mapped,
    related: (response.related ?? []).map(mapLegacyArticleSummaryToPublicDocument),
  };
}

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

    return normalizePaginatedArticles({
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
    });
  }

  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.tag) searchParams.set("tag", params.tag);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  const res = await fetchAPI<PaginatedResponse<ArticleSummary>>(
    `/articles${query ? `?${query}` : ""}`,
    { tags: ["articles"] }
  );

  return normalizePaginatedArticles(res);
}

export async function getArticle(slug: string): Promise<ArticleDetailResponse> {
  if (CONTENT_SOURCE === "snapshot") {
    const res = await readSnapshot<ArticleDetailResponse>(
      path.join("articles", "by-slug", `${slug}.json`)
    );

    return {
      ...res,
      data: normalizeArticleSummary(res.data),
      related: (res.related ?? []).map(normalizeArticleSummary),
    };
  }

  const res = await fetchAPI<ArticleDetailResponse>(`/articles/${slug}`, {
    tags: ["articles", `article-${slug}`],
  });

  return {
    ...res,
    data: normalizeArticleSummary(res.data),
    related: (res.related ?? []).map(normalizeArticleSummary),
  };
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
    const data = await readSnapshot<HomepageData>("homepage.json");
    return {
      ...data,
      featured: (data.featured ?? []).map(normalizeArticleSummary),
      latest_blog: (data.latest_blog ?? []).map(normalizeArticleSummary),
      latest_notice: (data.latest_notice ?? []).map(normalizeArticleSummary),
      latest_document: (data.latest_document ?? []).map(normalizeArticleSummary),
      latest_related_news: (data.latest_related_news ?? []).map(normalizeArticleSummary),
    };
  }

  const data = await fetchAPI<HomepageData>("/homepage", {
    tags: ["homepage"],
  });

  return {
    ...data,
    featured: (data.featured ?? []).map(normalizeArticleSummary),
    latest_blog: (data.latest_blog ?? []).map(normalizeArticleSummary),
    latest_notice: (data.latest_notice ?? []).map(normalizeArticleSummary),
    latest_document: (data.latest_document ?? []).map(normalizeArticleSummary),
    latest_related_news: (data.latest_related_news ?? []).map(normalizeArticleSummary),
  };
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

export async function getPublicDocuments(params?: {
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<PublicDocumentSummary>> {
  if (CONTENT_SOURCE === "snapshot") {
    const legacy = await getArticles({
      type: "document",
      per_page: params?.per_page ?? 500,
    });

    return {
      ...legacy,
      data: legacy.data.map(mapLegacyArticleSummaryToPublicDocument),
    };
  }

  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();

  try {
    return await fetchAPI<PaginatedResponse<PublicDocumentSummary>>(
      `/public-documents${query ? `?${query}` : ""}`,
      { tags: ["documents"] }
    );
  } catch {
    // Backward-compatible fallback while older deployments still expose document articles only.
    const legacy = await getArticles({
      type: "document",
      search: params?.search,
      category: params?.category,
      page: params?.page,
      per_page: params?.per_page ?? 500,
    });

    return {
      ...legacy,
      data: legacy.data.map(mapLegacyArticleSummaryToPublicDocument),
    };
  }
}

export async function getPublicDocument(
  slug: string
): Promise<PublicDocumentDetailResponse> {
  if (CONTENT_SOURCE === "snapshot") {
    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy);
  }

  try {
    return await fetchAPI<PublicDocumentDetailResponse>(
      `/public-documents/${slug}`,
      { tags: ["documents", `document-${slug}`] }
    );
  } catch {
    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy);
  }
}

export async function getAllPublicDocumentSlugs(): Promise<string[]> {
  if (CONTENT_SOURCE === "snapshot") {
    return getAllArticleSlugs("document");
  }

  try {
    const res = await fetchAPI<PaginatedResponse<PublicDocumentSummary>>(
      "/public-documents?per_page=500",
      { tags: ["documents"] }
    );
    return res.data.map((document) => document.slug);
  } catch {
    return getAllArticleSlugs("document");
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
