import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Element, ElementContent, Root } from "hast";
import type { ImageOptimizeFn } from "./images";
import {
  getEmbeddableYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from "./utils";

const DEMOTED: Record<string, string> = {
  h1: "h2",
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "h6",
  h6: "h6",
};

const SR_HINT = " (在新視窗開啟)";

function el(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = []
): Element {
  return { type: "element", tagName, properties, children };
}

function srHint(): Element {
  return el("span", { className: ["sr-only"] }, [{ type: "text", value: SR_HINT }]);
}

function externalAttrs(node: Element) {
  node.properties = {
    ...node.properties,
    target: "_blank",
    rel: ["noopener", "noreferrer"],
  };
  node.children.push(srHint());
}

function standaloneYouTubeLink(p: Element): string | null {
  const kids = p.children.filter(
    (c) => !(c.type === "text" && c.value.trim() === "")
  );
  if (kids.length !== 1) return null;
  const [only] = kids;
  if (only.type !== "element" || only.tagName !== "a") return null;
  const href = only.properties?.href;
  if (typeof href !== "string") return null;
  return getEmbeddableYouTubeId(href, toString(only)) ? href : null;
}

function youTubeFigure(href: string): Element | null {
  const id = getYouTubeVideoId(href);
  const src = getYouTubeEmbedUrl(href);
  if (!id || !src) return null;
  const link = el(
    "a",
    { href, target: "_blank", rel: ["noopener", "noreferrer"] },
    [{ type: "text", value: "在 YouTube 觀看" }, srHint()]
  );
  return el("figure", { className: ["my-6"] }, [
    el("div", { className: ["aspect-video", "w-full", "overflow-hidden", "rounded-lg"] }, [
      el("iframe", {
        src,
        title: `YouTube 影片播放器（影片 ${id}）`,
        loading: "lazy",
        allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture",
        allowFullScreen: true,
        className: ["h-full", "w-full"],
      }),
    ]),
    el("figcaption", { className: ["mt-2", "text-sm"] }, [link]),
  ]);
}

const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/** Mirrors react-markdown's defaultUrlTransform. */
function safeUrl(url: string): string {
  const colon = url.indexOf(":");
  const question = url.indexOf("?");
  const hash = url.indexOf("#");
  const slash = url.indexOf("/");
  if (
    colon < 0 ||
    (slash > -1 && colon > slash) ||
    (question > -1 && colon > question) ||
    (hash > -1 && colon > hash) ||
    SAFE_PROTOCOL.test(url.slice(0, colon))
  ) {
    return url;
  }
  return "";
}

function sanitizeUrls(tree: Root) {
  visit(tree, "element", (node, index, parent) => {
    if (node.tagName === "a" && typeof node.properties?.href === "string") {
      const href = safeUrl(node.properties.href);
      if (href) node.properties.href = href;
      else delete node.properties.href;
    } else if (node.tagName === "img") {
      const src = typeof node.properties?.src === "string" ? safeUrl(node.properties.src) : "";
      if (!src && parent && typeof index === "number") {
        parent.children.splice(index, 1);
        return index;
      }
      node.properties.src = src;
    }
  });
}

function rehypeSiteBehaviours() {
  return (tree: Root) => {
    sanitizeUrls(tree);
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName in DEMOTED) {
        node.tagName = DEMOTED[node.tagName];
        return;
      }
      if (node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href === "string" && href.startsWith("http")) {
          externalAttrs(node);
        }
        return;
      }
      if (node.tagName === "img") {
        node.properties = {
          ...node.properties,
          alt: node.properties?.alt ?? "",
          width: 800,
          height: 450,
          loading: "lazy",
          decoding: "async",
          className: ["h-auto", "w-full"],
        };
        if (parent && typeof index === "number") {
          parent.children[index] = el(
            "span",
            { className: ["my-4", "block", "overflow-hidden", "rounded-lg"] },
            [node]
          );
          return "skip";
        }
        return;
      }
      if (node.tagName === "p" && parent && typeof index === "number") {
        const href = standaloneYouTubeLink(node);
        const figure = href ? youTubeFigure(href) : null;
        if (figure) {
          parent.children[index] = figure;
          return "skip";
        }
        return;
      }
      if (node.tagName === "table" && parent && typeof index === "number") {
        node.properties = {
          ...node.properties,
          className: ["min-w-max", "border-collapse", "text-sm"],
        };
        parent.children[index] = el(
          "div",
          {
            className: "my-4 -mx-2 overflow-x-auto rounded-lg border border-white/10 px-2 sm:mx-0 sm:px-0".split(" "),
            role: "region",
            ariaLabel: "表格（小螢幕可左右滑動）",
            tabIndex: 0,
          },
          [node]
        );
        return "skip";
      }
    });
  };
}

/** Same hint next/image used for Markdown images on the old site. */
const MARKDOWN_IMAGE_SIZES = "(max-width: 768px) 100vw, 800px";

/**
 * Swap each (already sanitised) image for its build-time responsive variants
 * when the caller supplies an optimiser. Failures propagate so the build fails.
 */
function rehypeResponsiveImages() {
  return async (tree: Root, file: { data: Record<string, unknown> }) => {
    const optimizeImage = file.data.optimizeImage as ImageOptimizeFn | undefined;
    if (!optimizeImage) return;
    const images: Element[] = [];
    visit(tree, "element", (node) => {
      if (node.tagName === "img" && typeof node.properties?.src === "string") images.push(node);
    });
    await Promise.all(
      images.map(async (node) => {
        const result = await optimizeImage(node.properties.src as string);
        if (!result) return;
        node.properties = {
          ...node.properties,
          src: result.src,
          srcSet: result.srcset,
          sizes: MARKDOWN_IMAGE_SIZES,
          width: result.width,
          height: result.height,
        };
      })
    );
  };
}

function normalizeMultilineLinks(markdown: string): string {
  return markdown.replace(
    /\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
    "[$1]($2)"
  );
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSiteBehaviours)
  .use(rehypeResponsiveImages)
  .use(rehypeStringify);

export interface RenderMarkdownOptions {
  /** Build-time image optimiser (see ./images); omitted in unit tests. */
  optimizeImage?: ImageOptimizeFn;
}

export async function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): Promise<string> {
  if (!markdown) return "";
  const file = await processor.process({
    value: normalizeMultilineLinks(markdown),
    data: { optimizeImage: options.optimizeImage },
  });
  return String(file);
}
