import { permanentRedirect } from "next/navigation";
import { NEWS_LISTING } from "@/lib/article-sections";

export default function NoticeListingRedirectPage() {
  permanentRedirect(NEWS_LISTING.path);
}
