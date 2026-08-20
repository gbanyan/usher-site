import type {
  PaginatedResponse,
  ArticleSummary,
  ArticleDetailResponse,
  Page,
  Category,
  HomepageData,
  OrganizationProfile,
  ContentType,
  PublicDocumentSummary,
  PublicDocumentDetailResponse,
} from "./types";
import { FALLBACK_ORGANIZATION_PROFILE } from "./contact";
import {
  mapLegacyArticleSummaryToPublicDocument,
  mapLegacyArticleDetailToPublicDocument,
  normalizeArticleSummary,
  normalizePaginatedArticles,
} from "./transform";

import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";

type ContentSource = "api" | "snapshot";

const CONTENT_SOURCE: ContentSource =
  (process.env.CONTENT_SOURCE as ContentSource | undefined) ?? "api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

// Statically scoped so Turbopack does not trace the whole project into the
// output (the snapshot generator script keeps its own --out override).
const SNAPSHOT_DIR = path.join(process.cwd(), "content-snapshots");
const API_PAGE_SIZE = 100;

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

async function getAllPaginatedItems<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const firstPage = await fetchPage(1);
  const items = [...firstPage.data];
  const pageSize = Math.max(1, firstPage.meta?.per_page ?? API_PAGE_SIZE);
  const totalPages = Math.max(
    1,
    firstPage.meta?.last_page ??
      Math.ceil((firstPage.meta?.total ?? items.length) / pageSize)
  );

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await fetchPage(page);
    items.push(...response.data);
  }

  return items;
}

function paginatePublicDocuments(
  response: PaginatedResponse<PublicDocumentSummary>,
  params?: { search?: string; category?: string; page?: number; per_page?: number }
): PaginatedResponse<PublicDocumentSummary> {
  let filtered = response.data;

  if (params?.search) {
    const query = params.search.toLowerCase();
    filtered = filtered.filter((document) =>
      [document.title, document.summary, document.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }

  if (params?.category) {
    filtered = filtered.filter(
      (document) => document.category?.slug === params.category
    );
  }

  const perPage = Math.max(1, params?.per_page ?? response.meta?.per_page ?? 100);
  const currentPage = Math.max(1, params?.page ?? 1);
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  return {
    ...response,
    data: pageItems,
    meta: {
      ...response.meta,
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

export async function getAllArticles(params?: {
  type?: ContentType;
  category?: string;
  tag?: string;
  search?: string;
}): Promise<ArticleSummary[]> {
  return getAllPaginatedItems((page) =>
    getArticles({
      ...params,
      page,
      per_page: API_PAGE_SIZE,
    })
  );
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

export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  if (CONTENT_SOURCE === "snapshot") {
    return FALLBACK_ORGANIZATION_PROFILE;
  }

  try {
    const response = await fetchAPI<{ data: OrganizationProfile }>(
      "/organization-profile",
      { tags: ["organization-profile"] }
    );

    return response.data;
  } catch {
    return FALLBACK_ORGANIZATION_PROFILE;
  }
}

export async function getAllArticleSlugs(
  type: ContentType
): Promise<string[]> {
  try {
    const articles = await getAllArticles({ type });
    return articles.map((article) => article.slug);
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
    try {
      const response = await readSnapshot<PaginatedResponse<PublicDocumentSummary>>(
        path.join("public-documents", "list.json")
      );
      return paginatePublicDocuments(response, params);
    } catch {
      // Older snapshots contain document articles only; keep the fallback below.
    }

    const legacy = await getArticles({
      type: "document",
      per_page: params?.per_page ?? 500,
    });

    return {
      ...legacy,
      data: legacy.data.map((article) =>
        mapLegacyArticleSummaryToPublicDocument(article, API_URL)
      ),
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
      data: legacy.data.map((article) =>
        mapLegacyArticleSummaryToPublicDocument(article, API_URL)
      ),
    };
  }
}

export async function getAllPublicDocuments(params?: {
  search?: string;
  category?: string;
}): Promise<PublicDocumentSummary[]> {
  return getAllPaginatedItems((page) =>
    getPublicDocuments({
      ...params,
      page,
      per_page: API_PAGE_SIZE,
    })
  );
}

export async function getPublicDocument(
  slug: string
): Promise<PublicDocumentDetailResponse> {
  if (CONTENT_SOURCE === "snapshot") {
    try {
      return await readSnapshot<PublicDocumentDetailResponse>(
        path.join("public-documents", "by-slug", `${slug}.json`)
      );
    } catch {
      // Older snapshots contain legacy article details only.
    }

    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy, {
      apiUrl: API_URL,
      resolveDownloadUrl: getAttachmentDownloadUrl,
    });
  }

  try {
    return await fetchAPI<PublicDocumentDetailResponse>(
      `/public-documents/${slug}`,
      { tags: ["documents", `document-${slug}`] }
    );
  } catch {
    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy, {
      apiUrl: API_URL,
      resolveDownloadUrl: getAttachmentDownloadUrl,
    });
  }
}

export async function getAllPublicDocumentSlugs(): Promise<string[]> {
  try {
    const documents = await getAllPublicDocuments();
    return documents.map((document) => document.slug);
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
