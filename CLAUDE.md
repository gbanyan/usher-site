# CLAUDE.md

## Project Overview

Official website for 台灣尤塞氏症暨視聽弱協會 (Taiwan Usher Syndrome and Audiovisual Impairment Association). Built with Astro (static output), migrated from Hugo and then from Next.js. Content is managed via a Laravel 10 headless CMS at `~/Project/usher-manage-stack`.

All UI text is in Traditional Chinese. This is a small NPO site.

## Commands

```bash
npm run dev              # Astro dev server (http://localhost:4321); needs the CMS API
npm run build            # astro build + Pagefind index (dist/_pagefind) + build-coverage check
npm run preview          # Serve dist/ locally (no CMS needed)
npm run test             # Vitest unit suite
npm run lint             # astro check + ESLint
npm run snapshot         # Generate local content snapshots from the CMS (for building without a live API)
npm run check:content    # Validate snapshot Markdown formatting
npm run check:assets     # Verify every content reference resolves to a real file in public/
npm run check:a11y       # Static accessibility invariants over built output (run after build)
npm run check:build-coverage  # Sitemap/link/section coverage over dist/ (also runs in build)
npm run check:parity <oldBase> <newBase>  # Page-by-page parity of two deployments
npm run refresh:content  # snapshot + both checks in one command (honours SNAPSHOT_API_URL)
```

## Development Workflow

1. Start Laravel: `cd ~/Project/usher-manage-stack && php artisan serve --port=8001`
2. Set `CMS_API_URL=http://localhost:8001/api/v1` in `.env.local`
3. `npm run dev` for hot reload, or `npm run build && npm run preview` to test the final static output.

Without the CMS, use snapshot mode: `CONTENT_SOURCE=snapshot npm run build`.

## Tech Stack

- **Framework**: Astro 7.4.2, `output: "static"`, TypeScript
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite`, plus `@tailwindcss/typography`
- **Markdown**: build-time `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-stringify` in `src/lib/markdown.ts`, with URL sanitising (no client-side markdown)
- **Interactivity**: vanilla TypeScript in `<script>` blocks (no UI framework): header dropdowns, hero slider, search dialog, pagination
- **Search**: Pagefind, index served at `/_pagefind`
- **Font**: System font stack (PingFang TC, Heiti TC, Microsoft JhengHei, Noto Sans CJK TC, etc.); the logo wordmark uses a subset webfont (`/fonts/iansui-logo.woff2`) rendered by `Logo.astro`

## Architecture

### Fully static, rebuilt on publish

The site is **fully static**. There is no server, ISR or revalidation at runtime.

- `astro build` fetches all content from the Laravel CMS and writes static HTML to `dist/`. Builds are **all-or-nothing**: a failed fetch fails the build (never catch-and-fallback), so a broken CMS can never publish a half-empty site.
- When an editor publishes, the CMS triggers a rebuild and the site redeploys in about 2 minutes. Hosting is **Cloudflare Workers Static Assets** (`wrangler.jsonc`, no Worker code); GitHub Actions deploys on push to main, CMS repository_dispatch, or manual run. The old Vercel project remains only as a rollback target until it is removed. A scheduled rebuild also runs daily at 03:00.
- The build sends `X-Site-Build-Token` (`SITE_BUILD_TOKEN`) so the CMS allows the bulk fetch. The token must never appear in `dist/`.
- URL shape: `build.format: "file"` emits `/about.html`; Cloudflare `assets.html_handling: "drop-trailing-slash"` serves `/about` (`/about/` and `/about.html` answer 307 to `/about`), and `assets.not_found_handling: "404-page"` serves the site 404 page. `public/_redirects` holds the five permanent (308) redirects: `/blog` and `/notice` to `/news`, `/message` to `/about`, `/research` to `/document`, `/logo_represent` to `/logo-represent`.
- Use `toRoutePath(Astro.url.pathname)` (`src/lib/nav.ts`) to get the public route path (it strips `.html`); never build links from `Astro.url`.

### Snapshot Mode (Optional Fallback)

Default is `CONTENT_SOURCE=api`. CI uses `CONTENT_SOURCE=snapshot`, which reads committed `content-snapshots/` instead of the CMS.

1. With the CMS reachable, generate snapshots: `npm run snapshot` (reads `SNAPSHOT_API_URL`, else `CMS_API_URL`; sends `X-Site-Build-Token`).
2. Commit `content-snapshots/` and, only if snapshot builds must serve file attachments, also `public/attachments/` (plural: the folder `npm run snapshot` downloads into). This differs from the legacy `public/attachment/` (singular) migrated from Hugo. Skip the download with `npm run snapshot -- --skip-attachments`.

### Content Source — Laravel API

Backend repo: `~/Project/usher-manage-stack` (Laravel 10, port **8001**)

**IMPORTANT**: Port 8000 is occupied by another project. Laravel runs on **port 8001**.

API base: `CMS_API_URL`, e.g. `http://localhost:8001/api/v1` locally, `https://member.usher.org.tw/api/v1` in production.

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
   - Served directly from `public/`

2. **Admin-uploaded images** (via Laravel admin panel): stored in Laravel `storage/app/public/articles/`
   - API returns full URLs like `http://localhost:8001/storage/articles/images/...`
   - Production: `https://member.usher.org.tw/storage/articles/images/...`
   - Remote images are plain `<img>` tags; no image optimiser configuration is needed

**Case sensitivity**: macOS is case-insensitive; Cloudflare (Linux) is case-sensitive. Watch for case mismatches in image filenames (e.g., `Logo_long.png` vs `logo_long.png`).

### Environment Variables

```
CONTENT_SOURCE=api                                   # "api" (default) or "snapshot"
CMS_API_URL=http://localhost:8001/api/v1            # Laravel API base
SITE_URL=https://www.usher.org.tw                   # Absolute site URL for canonical, OG, sitemap, JSON-LD
SITE_BUILD_TOKEN=...                                 # Sent as X-Site-Build-Token during build
VERCEL_AUTOMATION_BYPASS_SECRET=...                  # Only for check:parity against a protected Vercel preview (legacy)
```

The old `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` are still read as fallbacks (kept for rollback). Production values are GitHub Actions secrets/variables.

### SEO / GEO

- **Sitemap**: `/sitemap.xml` — generated at build from API content (`src/lib/sitemap.ts`)
- **Robots**: `/robots.txt` — allows all, references sitemap
- **Metadata**: `metadataBase`, Open Graph, Twitter Cards, canonical URLs on all pages
- **JSON-LD**: Organization (layout), Article (article pages), WebPage (document pages)
- **GEO**: `geo.region: TW`, `geo.placename: Taiwan` in root layout
- **Helpers**: `src/lib/site.ts` (`getSiteUrl`), `src/lib/metadata.ts` (`buildArticleMetadata`, `buildPageMetadata`), `src/lib/jsonld.ts`

## Route Structure

Same public URLs as the former Next.js site. All pages are static.

| Route | Description |
|---|---|
| `/` | Homepage — static layout from Hugo `homepage.yml` (`src/data/homepage.ts`) + article lists |
| `/en` | English association entry point |
| `/about` | 創立目的 — CMS `pages/about` |
| `/contact` | 聯繫資訊 — organization profile from CMS with local fallbacks |
| `/news` | 活動與公告 combined listing (blog + notice) |
| `/blog/[slug]`, `/notice/[slug]` | Article detail |
| `/story`, `/story/[slug]` | 病友故事 — blog articles in the `story` category |
| `/guides`, `/guides/[slug]` | 建議與指引 — blog articles in the `guides` category |
| `/document`, `/document/[slug]` | 協會文件 |
| `/related-news`, `/related-news/[slug]` | 相關報導 |
| `/faq`, `/logo-represent`, … | CMS-backed static pages |
| `/sitemap.xml`, `/robots.txt` | Generated at build |
| `/_pagefind/*` | Search index (generated after build) |
| `/blog`, `/notice`, `/message`, `/research`, `/logo_represent` | Redirects defined in `public/_redirects` (no Astro page) |

## Key Files

- `astro.config.mjs` — static output, `build.format: "file"`, `trailingSlash: "never"`, Tailwind vite plugin
- `wrangler.jsonc` — Cloudflare Workers Static Assets config (directory, html_handling, 404 page); `public/_redirects` — permanent redirects
- `src/lib/api.ts` — API client, all data-fetching functions (errors propagate: all-or-nothing builds)
- `src/lib/types.ts` — TypeScript interfaces for API data, `CONTENT_TYPE_PATHS`
- `src/lib/article-paths.ts` — shared `getStaticPaths` helper for article detail routes
- `src/lib/transform.ts` — Legacy article ↔ public document mapping
- `src/lib/governance.ts` — Governance document lookup for about/contact pages
- `src/lib/article-sections.ts` — Per-section config (titles, paths, categories)
- `src/lib/contact.ts` — Organization profile fallbacks and phone/donation helpers
- `src/lib/markdown.ts` — Build-time markdown to sanitised HTML
- `src/lib/nav.ts` — Navigation model and `toRoutePath()`
- `src/lib/paginated-dom.ts` — Shared client-side pagination logic
- `src/lib/sitemap.ts`, `metadata.ts`, `jsonld.ts`, `site.ts` — SEO helpers
- `src/lib/parity.ts` — Logic behind `check:parity`
- `src/layouts/BaseLayout.astro` — Root layout (Head, Header, Footer, skip link, JSON-LD)
- `src/styles/global.css` — Tailwind config with custom theme colors
- `src/data/homepage.ts` — Homepage static data (slider, features, about, documentary)
- `scripts/` — snapshot, content/asset/a11y/coverage checks, parity checker (`parity-allow.json`)

## Components (`src/components/*.astro`)

- `Head.astro`, `JsonLd.astro` — metadata and structured data
- `Header.astro` — Navigation with `Logo` and accessible dropdowns (vanilla TS)
- `Footer.astro`, `Logo.astro`, `Icon.astro`
- `ArticleCard.astro`, `ArticleListing.astro`, `ArticleDetail.astro`, `ArticleAttachments.astro`, `DocumentList.astro`
- `PaginatedGrid.astro`, `PaginationControls.astro` — no-JS-safe pagination
- `HeroSlider.astro` — Homepage carousel (single h1, reduced-motion aware)
- `SearchDialog.astro` — Pagefind search dialog (native `<dialog>`)
- `PageHeader.astro` — Page banner with breadcrumb
- `CmsPage.astro`, `Markdown.astro` — CMS page and markdown rendering
- `ScrollToTop.astro`

## Theme Colors

Defined in `src/styles/global.css` via `@theme inline`:
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
| `news` | `/news` | notice + blog (excl. story/guides) | 活動與公告 |
| `blog` | `/blog` | CMS type `blog` | 部落格 (detail pages only) |
| `notice` | `/notice` | CMS type `notice` | 事務公告 (detail pages only) |
| `document` | `/document` | CMS type `document` | 協會文件 |
| `related_news` | `/related-news` | CMS type `related_news` | 相關報導 |
| `story` | `/story` | blog + category `story` | 病友故事 |
| `guides` | `/guides` | blog + category `guides` | 建議與指引 |

## Hugo Migration Notes

- Hugo archive preserved in git tag `hugo-archive`
- Original homepage layout defined in Hugo `data/zh-tw/homepage.yml` — replicated faithfully in `src/data/homepage.ts` and `src/pages/index.astro`
- Static images restored from Hugo `static/` to `public/` (images/, attachment/)
- Page slugs updated from underscores to hyphens (e.g., `logo_represent` → `logo-represent`)
- Research section removed (was all Lorem ipsum placeholder content)

## Common Mistakes to Avoid

- Don't change the Laravel API port — it's 8001, not 8000
- Don't forget to unwrap `{ data: ... }` from API responses for single resources
- Always use optional chaining for `article.categories?.length`, `article.tags?.length`, `article.attachments?.length` — related articles from API may not include these
- Never catch-and-fallback inside `getStaticPaths` or page frontmatter: a failed fetch must fail the build, not publish an empty page
- Use `toRoutePath()` for the current route and never build links from `Astro.url` (with `build.format: "file"` it contains `.html`)
- Don't put `SITE_BUILD_TOKEN` in anything that reaches `dist/` (no `PUBLIC_` prefix, no inlining into client scripts)
- Watch for case sensitivity in image paths (macOS vs Linux/Cloudflare)
- Pagination is client-side over fully rendered lists; there is no server, so no query-string driven pages
