"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Logo from "./Logo";
import { usePathname } from "next/navigation";
import { SearchButton } from "./SearchModal";

const SearchModal = dynamic(
  () => import("./SearchModal").then((mod) => ({ default: mod.SearchModal })),
  { ssr: false }
);

interface NavDropdownItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavDropdownItem[];
  icon: NavIconType;
}

type NavIconType = "about" | "related-news" | "resources" | "updates" | "contact";

const NAV_ITEMS: NavItem[] = [
  {
    label: "關於協會",
    icon: "about",
    children: [
      { label: "創立目的", href: "/about" },
      { label: "組織架構", href: "/structure" },
      { label: "理事長的話", href: "/message" },
      { label: "Logo象徵", href: "/logo-represent" },
    ],
  },
  { label: "相關報導", href: "/related-news", icon: "related-news" },
  {
    label: "資源中心",
    icon: "resources",
    children: [
      { label: "協會文件", href: "/document" },
      { label: "建議與指引", href: "/guides" },
      { label: "病友故事", href: "/story" },
    ],
  },
  {
    label: "最新消息",
    icon: "updates",
    children: [
      { label: "事務公告", href: "/notice" },
      { label: "部落格", href: "/blog" },
    ],
  },
  { label: "聯繫資訊", href: "/contact", icon: "contact" },
];

function NavIcon({ type, className }: { type: NavIconType; className: string }) {
  switch (type) {
    case "about":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75L12 3.75l8.25 6v9.75a1.5 1.5 0 01-1.5 1.5h-13.5a1.5 1.5 0 01-1.5-1.5V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21v-6h6v6" />
        </svg>
      );
    case "related-news":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 5.25h15v13.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V5.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h3v3h-3v-3zM12.75 8.25h3.75M12.75 10.5h3.75M7.5 13.5h9M7.5 15.75h9" />
        </svg>
      );
    case "resources":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75a1.5 1.5 0 011.5-1.5h5.25l1.5 1.5h6a1.5 1.5 0 011.5 1.5v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75h15" />
        </svg>
      );
    case "updates":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 11.25l9-3.75v9l-9-3.75v-1.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 13.125V16.5A1.5 1.5 0 008.25 18h1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.75 9a3.75 3.75 0 013.75 3.75 3.75 3.75 0 01-3.75 3.75" />
        </svg>
      );
    case "contact":
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
        aria-label={`${item.label}，${open ? "關閉" : "開啟"}子選單`}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "text-accent" : "text-white"
          }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="inline-flex items-center gap-1.5">
          <NavIcon type={item.icon} className="h-4 w-4" />
          <span>{item.label}</span>
        </span>
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
          aria-label={`${item.label} 子選單`}
          className="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-primary-dark py-1 shadow-xl"
        >
          {item.children.map((child) => (
            <li key={child.href} role="none">
              <Link
                href={child.href}
                role="menuitem"
                aria-current={pathname.startsWith(child.href) ? "page" : undefined}
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-primary/95 backdrop-blur-md shadow-md"
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          {/* Logo / Association name */}
          <Logo variant="header" href="/" className="shrink-0" />

          {/* Desktop navigation + Search */}
          <div className="flex items-center gap-2">
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
                  aria-current={pathname.startsWith(item.href!) ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light/10 hover:text-accent ${pathname.startsWith(item.href!)
                    ? "text-accent"
                    : "text-white"
                    }`}
                >
                  <NavIcon type={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
              )}
            </nav>
            <SearchButton onClick={() => setIsSearchOpen(true)} />
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
                        aria-expanded={mobileOpenSubmenus.has(item.label)}
                        aria-controls={`mobile-submenu-${item.label}`}
                        aria-label={`${item.label}，${mobileOpenSubmenus.has(item.label) ? "收合" : "展開"}子選單`}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light/20 ${item.children.some((child) =>
                          pathname.startsWith(child.href)
                        )
                          ? "text-accent"
                          : "text-white"
                          }`}
                        onClick={() => toggleMobileSubmenu(item.label)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <NavIcon type={item.icon} className="h-4 w-4" />
                          <span>{item.label}</span>
                        </span>
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
                        <ul id={`mobile-submenu-${item.label}`} className="ml-4 space-y-1 border-l border-white/10 pl-3 pt-1" role="group" aria-label={`${item.label} 子選單`}>
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                aria-current={pathname.startsWith(child.href) ? "page" : undefined}
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
                      aria-current={pathname.startsWith(item.href!) ? "page" : undefined}
                      className={`inline-flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light/20 hover:text-accent ${pathname.startsWith(item.href!)
                        ? "text-accent"
                        : "text-white"
                        }`}
                    >
                      <NavIcon type={item.icon} className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
