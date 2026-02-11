import { getAttachmentDownloadUrl } from "@/lib/api";
import type { Attachment } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";

interface ArticleAttachmentsProps {
  articleSlug: string;
  attachments: Attachment[];
  headingId?: string;
}

function getExtensionLabel(filename: string): string {
  const extension = filename.split(".").pop()?.trim().toUpperCase();
  return extension && extension.length <= 5 ? extension : "FILE";
}

export default function ArticleAttachments({
  articleSlug,
  attachments,
  headingId = "attachments-heading",
}: ArticleAttachmentsProps) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-white/20 pt-8" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-semibold text-white text-balance">
        附件下載
      </h2>
      <p className="mt-2 text-sm text-gray-300 text-pretty">
        以下附件可直接下載，檔名與說明以原始上傳內容為準。
      </p>

      <ul className="mt-5 space-y-3">
        {attachments.map((attachment) => {
          const extensionLabel = getExtensionLabel(attachment.original_filename);

          return (
            <li key={attachment.id}>
              <a
                href={getAttachmentDownloadUrl(
                  articleSlug,
                  attachment.id,
                  attachment.original_filename
                )}
                className="group flex items-start justify-between gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-4 transition-colors hover:border-accent/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                download
                aria-label={`下載附件：${attachment.original_filename}`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-primary/60 text-[11px] font-semibold text-accent">
                    {extensionLabel}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-white sm:text-base">
                      {attachment.original_filename}
                    </p>

                    {attachment.description && (
                      <p className="mt-1 text-xs text-gray-300 sm:text-sm text-pretty">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 tabular-nums group-hover:border-accent/70 group-hover:text-accent-light">
                  下載 · {formatFileSize(attachment.file_size)}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
