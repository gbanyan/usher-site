# Development Guide

Setup and workflow notes for the association website. For what the project is and
why it is built this way, see the [README](../README.md).

## Prerequisites

- **Node.js 24.x** (see `.nvmrc` and the `engines` field in `package.json`)
- **The Laravel CMS**, if you need fresh content. It lives in a separate
  repository and runs on **port 8001** — not 8000, which is occupied by another
  project on the maintainer's machine.

```bash
npm install
```

## Two ways to work

### Polishing UI, styling or layout — no CMS needed

The site is fully static once built, so you only need the CMS for the initial
content fetch.

```bash
npm run build   # fetches content, generates static HTML (CMS must be running)
npm run start   # serves the built site at http://localhost:3000
```

After changing code, re-run `npm run build && npm run start`. The CMS does not
need to be running again unless the content itself changed — Next.js reuses the
cached data in `.next/`.

### Active development with hot reload — CMS required

```bash
# in the CMS repository
php artisan serve --port=8001

# here
npm run dev     # http://localhost:3000
```

`next dev` always server-renders, so it needs a reachable API. To test what
production actually serves, use `build` + `start` instead.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload. Requires the CMS. |
| `npm run build` | Production build, then generates the Pagefind search index. |
| `npm run start` | Serves the pre-built static site. No CMS needed. |
| `npm run test` | Runs the vitest unit suite. |
| `npm run check:content` | Validates snapshot Markdown for formatting errors (run before committing a snapshot refresh). |
| `npm run check:assets` | Verifies every content reference resolves to a real file under `public/`. Exits 1 on missing references. |
| `npm run check:a11y` | Static accessibility invariants over the built output (single page heading, skip links, focus ring). Run after `npm run build`. |
| `npm run lint` | ESLint. |
| `npm run snapshot` | Writes local content snapshots from the CMS into `content-snapshots/`. |
| `npm run refresh:content` | One-command content refresh: `snapshot`, then both checks. Honours `SNAPSHOT_API_URL`. |
| `npm run subset-logo-font` | Regenerates the subset logo webfont (`public/fonts/iansui-logo.woff2`). |
| `npm run extract-logo-icon` | Extracts the logo icon asset. |

`npm run build` runs `next build`, then indexes the output with Pagefind and
copies the index to `public/_pagefind`.

`node scripts/crop-tcu-logo.mjs` is a one-off logo-prep tool (not a package
script); it is documented in `docs/assets/partner-logo-sources.md` and consumes
`sharp`.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests. It
executes the whole guard chain in a snapshot-mode build, so it needs no CMS
access and no secrets:

```
npm ci → lint → test → check:content → check:assets → build → check:a11y
```

`CONTENT_SOURCE=snapshot` makes `next build` read the committed
`content-snapshots/` instead of the CMS, so a fresh checkout is reproducible.
Deployment stays on Vercel and is independent of this workflow.

Adding a CI step: it must not require the CMS (use snapshot mode), must not
need secrets that trip other contributors, and ideally must run in under a few
minutes.

## Environment variables

```bash
CONTENT_SOURCE=api                                # "api" (default) or "snapshot"
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1  # CMS API base
NEXT_PUBLIC_SITE_URL=https://www.usher.org.tw     # canonical URLs, OG tags, sitemap, JSON-LD
REVALIDATE_TOKEN=your-secret-token-here           # shared secret for the webhook
SNAPSHOT_API_URL=https://member.usher.org.tw/api/v1 # optional; target for `npm run snapshot` / `refresh:content`
```

Copy `.env.example` to `.env.local` to get started. Production values are
configured on the hosting platform.

## Content sources

### API mode (default)

`next build` fetches every article and page from the CMS and writes static HTML.
All `fetch()` calls use `revalidate: false` — there is no time-based
revalidation, only the webhook below.

### Snapshot mode (fallback)

Use this only when the CMS cannot be reached at build time, for example in a CI
environment with no access to the backend.

```bash
# with the CMS running locally
npm run snapshot         # writes content-snapshots/
```

Commit `content-snapshots/`, then set `CONTENT_SOURCE=snapshot` for that
deployment.

If snapshot builds must also serve file attachments, commit
`public/attachments/` (plural) as well: `snapshot-content.mjs` downloads
attachments there by default and snapshot-mode download URLs point at
`/attachments/…`. This is separate from the legacy `public/attachment/`
(singular) directory migrated from Hugo. Use
Use `npm run snapshot -- --skip-attachments` to skip the download.

### Refreshing committed content

After CMS content changes, refresh the committed snapshot mirror and run the
checks that guard the build:

```bash
# local CMS on port 8001
npm run refresh:content

# against the production CMS
SNAPSHOT_API_URL=https://member.usher.org.tw/api/v1 npm run refresh:content
```

`refresh:content` chains `snapshot` → `check:content` → `check:assets`. The
final step is the safety net for asset deletions: it fails (exit 1) if any
content references a path under `public/` that does not exist, and prints the
`git checkout` command to restore each missing file from history. Commit the
regenerated snapshots, attachment downloads and any restored assets before
deploying.

### API shapes

Single resources come back wrapped by Laravel's `JsonResource`:

```jsonc
{ "data": { /* the page or article */ } }
```

`getPage()` and `getCategories()` unwrap this for you. The `/homepage` endpoint
is **not** wrapped — it returns its payload directly. Article detail responses
carry a sibling `related` key alongside `data`.

Key endpoints:

| Endpoint | Returns |
|---|---|
| `GET /articles?type={blog\|notice\|document\|related_news}` | Article lists |
| `GET /articles/{slug}` | Article detail, plus `related` |
| `GET /pages/{slug}` | Page detail |
| `GET /categories` | Categories |
| `GET /homepage` | Aggregated homepage payload |
| `GET /articles/{slug}/attachments/{id}/download` | File download |

## Revalidation webhook

Editors publishing in the CMS should not have to wait for a rebuild, so the CMS
calls the site when content changes.

```
POST /api/revalidate
x-revalidate-token: <REVALIDATE_TOKEN>

{ "type": "article" | "page", "slug": "optional-slug" }
```

Cache tags invalidated:

- `type: "article"` → `articles`, `homepage`, `article-{slug}`
- `type: "page"` → `pages`, `homepage`, `page-{slug}`

The CMS fires this automatically on create, update, publish, archive and delete.

## Images

Two sources, handled differently:

1. **Migrated assets** from the original Hugo site live in `public/images/` and
   `public/attachment/`. The API returns relative paths such as
   `/images/blog/2024-lecture.jpg`, served straight out of `public/`.
2. **CMS uploads** live on the Laravel backend. The API returns absolute URLs
   such as `https://member.usher.org.tw/storage/articles/images/...`. Both the
   production host and `localhost:8001` are allowed in the `remotePatterns`
   config in `next.config.ts` — a new backend host needs adding there.

## Gotchas

- **Case-sensitive paths.** macOS is case-insensitive, Linux hosting is not. A
  reference to `logo_long.png` for a file named `Logo_long.png` works locally and
  breaks in production.
- **No `searchParams` on listing pages.** Reading them forces dynamic rendering
  and breaks static generation. Paginate client-side instead.
- **Optional chaining on article relations.** `article.categories`,
  `article.tags` and `article.attachments` are absent on related-article
  payloads. Always use `?.length`.
- **Port 8001, not 8000**, for the CMS.

## Project layout

| Path | Contents |
|---|---|
| `src/app/` | Routes (App Router), `layout.tsx`, `globals.css` |
| `src/components/` | Shared UI components |
| `src/lib/api.ts` | API client and every data-fetching function |
| `src/lib/types.ts` | Interfaces for API payloads, `CONTENT_TYPE_PATHS` |
| `src/lib/metadata.ts`, `src/lib/jsonld.ts`, `src/lib/site.ts` | SEO helpers |
| `content-snapshots/` | Committed content for snapshot mode |
| `scripts/` | Build utilities: snapshots, snapshot Markdown checks, font subsetting, logo prep |
| `hugo-archive/` | The original Hugo site, kept for reference |

`CLAUDE.md` in the repository root covers the same ground in a format aimed at
coding agents.
