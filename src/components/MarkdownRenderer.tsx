"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;

    // For data URIs, use a plain img element
    if (src.startsWith("data:")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ""} loading="lazy" />
      );
    }

    return (
      <span className="my-4 block overflow-hidden rounded-lg">
        <Image
          src={src}
          alt={alt || ""}
          width={800}
          height={450}
          className="h-auto w-full"
          sizes="(max-width: 768px) 100vw, 800px"
          loading="lazy"
        />
      </span>
    );
  },
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
        {isExternal && <span className="sr-only"> (在新視窗開啟)</span>}
      </a>
    );
  },
  table: ({ children }) => (
    <div
      className="my-4 overflow-x-auto"
      role="region"
      aria-label="表格"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  ),
};

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div
      className={`prose prose-invert prose-gray max-w-none prose-headings:text-white prose-a:text-accent hover:prose-a:text-white prose-img:rounded-lg ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
