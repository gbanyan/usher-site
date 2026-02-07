# CLAUDE.md

## Project Overview

Official website for 台灣尤塞氏症暨視聽弱協會 (Taiwan Usher Syndrome and Audiovisual Impairment Association). Built with Next.js 16 (App Router), migrated from a Hugo static site. Content is managed via a Laravel 10 headless CMS at `~/Project/usher-manage-stack`.

All UI text is in Traditional Chinese. This is a small NPO site.

## Commands

```bash
npm run dev          # Dev server with hot reload (needs Laravel API running on port 8001)
npm run build        # Production build — generates static HTML (needs Laravel API once)
npm run start        # Serve pre-built static site (NO Laravel needed)
npm run lint         # ESLint
npm run snapshot     # Generate local content snapshots from Laravel (for building without a live API)
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

- **Framework**: Next.js 16.1.6 (App Router, React 19)
- **Styling**: Tailwind CSS 4 with `@tailwindcss/typography`
- **Font**: Noto Sans TC (Google Fonts, via `next/font`)
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-raw`

## Architecture

### Static-First with On-Demand Revalidation

The site is **fully static after build**. No Laravel API needed at runtime.

- `next build` fetches all content from the Laravel API and generates static HTML
- `next start` serves pre-built pages — works without Laravel
- Content updates trigger on-demand revalidation via webhook (`POST /api/revalidate`)
- All `fetch()` calls use `revalidate: false` (no time-based ISR)

### Snapshot Mode (Build Without Laravel)

If the Laravel API is not available (e.g., for GitHub/Vercel builds), you can build from committed JSON snapshots.

1. With Laravel running locally on `http://localhost:8001`, generate snapshots:
   - `npm run snapshot`
2. Commit `content-snapshots/` and (optionally) `public/attachments/`
3. In Vercel, set `CONTENT_SOURCE=snapshot` (and do not rely on `NEXT_PUBLIC_API_URL`)

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
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1   # Laravel API base
REVALIDATE_TOKEN=your-secret-token-here             # Webhook auth token
```

Production values configured in Vercel (or hosting platform).

## Route Structure

| Route | Type | Description |
|---|---|---|
| `/` | Static | Homepage — static layout from Hugo `homepage.yml` + dynamic article lists |
| `/about` | Static | 創立目的 — content from Laravel `pages/about` |
| `/contact` | Static | 聯繫我們 — hardcoded contact info |
| `/blog` | Static | 部落格 listing — all blog articles |
| `/blog/[slug]` | SSG | Blog article detail |
| `/notice` | Static | 事務公告 listing |
| `/notice/[slug]` | SSG | Notice detail |
| `/document` | Static | 協會文件 listing |
| `/document/[slug]` | SSG | Document detail |
| `/related-news` | Static | 相關報導 listing |
| `/related-news/[slug]` | SSG | Related news detail |
| `/[pageSlug]` | SSG | Static pages: mission, structure, message, logo-represent |
| `/api/revalidate` | Dynamic | Webhook for on-demand cache invalidation |

## Key Files

- `src/lib/api.ts` — API client with `fetchAPI()`, all data-fetching functions
- `src/lib/types.ts` — TypeScript interfaces for all API data shapes
- `src/lib/utils.ts` — `formatDate()`, `formatFileSize()` helpers
- `src/app/page.tsx` — Homepage with static data constants (slider, features, about, documentary)
- `src/app/layout.tsx` — Root layout with Noto Sans TC font, Header, Footer
- `src/app/globals.css` — Tailwind config with custom theme colors
- `src/app/api/revalidate/route.ts` — Revalidation webhook endpoint
- `next.config.ts` — Remote image patterns for Laravel backend

## Components

- `Header.tsx` — Site navigation with logo (`/images/logo.png`)
- `Footer.tsx` — Site footer with logo and links
- `ArticleCard.tsx` — Reusable article card (used in listings and homepage)
- `Breadcrumbs.tsx` — Breadcrumb navigation
- `MarkdownRenderer.tsx` — Renders markdown content with `react-markdown`
- `Pagination.tsx` — Pagination component (currently unused — may be needed for client-side pagination later)

## Theme Colors

Defined in `globals.css` via `@theme inline`:
- `primary`: #1e3a5f (deep navy)
- `primary-light`: #2a5a8f
- `primary-dark`: #0f2440
- `accent`: #e8913a (orange)
- `accent-light`: #f0a85c
- `surface`: #f8f9fa
- `surface-dark`: #e9ecef

## Content Types

Four article types managed in Laravel, each with its own listing and detail page:

| Type | Path | Chinese Label |
|---|---|---|
| `blog` | `/blog` | 部落格 |
| `notice` | `/notice` | 事務公告 |
| `document` | `/document` | 協會文件 |
| `related_news` | `/related-news` | 相關報導 |

Mapping defined in `src/lib/types.ts` as `CONTENT_TYPE_PATHS`.

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
