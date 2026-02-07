import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface RevalidateBody {
  type: "article" | "page";
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

  if (type !== "article" && type !== "page") {
    return NextResponse.json(
      { error: "Invalid type. Must be 'article' or 'page'." },
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

  return NextResponse.json({
    revalidated: true,
    tags: revalidatedTags,
    timestamp: Date.now(),
  });
}
