import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface RevalidateBody {
  type: "article" | "page";
  slug?: string;
}

const EXPIRE_IMMEDIATELY = { expire: 0 };

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
    revalidateTag("articles", EXPIRE_IMMEDIATELY);
    revalidateTag("homepage", EXPIRE_IMMEDIATELY);
    revalidatedTags.push("articles", "homepage");

    if (slug) {
      revalidateTag(`article-${slug}`, EXPIRE_IMMEDIATELY);
      revalidatedTags.push(`article-${slug}`);
    }
  }

  if (type === "page") {
    revalidateTag("pages", EXPIRE_IMMEDIATELY);
    revalidateTag("homepage", EXPIRE_IMMEDIATELY);
    revalidatedTags.push("pages", "homepage");

    if (slug) {
      revalidateTag(`page-${slug}`, EXPIRE_IMMEDIATELY);
      revalidatedTags.push(`page-${slug}`);
    }
  }

  return NextResponse.json({
    revalidated: true,
    tags: revalidatedTags,
    timestamp: Date.now(),
  });
}
