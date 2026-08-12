"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import type { Components, ExtraProps } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const DEMOTED_HEADINGS = {
  h1: "h2",
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "h6",
  h6: "h6",
} as const;

type HeadingLevel = keyof typeof DEMOTED_HEADINGS;

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & ExtraProps;

/**
 * Content headings are demoted by one level (h1→h2 … h6 stays h6). The page's
 * own title owns the single h1 (PageHeader on content pages, the first hero
 * slide on the homepage); CMS markdown that starts with `#` would otherwise
 * duplicate it.
 */
function ShiftedHeading({ level }: { level: HeadingLevel }) {
  return function Heading({ node, ...props }: HeadingProps) {
    void node; // react-markdown injects the AST node; do not forward it to DOM
    const Tag = DEMOTED_HEADINGS[level];
    return <Tag {...props} />;
  };
}

const demotedHeadingComponents: Pick<
  Components,
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
> = {
  h1: ShiftedHeading({ level: "h1" }),
  h2: ShiftedHeading({ level: "h2" }),
  h3: ShiftedHeading({ level: "h3" }),
  h4: ShiftedHeading({ level: "h4" }),
  h5: ShiftedHeading({ level: "h5" }),
  h6: ShiftedHeading({ level: "h6" }),
};

const components: Components = {
  ...demotedHeadingComponents,
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;

    // For data URIs, use a plain img element
    if (src.startsWith("data:")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} loading="lazy" />
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
      className="my-4 -mx-2 overflow-x-auto rounded-lg border border-white/10 px-2 sm:mx-0 sm:px-0"
      role="region"
      aria-label="表格（小螢幕可左右滑動）"
      tabIndex={0}
    >
      <table className="min-w-max border-collapse text-sm">{children}</table>
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
      className={`prose prose-invert prose-dark prose-lg max-w-none prose-headings:text-white prose-a:text-accent hover:prose-a:text-accent-light prose-img:rounded-lg ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
