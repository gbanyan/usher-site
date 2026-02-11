import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface RevalidateBody {
  type: "article" | "page" | "document";
  slug?: string;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidate-token");

  if (!token || token !== process.env.REVALIDATE_TOKEN) {
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
