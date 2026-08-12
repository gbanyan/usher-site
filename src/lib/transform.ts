import type {
  ArticleDetailResponse,
  ArticleSummary,
  PaginatedResponse,
  PublicDocument,
  PublicDocumentDetailResponse,
  PublicDocumentSummary,
  PublicDocumentVersion,
} from "./types";

/**
 * Pure data transforms shared by the API client and unit tests.
 * No server-only imports, no filesystem, no environment access — everything
 * the mapping needs is passed in explicitly.
 */

export function normalizeFeaturedImageUrl(url: string | null): string | null {
  if (!url) return null;

  if (url.startsWith("/migrated-images/")) {
    return `/images/${url.slice("/migrated-images/".length)}`;
  }

  if (url.startsWith("migrated-images/")) {
    return `/images/${url.slice("migrated-images/".length)}`;
  }

  return url;
}

export function normalizeArticleSummary<T extends { featured_image_url: string | null }>(
  article: T
): T {
  return {
    ...article,
    featured_image_url: normalizeFeaturedImageUrl(article.featured_image_url),
  };
}

export function normalizePaginatedArticles<T extends { featured_image_url: string | null }>(
  res: PaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    ...res,
    data: res.data.map(normalizeArticleSummary),
  };
}

interface AttachmentLike {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  description: string | null;
}

type DownloadUrlResolver = (
  articleSlug: string,
  attachmentId: number,
  originalFilename?: string
) => string;

export function mapLegacyArticleSummaryToPublicDocument(
  article: ArticleSummary,
  apiUrl: string
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
      api_url: `${apiUrl}/articles/${article.slug}`,
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
  attachment: AttachmentLike,
  index: number,
  resolveDownloadUrl: DownloadUrlResolver
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
    download_url: resolveDownloadUrl(
      articleSlug,
      attachment.id,
      attachment.original_filename
    ),
  };
}

export function mapLegacyArticleDetailToPublicDocument(
  response: ArticleDetailResponse,
  options: { apiUrl: string; resolveDownloadUrl: DownloadUrlResolver }
): PublicDocumentDetailResponse {
  const article = response.data;
  const versions = (article.attachments ?? []).map((attachment, index) =>
    mapLegacyAttachmentToVersion(
      article.slug,
      attachment,
      index,
      options.resolveDownloadUrl
    )
  );

  const mapped: PublicDocument = {
    ...mapLegacyArticleSummaryToPublicDocument(article, options.apiUrl),
    current_version: versions[0] ?? null,
    version_count: versions.length > 0 ? versions.length : 1,
    versions,
    links: {
      api_url: `${options.apiUrl}/articles/${article.slug}`,
      detail_url: `/document/${article.slug}`,
      web_url: `/document/${article.slug}`,
      download_url: versions[0]?.download_url ?? null,
    },
  };

  return {
    data: mapped,
    related: (response.related ?? []).map((item) =>
      mapLegacyArticleSummaryToPublicDocument(item, options.apiUrl)
    ),
  };
}

const DONATION_PLACEHOLDER_PATTERN = /待建立金流/;

/**
 * The CMS contact copy carries a “（待建立金流）” placeholder until real
 * donation information is authored. When the placeholder is present, drop the
 * placeholder markdown section so the page can render a structured donation
 * card instead of patching the account number into the copy.
 */
export function extractContactContent(content: string): {
  content: string;
  donationPending: boolean;
} {
  const donationPending = DONATION_PLACEHOLDER_PATTERN.test(content);
  if (!donationPending) {
    return { content, donationPending: false };
  }

  const withoutDonationSection = content
    .split(/^#{1,6}\s*捐款管道/m)[0]
    .trim();
  return { content: withoutDonationSection, donationPending: true };
}
