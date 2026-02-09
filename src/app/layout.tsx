import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | 台灣尤塞氏症暨視聽弱協會",
    default: "台灣尤塞氏症暨視聽弱協會 | 尤塞氏症以及視聽雙弱者之病友團體",
  },
  description:
    "台灣尤塞氏症暨視聽弱協會致力於尤塞氏症（Usher Syndrome）及視聽雙重障礙者的支持與服務，提供病友交流、資源分享與權益倡導。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={notoSansTC.variable}>
      <body className="min-h-screen bg-black font-sans text-white antialiased overflow-x-hidden">
        <a href="#main-content" className="skip-to-content">
          跳至主要內容
        </a>

        <Header />

        <main id="main-content" className="w-full overflow-x-hidden">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
