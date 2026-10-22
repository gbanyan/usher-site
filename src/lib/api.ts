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

import path from "node:path";
import { readFile } from "node:fs/promises";

type ContentSource = "api" | "snapshot";

// Read env lazily so tests (and build-time overrides) can change it.
function getContentSource(): ContentSource {
  return (process.env.CONTENT_SOURCE as ContentSource | undefined) || "api";
}

function isSnapshotMode(): boolean {
  return getContentSource() === "snapshot";
}

function getApiUrl(): string {
  return (
    process.env.CMS_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8001/api/v1"
  );
}

const SNAPSHOT_DIR = path.join(process.cwd(), "content-snapshots");
const API_PAGE_SIZE = 100;

async function readSnapshot<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(SNAPSHOT_DIR, relativePath);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

// Identical requests within one build share a single in-flight/settled promise.
const requestCache = new Map<string, Promise<unknown>>();

export function fetchAPI<T>(endpoint: string): Promise<T> {
  if (isSnapshotMode()) {
    return Promise.reject(
      new Error(
        `Network fetch blocked (CONTENT_SOURCE=snapshot). Missing snapshot for: ${endpoint}`
      )
    );
  }

  const url = `${getApiUrl()}${endpoint}`;
  const token = process.env.SITE_BUILD_TOKEN;
  const key = `${token ? "t:" : ""}${url}`;
  const cached = requestCache.get(key);
  if (cached) return cached as Promise<T>;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["X-Site-Build-Token"] = token;

  const request = (async () => {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new ApiError(
        res.status,
        `API error: ${res.status} ${res.statusText} (${url})`
      );
    }
    return (await res.json()) as T;
  })();

  requestCache.set(key, request);
  // Do not cache failures: a retry in the same process may succeed.
  request.catch(() => requestCache.delete(key));
  return request;
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
  if (isSnapshotMode()) {
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
    `/articles${query ? `?${query}` : ""}`
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

/**
 * Read the public Chinese story collection for locale fallback. This is kept
 * separate from getAllArticles so an English CMS translation can take
 * precedence later without changing the existing Chinese API contract.
 */
export async function getChineseStoryFallbackArticles(): Promise<ArticleSummary[]> {
  if (!isSnapshotMode()) {
    // api mode: live data, errors propagate so the build fails all-or-nothing.
    return getAllArticles({ type: "blog", category: "story" });
  }

  try {
    const snapshot = await readSnapshot<PaginatedResponse<ArticleSummary>>(
      path.join("articles", "list-blog.json")
    );

    return normalizePaginatedArticles({
      ...snapshot,
      data: snapshot.data.filter((article) =>
        (article.categories ?? []).some((category) => category.slug === "story")
      ),
    }).data;
  } catch {
    return [];
  }
}

export async function getArticle(slug: string): Promise<ArticleDetailResponse> {
  if (isSnapshotMode()) {
    const res = await readSnapshot<ArticleDetailResponse>(
      path.join("articles", "by-slug", `${slug}.json`)
    );

    return {
      ...res,
      data: normalizeArticleSummary(res.data),
      related: (res.related ?? []).map(normalizeArticleSummary),
    };
  }

  const res = await fetchAPI<ArticleDetailResponse>(`/articles/${slug}`);

  return {
    ...res,
    data: normalizeArticleSummary(res.data),
    related: (res.related ?? []).map(normalizeArticleSummary),
  };
}

export async function getCategories(): Promise<Category[]> {
  if (isSnapshotMode()) {
    const res = await readSnapshot<{ data: Category[] }>("categories.json");
    return res.data;
  }

  const res = await fetchAPI<{ data: Category[] }>("/categories");
  return res.data;
}

export async function getPage(slug: string): Promise<Page> {
  if (isSnapshotMode()) {
    const res = await readSnapshot<{ data: Page }>(
      path.join("pages", `${slug}.json`)
    );
    return res.data;
  }

  const res = await fetchAPI<{ data: Page }>(`/pages/${slug}`);
  return res.data;
}

export async function getHomepage(): Promise<HomepageData> {
  if (isSnapshotMode()) {
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

  const data = await fetchAPI<HomepageData>("/homepage");

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
  if (isSnapshotMode()) {
    return FALLBACK_ORGANIZATION_PROFILE;
  }

  // api mode: let failures propagate so the build fails all-or-nothing.
  const response = await fetchAPI<{ data: OrganizationProfile }>(
    "/organization-profile"
  );
  return response.data;
}

export async function getAllArticleSlugs(
  type: ContentType
): Promise<string[]> {
  const articles = await getAllArticles({ type });
  return articles.map((article) => article.slug);
}

export async function getPublicDocuments(params?: {
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<PublicDocumentSummary>> {
  if (isSnapshotMode()) {
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
        mapLegacyArticleSummaryToPublicDocument(article, getApiUrl())
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
      `/public-documents${query ? `?${query}` : ""}`
    );
  } catch (error) {
    // Only an absent endpoint (404) means an old deployment; anything else
    // must fail the build rather than silently change the content.
    if (!isNotFound(error)) throw error;
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
        mapLegacyArticleSummaryToPublicDocument(article, getApiUrl())
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
  if (isSnapshotMode()) {
    try {
      return await readSnapshot<PublicDocumentDetailResponse>(
        path.join("public-documents", "by-slug", `${slug}.json`)
      );
    } catch {
      // Older snapshots contain legacy article details only.
    }

    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy, {
      apiUrl: getApiUrl(),
      resolveDownloadUrl: getAttachmentDownloadUrl,
    });
  }

  try {
    return await fetchAPI<PublicDocumentDetailResponse>(
      `/public-documents/${slug}`
    );
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const legacy = await getArticle(slug);
    return mapLegacyArticleDetailToPublicDocument(legacy, {
      apiUrl: getApiUrl(),
      resolveDownloadUrl: getAttachmentDownloadUrl,
    });
  }
}

export async function getAllPublicDocumentSlugs(): Promise<string[]> {
  const documents = await getAllPublicDocuments();
  return documents.map((document) => document.slug);
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
  if (isSnapshotMode()) {
    const safeName = sanitizeFilename(originalFilename ?? "attachment");
    return `/attachments/${encodeURIComponent(articleSlug)}/${attachmentId}-${safeName}`;
  }

  return `${getApiUrl()}/articles/${articleSlug}/attachments/${attachmentId}/download`;
}
