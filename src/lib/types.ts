export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articles_count?: number;
}

export interface Tag {
  id?: number;
  name: string;
  slug: string;
}

export interface Attachment {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  description: string | null;
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string;
  content_type: "blog" | "notice" | "document" | "related_news";
  content_type_label: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_name: string | null;
  is_pinned: boolean;
  published_at: string | null;
  categories: Category[];
  tags: Tag[];
}

export interface Article extends ArticleSummary {
  content: string;
  meta_description: string | null;
  meta_keywords: string | null;
  view_count: number;
  attachments: Attachment[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  template: string | null;
  custom_fields: Record<string, unknown> | null;
  meta_description: string | null;
  meta_keywords: string | null;
  published_at: string | null;
  children: Page[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface ArticleDetailResponse {
  data: Article;
  related: ArticleSummary[];
}

export interface HomepageData {
  featured: ArticleSummary[];
  latest_blog: ArticleSummary[];
  latest_notice: ArticleSummary[];
  latest_document: ArticleSummary[];
  latest_related_news: ArticleSummary[];
  about: Page | null;
  categories: Category[];
}

export type ContentType = "blog" | "notice" | "document" | "related_news";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  blog: "部落格",
  notice: "事務公告",
  document: "協會文件",
  related_news: "相關報導",
};

export const CONTENT_TYPE_PATHS: Record<ContentType, string> = {
  blog: "/blog",
  notice: "/notice",
  document: "/document",
  related_news: "/related-news",
};
