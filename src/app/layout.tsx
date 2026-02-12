import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import JsonLd from "@/components/JsonLd";
import { getOrganizationSchema } from "@/lib/jsonld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    template: "%s | 台灣尤塞氏症暨視聽弱協會",
    default: "台灣尤塞氏症暨視聽弱協會 | 尤塞氏症以及視聽雙弱者之病友團體",
  },
  description:
    "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症（Usher Syndrome）及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "台灣尤塞氏症暨視聽弱協會",
    images: ["/og-default.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "geo.region": "TW",
    "geo.placename": "Taiwan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <JsonLd data={getOrganizationSchema()} />
        <a href="#main-content" className="skip-to-content" aria-label="跳過導覽，直接前往主要內容">
          跳至主要內容
        </a>

        <Header />

        <main id="main-content" className="relative w-full overflow-hidden" tabIndex={-1} role="main">{children}</main>

        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
