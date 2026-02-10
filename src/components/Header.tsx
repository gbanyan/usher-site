"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavDropdownItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavDropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "關於協會",
    children: [
      { label: "創立目的", href: "/about" },
      { label: "協會任務", href: "/mission" },
      { label: "組織架構", href: "/structure" },
      { label: "理事長的話", href: "/message" },
      { label: "Logo象徵", href: "/logo-represent" },
    ],
  },
  { label: "相關報導", href: "/related-news" },
  {
    label: "資源中心",
    children: [
      { label: "協會文件", href: "/document" },
      { label: "建議與指引", href: "/guides" },
      { label: "病友故事", href: "/story" },
    ],
  },
  {
    label: "最新消息",
    children: [
      { label: "事務公告", href: "/notice" },
      { label: "部落格", href: "/blog" },
    ],
  },
  { label: "聯繫資訊", href: "/contact" },
];

function DesktopDropdown({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive =
    item.children?.some((child) => pathname.startsWith(child.href)) ?? false;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "text-accent" : "text-white"
          }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {item.label}
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && item.children && (
        <ul
          role="menu"
          className="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-primary-dark py-1 shadow-xl"
        >
          {item.children.map((child) => (
            <li key={child.href} role="none">
              <Link
                href={child.href}
                role="menuitem"
                className={`block px-4 py-2.5 text-sm transition-colors hover:bg-primary-light/20 hover:text-accent ${pathname.startsWith(child.href) ? "text-accent" : "text-white"
                  }`}
                onClick={() => setOpen(false)}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenSubmenus, setMobileOpenSubmenus] = useState<Set<string>>(
    new Set()
  );
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // Defer state updates to avoid sync setState inside an effect body.
      queueMicrotask(() => {
        setMobileMenuOpen(false);
        setMobileOpenSubmenus(new Set());
      });
    }
  }, [pathname]);

  // Trap focus and prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const toggleMobileSubmenu = useCallback((label: string) => {
    setMobileOpenSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        跳到主要內容
      </a>
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-primary/95 backdrop-blur-md shadow-md"
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo / Association name */}
          <Link
            href="/"
            className="flex items-center gap-3 text-white transition-opacity hover:opacity-90"
            aria-label="台灣尤塞氏症暨視聽弱協會 - 回到首頁"
          >
            <Image
              src="/images/Logo_long.png"
              alt="台灣尤塞氏症暨視聽弱協會"
              width={340}
              height={68}
              className="h-[40px] w-auto sm:h-[68px]"
              priority
            />
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="主要導覽"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <DesktopDropdown
                  key={item.label}
                  item={item}
                  pathname={pathname}
                />
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light/10 hover:text-accent ${pathname.startsWith(item.href!)
                    ? "text-accent"
                    : "text-white"
                    }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-white transition-colors hover:bg-primary-light/20 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "關閉選單" : "開啟選單"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className="border-t border-white/10 bg-primary-dark lg:hidden"
            role="navigation"
            aria-label="行動版導覽"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light/20 ${item.children.some((child) =>
                          pathname.startsWith(child.href)
                        )
                          ? "text-accent"
                          : "text-white"
                          }`}
                        aria-expanded={mobileOpenSubmenus.has(item.label)}
                        onClick={() => toggleMobileSubmenu(item.label)}
                      >
                        {item.label}
                        <svg
                          className={`h-4 w-4 transition-transform ${mobileOpenSubmenus.has(item.label)
                            ? "rotate-180"
                            : ""
                            }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {mobileOpenSubmenus.has(item.label) && (
                        <ul className="ml-4 space-y-1 border-l border-white/10 pl-3 pt-1">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary-light/20 hover:text-accent ${pathname.startsWith(child.href)
                                  ? "text-accent"
                                  : "text-white/80"
                                  }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light/20 hover:text-accent ${pathname.startsWith(item.href!)
                        ? "text-accent"
                        : "text-white"
                        }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
