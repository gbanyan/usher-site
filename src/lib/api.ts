import type {
  PaginatedResponse,
  ArticleSummary,
  ArticleDetailResponse,
  Page,
  Category,
  HomepageData,
  ContentType,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchAPI<T>(
  path: string,
  options?: { revalidate?: number | false; tags?: string[] }
): Promise<T> {
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
  return fetchAPI<ArticleDetailResponse>(`/articles/${slug}`, {
    tags: ["articles", `article-${slug}`],
  });
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetchAPI<{ data: Category[] }>("/categories", {
    tags: ["categories"],
  });
  return res.data;
}

export async function getPage(slug: string): Promise<Page> {
  const res = await fetchAPI<{ data: Page }>(`/pages/${slug}`, {
    tags: ["pages", `page-${slug}`],
  });
  return res.data;
}

export async function getHomepage(): Promise<HomepageData> {
  return fetchAPI<HomepageData>("/homepage", {
    tags: ["homepage"],
  });
}

export async function getAllArticleSlugs(
  type: ContentType
): Promise<string[]> {
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

export function getAttachmentDownloadUrl(articleSlug: string, attachmentId: number): string {
  return `${API_URL}/articles/${articleSlug}/attachments/${attachmentId}/download`;
}
