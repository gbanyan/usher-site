"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Keep the document language aligned during client-side route changes. */
export default function LocaleDocument() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname.startsWith("/en") ? "en" : "zh-TW";
  }, [pathname]);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "document.documentElement.lang=location.pathname.startsWith('/en')?'en':'zh-TW'",
      }}
    />
  );
}
