"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";

interface PagefindResult {
  url: string;
  meta: { title?: string };
  excerpt?: string;
}

interface QuickAction {
  id: string;
  title: string;
  url: string;
  icon: React.ReactNode;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function NavIcon({ type }: { type: string }) {
  const shared = "h-4 w-4 shrink-0";
  switch (type) {
    case "home":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "blog":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "notice":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case "document":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "news":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      );
    case "about":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "contact":
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      );
  }
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagefindReady, setPagefindReady] = useState(false);
  const pagefindRef = useRef<{
    init: () => void;
    options: (opts: { bundlePath: string }) => Promise<void>;
    preload: (query: string) => void;
    debouncedSearch: (
      query: string,
      opts: object,
      debounceMs: number
    ) => Promise<{ results: { data: () => Promise<PagefindResult> }[] } | null>;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadPagefind = async () => {
      try {
        const pagefindUrl = `${window.location.origin}/_pagefind/pagefind.js`;
        const pagefind = await import(/* webpackIgnore: true */ pagefindUrl);
        await pagefind.options({ bundlePath: "/_pagefind/" });
        pagefind.init();
        pagefindRef.current = pagefind;
        setPagefindReady(true);
      } catch (error) {
        console.error("Failed to load Pagefind:", error);
      }
    };

    loadPagefind();

    return () => {
      pagefindRef.current = null;
      setPagefindReady(false);
      setSearch("");
      setResults([]);
    };
  }, [isOpen]);

  useEffect(() => {
    const query = search.trim();
    if (!query || !pagefindRef.current) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    pagefindRef.current.preload(query);

    const timer = setTimeout(async () => {
      const pf = pagefindRef.current;
      if (!pf) return;

      const searchResult = await pf.debouncedSearch(query, {}, 300);
      if (searchResult === null) return;

      const dataPromises = searchResult.results.slice(0, 10).map((r) => r.data());
      const items = await Promise.all(dataPromises);
      setResults(items);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, pagefindReady]);

  const handleSelect = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router]
  );

  const navActions: QuickAction[] = [
    { id: "home", title: "首頁", url: "/", icon: <NavIcon type="home" /> },
    { id: "blog", title: "部落格", url: "/blog", icon: <NavIcon type="blog" /> },
    { id: "notice", title: "事務公告", url: "/notice", icon: <NavIcon type="notice" /> },
    { id: "document", title: "協會文件", url: "/document", icon: <NavIcon type="document" /> },
    { id: "related-news", title: "相關報導", url: "/related-news", icon: <NavIcon type="news" /> },
    { id: "about", title: "創立目的", url: "/about", icon: <NavIcon type="about" /> },
    { id: "contact", title: "聯繫資訊", url: "/contact", icon: <NavIcon type="contact" /> },
  ];

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      label="全站搜尋"
      shouldFilter={false}
      className="search-modal fixed left-1/2 top-[20%] z-[9999] w-full max-w-2xl -translate-x-1/2 rounded-2xl border border-white/20 bg-primary-dark shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-1">
        <SearchIcon className="h-5 w-5 shrink-0 text-white/50" />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="搜尋文章或快速導航…"
          className="flex h-14 w-full min-w-0 bg-transparent pl-0 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus-visible:outline-none"
        />
      </div>

      <Command.List className="max-h-[min(60vh,400px)] overflow-y-auto px-3 py-2">
        {loading && (
          <Command.Loading className="flex items-center justify-center py-8 text-sm text-white/60">
            搜尋中…
          </Command.Loading>
        )}

        {!loading && !search.trim() && (
          <Command.Group
            heading="導航"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-white/50"
          >
            {navActions.map((action) => (
              <Command.Item
                key={action.id}
                value={`${action.title} ${action.url}`}
                onSelect={() => handleSelect(action.url)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-colors",
                  "data-[selected=true]:bg-primary-light/30 data-[selected=true]:text-accent"
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/80">
                  {action.icon}
                </span>
                <span className="truncate">{action.title}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {!loading && search.trim() && results.length > 0 && (
          <Command.Group
            heading="搜尋結果"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-white/50"
          >
            {results.map((result, i) => (
              <Command.Item
                key={`${result.url}-${i}`}
                value={`${result.meta?.title ?? ""} ${result.url}`}
                onSelect={() => handleSelect(result.url)}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg px-4 py-2.5 outline-none transition-colors",
                  "data-[selected=true]:bg-primary-light/30"
                )}
              >
                <span className="truncate text-sm font-medium text-white">
                  {result.meta?.title ?? result.url}
                </span>
                {result.excerpt && (
                  <span
                    className="line-clamp-2 text-xs text-white/60 [&_mark]:bg-accent/40 [&_mark]:font-semibold [&_mark]:text-white"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Empty className="py-8 text-center text-sm text-white/60">
          找不到結果
        </Command.Empty>
      </Command.List>

      <div className="border-t border-white/10 px-5 py-3 text-xs text-white/50">
        <span>ESC 關閉</span>
        <span className="ml-4">⌘K 開啟</span>
        <span className="ml-4 hidden sm:inline">以空格分隔詞彙可提升中文搜尋</span>
      </div>
    </Command.Dialog>
  );
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClick();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="搜尋 (⌘K)"
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <span className="hidden shrink-0 whitespace-nowrap sm:inline">搜尋</span>
      <kbd className="hidden rounded bg-black/20 px-1.5 py-0.5 text-xs font-semibold text-white/70 sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}
