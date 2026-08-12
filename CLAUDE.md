# CLAUDE.md

## Project Overview

Official website for 台灣尤塞氏症暨視聽弱協會 (Taiwan Usher Syndrome and Audiovisual Impairment Association). Built with Next.js 16 (App Router), migrated from a Hugo static site. Content is managed via a Laravel 10 headless CMS at `~/Project/usher-manage-stack`.

All UI text is in Traditional Chinese. This is a small NPO site.

## Commands

```bash
npm run dev              # Dev server with hot reload (needs Laravel API running on port 8001)
npm run build            # Production build — generates static HTML (needs Laravel API once)
npm run start            # Serve pre-built static site (NO Laravel needed)
npm run test             # Vitest unit suite
npm run lint             # ESLint
npm run snapshot         # Generate local content snapshots from Laravel (for building without a live API)
npm run check:content    # Validate snapshot Markdown formatting
npm run check:assets     # Verify every content reference resolves to a real file in public/
npm run refresh:content  # snapshot + both checks in one command (honours SNAPSHOT_API_URL)
```

## Development Workflow

**For polishing UI/CSS/layout (without Laravel):**
1. Run `npm run build` once with Laravel running (`php artisan serve --port=8001` in usher-manage-stack)
2. Stop Laravel if you want
3. Run `npm run start` — serves the pre-built static site at `http://localhost:3000`
4. After making code changes, re-run `npm run build && npm run start` to see updates
   (No Laravel needed for rebuild if the content hasn't changed — Next.js uses cached data from `.next/`)

**For active development with hot reload (needs Laravel):**
1. Start Laravel: `cd ~/Project/usher-manage-stack && php artisan serve --port=8001`
2. Run `npm run dev` — hot reload at `http://localhost:3000`

**Note**: `npm run dev` always server-renders and requires the Laravel API. For testing the final static output, always use `npm run build && npm run start`.

## Tech Stack

- **Framework**: Next.js 16.3.0 (App Router, React 19)
- **Styling**: Tailwind CSS 4 with `@tailwindcss/typography`
- **Font**: System font stack (PingFang TC, Heiti TC, Microsoft JhengHei, Noto Sans CJK TC, etc.); the logo wordmark uses a subset webfont (`/fonts/iansui-logo.woff2`) rendered by `Logo.tsx`
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-raw`

## Architecture

### Static-First with On-Demand Revalidation

The site is **fully static after build**. No Laravel API needed at runtime.

- `next build` fetches all content from the Laravel API and generates static HTML
- `next start` serves pre-built pages — works without Laravel
- Content updates trigger on-demand revalidation via webhook (`POST /api/revalidate`)
- All `fetch()` calls use `revalidate: false` (no time-based ISR)

### Snapshot Mode (Optional Fallback)

Default mode is `CONTENT_SOURCE=api`.  
Only use snapshot mode when the Laravel API cannot be reached during build.

1. With Laravel running locally on `http://localhost:8001`, generate snapshots:
   - `npm run snapshot`
2. Commit `content-snapshots/` and — only if snapshot builds must serve file
   attachments — also `public/attachments/` (plural: the folder `npm run
   snapshot` downloads attachments into, and the prefix snapshot-mode download
   URLs use). This is different from the legacy `public/attachment/`
   (singular) directory migrated from Hugo, which holds old PDFs that CMS
   content links to. To skip the attachment download use
   `npm run snapshot -- --skip-attachments`.
3. Set `CONTENT_SOURCE=snapshot` only for fallback deployments

### Content Source — Laravel API

Backend repo: `~/Project/usher-manage-stack` (Laravel 10, port **8001**)

**IMPORTANT**: Port 8000 is occupied by another project. Laravel runs on **port 8001**.

API base: `http://localhost:8001/api/v1` (set in `.env.local`)

Key endpoints:
- `GET /articles?type={blog|notice|document|related_news}&per_page=100` — article lists
- `GET /articles/{slug}` — article detail (response wrapped in `{ data, related }`)
- `GET /pages/{slug}` — page detail (response wrapped in `{ data: ... }`)
- `GET /categories` — categories (response wrapped in `{ data: [...] }`)
- `GET /homepage` — aggregated homepage data (NOT wrapped in `data`)
- `GET /articles/{slug}/attachments/{id}/download` — file download

**API response wrappers**: Single resources are wrapped in `{ "data": { ... } }` by Laravel JsonResource. The `getPage()` and `getCategories()` helpers unwrap this. The homepage endpoint is NOT wrapped.

### Image Architecture

Two image sources:

1. **Migrated images** (from Hugo): stored in `public/images/` and `public/attachment/`
   - API returns relative paths like `/images/blog/2024-lecture.jpg`
   - Served directly by Next.js from `public/`

2. **Admin-uploaded images** (via Laravel admin panel): stored in Laravel `storage/app/public/articles/`
   - API returns full URLs like `http://localhost:8001/storage/articles/images/...`
   - Production: `https://member.usher.org.tw/storage/articles/images/...`
   - `next.config.ts` has remote patterns for both production and dev (localhost:8001)

**Case sensitivity**: macOS is case-insensitive; Vercel (Linux) is case-sensitive. Watch for case mismatches in image filenames (e.g., `Logo_long.png` vs `logo_long.png`).

### Revalidation Webhook

`POST /api/revalidate` with header `x-revalidate-token`.

Body: `{ "type": "article" | "page", "slug": "optional-slug" }`

Invalidates Next.js cache tags:
- Article: `articles`, `homepage`, `article-{slug}`
- Page: `pages`, `homepage`, `page-{slug}`

Laravel calls this webhook automatically when admin creates/updates/publishes/archives/deletes content.

### Environment Variables

```
CONTENT_SOURCE=api                                   # Preferred source
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1   # Laravel API base
NEXT_PUBLIC_SITE_URL=https://www.usher.org.tw      # Absolute site URL for canonical, OG, sitemap, JSON-LD
REVALIDATE_TOKEN=your-secret-token-here             # Webhook auth token
```

Production values configured in Vercel (or hosting platform).

### SEO / GEO

- **Sitemap**: `/sitemap.xml` — dynamically generated from API content
- **Robots**: `/robots.txt` — allows all, disallows `/api/`, references sitemap
- **Metadata**: `metadataBase`, Open Graph, Twitter Cards, canonical URLs on all pages
- **JSON-LD**: Organization (layout), Article (article pages), WebPage (document pages)
- **GEO**: `geo.region: TW`, `geo.placename: Taiwan` in root layout
- **Helpers**: `src/lib/site.ts` (`getSiteUrl`), `src/lib/metadata.ts` (`buildArticleMetadata`, `buildPageMetadata`), `src/lib/jsonld.ts`

## Route Structure

| Route | Type | Description |
|---|---|---|
| `/` | Static | Homepage — static layout from Hugo `homepage.yml` + dynamic article lists |
| `/about` | Static | 創立目的 — content from Laravel `pages/about` |
| `/contact` | Static | 聯繫資訊 — organization profile from CMS with local fallbacks |
| `/blog` | Static | 部落格 listing — all blog articles |
| `/blog/[slug]` | SSG | Blog article detail |
| `/story`, `/story/[slug]` | Static/SSG | 病友故事 — blog articles in the `story` category |
| `/guides`, `/guides/[slug]` | Static/SSG | 建議與指引 — blog articles in the `guides` category |
| `/notice` | Static | 事務公告 listing |
| `/notice/[slug]` | SSG | Notice detail |
| `/document` | Static | 協會文件 listing |
| `/document/[slug]` | SSG | Document detail |
| `/related-news` | Static | 相關報導 listing |
| `/related-news/[slug]` | SSG | Related news detail |
| `/research` | Static | Permanent redirect to `/document` |
| `/[pageSlug]` | SSG | Static pages: structure, message, logo-represent |
| `/api/revalidate` | Dynamic | Webhook for on-demand cache invalidation |

## Key Files

- `src/lib/api.ts` — API client with `fetchAPI()`, all data-fetching functions
- `src/lib/types.ts` — TypeScript interfaces for all API data shapes
- `src/lib/transform.ts` — Legacy article ↔ public document mapping
- `src/lib/governance.ts` — Governance document lookup for about/contact pages
- `src/lib/article-sections.ts` — Shared per-section config (titles, paths, categories)
- `src/lib/contact.ts` — Organization profile fallbacks and phone/donation helpers
- `src/lib/utils.ts` — `formatDate()`, `formatFileSize()` helpers
- `src/lib/metadata.ts`, `src/lib/jsonld.ts`, `src/lib/site.ts` — SEO helpers
- `src/app/page.tsx` — Homepage with static data constants (slider, features, about, documentary)
- `src/app/layout.tsx` — Root layout with Header, Footer, skip link and JSON-LD
- `src/app/globals.css` — Tailwind config with custom theme colors
- `src/app/api/revalidate/route.ts` — Revalidation webhook endpoint
- `next.config.ts` — Remote image patterns for Laravel backend

## Components

- `Header.tsx` — Site navigation with `Logo` and accessible dropdowns
- `Footer.tsx` — Site footer with `Logo` and links
- `Logo.tsx` — Branded logo wordmark (subset webfont)
- `ArticleCard.tsx` — Reusable article card
- `ArticleListing.tsx` — Shared listing grid with empty/error states
- `ArticleDetail.tsx` — Shared article detail renderer
- `ArticleAttachments.tsx` — Attachment download list
- `HeroSlider.tsx` — Homepage carousel (single h1, reduced-motion aware)
- `SearchModal.tsx` — Pagefind search modal
- `PageHeader.tsx` — Page banner with breadcrumb
- `MarkdownRenderer.tsx` — Renders markdown content with `react-markdown`
- `JsonLd.tsx` — JSON-LD structured data component
- `ScrollToTop.tsx` — Scroll-to-top control

## Theme Colors

Defined in `globals.css` via `@theme inline`:
- `primary`: #1e3a5f (deep navy)
- `primary-light`: #2a5a8f
- `primary-dark`: #0f2440
- `accent`: #e8913a (orange)
- `accent-light`: #f0a85c
- `surface`: #f8f9fa
- `surface-dark`: #e9ecef

## Content Sections

Four article types come directly from the CMS; `/story` and `/guides` are blog
articles curated by CMS category. All per-section strings live in
`src/lib/article-sections.ts` (`ARTICLE_SECTION_CONFIG`); the CMS type→path
mapping is `CONTENT_TYPE_PATHS` in `src/lib/types.ts`.

| Section | Path | Source | Chinese Label |
|---|---|---|---|
| `blog` | `/blog` | CMS type `blog` | 部落格 |
| `notice` | `/notice` | CMS type `notice` | 事務公告 |
| `document` | `/document` | CMS type `document` | 協會文件 |
| `related_news` | `/related-news` | CMS type `related_news` | 相關報導 |
| `story` | `/story` | blog + category `story` | 病友故事 |
| `guides` | `/guides` | blog + category `guides` | 建議與指引 |

## Hugo Migration Notes

- Hugo archive preserved in git tag `hugo-archive`
- Original homepage layout defined in Hugo `data/zh-tw/homepage.yml` — replicated faithfully in `src/app/page.tsx`
- Static images restored from Hugo `static/` to Next.js `public/` (images/, attachment/)
- Page slugs updated from underscores to hyphens (e.g., `logo_represent` → `logo-represent`)
- Research section removed (was all Lorem ipsum placeholder content)

## Common Mistakes to Avoid

- Don't change the Laravel API port — it's 8001, not 8000
- Don't forget to unwrap `{ data: ... }` from API responses for single resources
- Always use optional chaining for `article.categories?.length`, `article.tags?.length`, `article.attachments?.length` — related articles from API may not include these
- Don't add `searchParams` to listing pages — it forces dynamic rendering and breaks static generation
- Watch for case sensitivity in image paths (macOS vs Linux/Vercel)
- `next dev` always server-renders (needs Laravel API); use `next build && next start` for static-only testing
