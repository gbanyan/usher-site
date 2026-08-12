import Link from "next/link";

const QUICK_LINKS = [
  { label: "首頁", href: "/" },
  { label: "事務公告", href: "/notice" },
  { label: "部落格", href: "/blog" },
  { label: "協會文件", href: "/document" },
  { label: "相關報導", href: "/related-news" },
  { label: "聯繫資訊", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="mt-4 text-xl text-white">找不到頁面</p>
      <p className="mt-2 text-gray-400">
        您所尋找的頁面不存在，可能已被移除或網址有誤。
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-primary-dark transition-colors hover:bg-accent-light"
        aria-label="返回網站首頁"
      >
        返回首頁
      </Link>
      <nav aria-label="常用頁面" className="mt-10">
        <h2 className="text-sm font-medium text-white/70">常用頁面</h2>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-block rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-accent hover:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
