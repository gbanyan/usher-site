"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isEnglishPath } from "@/lib/i18n";

/** Keep the document language aligned during client-side route changes. */
export default function LocaleDocument() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = isEnglishPath(pathname) ? "en" : "zh-TW";
  }, [pathname]);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "document.documentElement.lang=(location.pathname==='\/research'||location.pathname==='\/en'||location.pathname.startsWith('\/en\/'))?'en':'zh-TW'",
      }}
    />
  );
}
