import Image from "next/image";
import Link from "next/link";

const QUICK_LINKS = [
  { label: "事務公告", href: "/notice", icon: "notice" },
  { label: "研究資源", href: "/research", icon: "research" },
  { label: "協會文件", href: "/document", icon: "document" },
  { label: "部落格", href: "/blog", icon: "blog" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "Line 社群",
    href: "https://line.me/ti/g2/53ghCyQ0KSgYg4vKqt3GT19pWRe0PKydKIrGUQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 01-.63-.629V8.108a.63.63 0 01.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 01-.63.629.626.626 0 01-.51-.262l-2.417-3.296v2.929a.63.63 0 01-1.26 0V8.108a.63.63 0 01.63-.63c.2 0 .385.096.51.262l2.417 3.296V8.108a.63.63 0 011.26 0v4.771zm-5.741 0a.63.63 0 01-1.26 0V8.108a.63.63 0 011.26 0v4.771zm-2.466.629H4.917a.63.63 0 01-.63-.629V8.108a.63.63 0 011.26 0v4.141h1.756c.349 0 .63.283.63.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
  },
  {
    label: "Facebook 臉書社團",
    href: "http://facebook.com/groups/ushersyndrometw",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
] as const;

type FooterIconType =
  | "notice"
  | "research"
  | "document"
  | "blog"
  | "address"
  | "business-id"
  | "email";

function FooterIcon({
  type,
  className = "h-4 w-4",
}: {
  type: FooterIconType;
  className?: string;
}) {
  switch (type) {
    case "notice":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 11.25l9-3.75v9l-9-3.75v-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 13.125V16.5A1.5 1.5 0 008.25 18h1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.75 9a3.75 3.75 0 013.75 3.75 3.75 3.75 0 01-3.75 3.75" />
        </svg>
      );
    case "research":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 3.75a6.75 6.75 0 105.155 11.11l4.297 4.297" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 10.5h6M10.5 7.5v6" />
        </svg>
      );
    case "document":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "blog":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 3.75l4.5 4.5M18 6l-9.75 9.75L6 20.25l4.5-2.25L20.25 8.25a1.591 1.591 0 000-2.25l-1.5-1.5a1.591 1.591 0 00-2.25 0z" />
        </svg>
      );
    case "address":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21s6-5.25 6-10.125A6 6 0 106 10.875C6 15.75 12 21 12 21z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.75a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z" />
        </svg>
      );
    case "business-id":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75l8.25-6 8.25 6v10.5a1.5 1.5 0 01-1.5 1.5h-13.5a1.5 1.5 0 01-1.5-1.5V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25h6M9 17.25h4.5" />
        </svg>
      );
    case "email":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5l9 6 9-6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-primary/10 bg-primary text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Association info */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Image
                src="/images/Logo_long.png"
                alt="台灣尤塞氏症暨視聽弱協會"
                width={280}
                height={57}
                className="h-auto w-[280px]"
                aria-hidden="true"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              致力於推動尤塞氏症相關研究、支持病友與家屬，促進社會對視聽障礙的認識與理解。
            </p>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              快速連結
            </h2>
            <ul className="mt-4 space-y-2" role="list">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-accent"
                  >
                    <FooterIcon
                      type={link.icon}
                      className="h-4 w-4 text-accent"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              社群連結
            </h2>
            <ul className="mt-4 space-y-3" role="list">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-accent"
                    aria-label={`${link.label} (在新視窗開啟)`}
                  >
                    {link.icon}
                    {link.label}
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              聯繫資訊
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70" role="list">
              <li className="flex items-start gap-2">
                <FooterIcon
                  type="address"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                <div>
                  <span className="block font-medium text-white/90">地址</span>
                  台北市中正區忠孝西路一段50號<br />14樓之20、22號
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FooterIcon
                  type="business-id"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                <div>
                  <span className="block font-medium text-white/90">統一編號</span>
                  00577231
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FooterIcon
                  type="email"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                <div>
                  <span className="block font-medium text-white/90">電子信箱</span>
                  <a
                    href="mailto:president@usher.org.tw"
                    className="transition-colors hover:text-accent"
                  >
                    president@usher.org.tw
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/50">
            &copy; {currentYear} 台灣尤塞氏症暨視聽弱協會
          </p>
        </div>
      </div>
    </footer>
  );
}
