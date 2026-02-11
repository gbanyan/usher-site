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

export interface PublicDocumentCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export interface PublicDocumentVersion {
  id: number;
  version_number: string;
  version_notes: string | null;
  is_current: boolean;
  original_filename: string;
  mime_type: string;
  file_extension: string;
  file_size: number;
  file_size_human: string;
  file_hash: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  download_url: string;
}

export interface PublicDocumentSummary {
  id: number;
  slug: string;
  public_uuid: string;
  title: string;
  document_number: string | null;
  summary: string | null;
  description: string | null;
  status: string;
  status_label: string;
  access_level: string;
  access_level_label: string;
  published_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  version_count: number;
  category: PublicDocumentCategory | null;
  current_version: PublicDocumentVersion | null;
  links: {
    api_url: string;
    detail_url: string;
    web_url: string;
    download_url: string | null;
  };
  metadata: {
    document_type: string | null;
    expiration_status: string | null;
    auto_archive_on_expiry: boolean;
    expiry_notice: string | null;
  };
}

export interface PublicDocument extends PublicDocumentSummary {
  versions: PublicDocumentVersion[];
  audit?: {
    view_count: number;
    download_count: number;
    last_updated_by: string | null;
    created_by: string | null;
  };
}

export interface PublicDocumentDetailResponse {
  data: PublicDocument;
  related: PublicDocumentSummary[];
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
