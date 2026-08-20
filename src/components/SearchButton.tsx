"use client";

import { useEffect } from "react";

export function SearchIcon({ className }: { className?: string }) {
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

export function SearchButton({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
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
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <span className="sr-only shrink-0 whitespace-nowrap sm:not-sr-only sm:inline">
        搜尋
      </span>
      <kbd aria-hidden="true" className="hidden rounded bg-black/20 px-1.5 py-0.5 text-xs font-semibold text-white/70 sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}
