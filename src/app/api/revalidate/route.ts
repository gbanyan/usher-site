import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

interface RevalidateBody {
  type: "article" | "page" | "document";
  slug?: string;
}

function secureEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidate-token");
  const expectedToken = process.env.REVALIDATE_TOKEN;

  if (!expectedToken || !token || !secureEqual(token, expectedToken)) {
    return NextResponse.json(
      { error: "Invalid revalidation token" },
      { status: 401 }
    );
  }

  let body: RevalidateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { type, slug } = body;

  if (type !== "article" && type !== "page" && type !== "document") {
    return NextResponse.json(
      { error: "Invalid type. Must be 'article', 'page', or 'document'." },
      { status: 400 }
    );
  }

  const revalidatedTags: string[] = [];

  if (type === "article") {
    revalidateTag("articles", "max");
    revalidateTag("homepage", "max");
    revalidatedTags.push("articles", "homepage");

    if (slug) {
      revalidateTag(`article-${slug}`, "max");
      revalidatedTags.push(`article-${slug}`);
    }
  }

  if (type === "page") {
    revalidateTag("pages", "max");
    revalidateTag("homepage", "max");
    revalidatedTags.push("pages", "homepage");

    if (slug) {
      revalidateTag(`page-${slug}`, "max");
      revalidatedTags.push(`page-${slug}`);
    }
  }

  if (type === "document") {
    revalidateTag("documents", "max");
    revalidatedTags.push("documents");

    if (slug) {
      revalidateTag(`document-${slug}`, "max");
      revalidatedTags.push(`document-${slug}`);
    }
  }

  return NextResponse.json({
    revalidated: true,
    tags: revalidatedTags,
    timestamp: Date.now(),
  });
}
