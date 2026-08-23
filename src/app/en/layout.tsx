import type { Metadata } from "next";

const EN_TITLE = "Taiwan Usher Syndrome and Deafblind Association";
const EN_DESCRIPTION =
  "Supporting people with Usher syndrome and deafblind people through connection, resources, advocacy, and community.";

export const metadata: Metadata = {
  title: { absolute: EN_TITLE },
  description: EN_DESCRIPTION,
  openGraph: {
    title: EN_TITLE,
    description: EN_DESCRIPTION,
    locale: "en_US",
    siteName: EN_TITLE,
    type: "website",
    images: ["/images/banner/hero-support.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: EN_TITLE,
    description: EN_DESCRIPTION,
    images: ["/images/banner/hero-support.jpg"],
  },
  alternates: {
    canonical: "/en",
    languages: {
      "zh-TW": "/",
      en: "/en",
    },
  },
};

export default function EnglishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div lang="en">{children}</div>;
}
