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

The site is fully static once built, so you only need the CMS (or committed
snapshots) for the build itself.

```bash
npm run build     # fetches content, writes dist/, builds the Pagefind index
npm run preview   # serves dist/ at http://localhost:4321
# or, without any CMS:
CONTENT_SOURCE=snapshot npm run build && npm run preview
```

### Active development with hot reload — CMS required

```bash
# in the CMS repository
php artisan serve --port=8001

# here (CMS_API_URL=http://localhost:8001/api/v1 in .env.local)
npm run dev     # http://localhost:4321
```

The dev server fetches content on demand and needs a reachable API. Pagefind
search only exists after a build, so test search with `build` + `preview`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Astro dev server with hot reload. Requires the CMS. |
| `npm run build` | `astro build`, then the Pagefind index (`dist/_pagefind`), then `check:build-coverage`. |
| `npm run preview` | Serves the pre-built `dist/`. No CMS needed. |
| `npm run check:build-coverage` | Sitemap entries, internal detail links and per-section pages all resolve in `dist/`. Runs inside `build`. |
| `npm run check:parity <oldBase> <newBase>` | Compares status, redirects and page facts of two deployments, using `scripts/parity-allow.json`. Set `VERCEL_AUTOMATION_BYPASS_SECRET` for protected previews. |
| `npm run test` | Runs the vitest unit suite. |
| `npm run check:content` | Validates snapshot Markdown for formatting errors (run before committing a snapshot refresh). |
| `npm run check:assets` | Verifies every content reference resolves to a real file under `public/`. Exits 1 on missing references. |
| `npm run check:a11y` | Static accessibility invariants over the built output (single page heading, skip links, focus ring). Run after `npm run build`. |
| `npm run lint` | `astro check` (types) and ESLint. |
| `npm run snapshot` | Writes local content snapshots from the CMS into `content-snapshots/`. |
| `npm run refresh:content` | One-command content refresh: `snapshot`, then both checks. Honours `SNAPSHOT_API_URL`. |
| `npm run subset-logo-font` | Regenerates the subset logo webfont (`public/fonts/iansui-logo.woff2`). |
| `npm run extract-logo-icon` | Extracts the logo icon asset. |

The build uses `build.format: "file"` (so `/about` is emitted as `about.html`);
`vercel.json` (`cleanUrls`, `trailingSlash: false`) serves it as `/about` and
holds the permanent redirects.

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

`CONTENT_SOURCE=snapshot` makes `astro build` read the committed
`content-snapshots/` instead of the CMS, so a fresh checkout is reproducible.
Deployment stays on Vercel and is independent of this workflow.

Adding a CI step: it must not require the CMS (use snapshot mode), must not
need secrets that trip other contributors, and ideally must run in under a few
minutes.

## Environment variables

```bash
CONTENT_SOURCE=api                                # "api" (default) or "snapshot"
CMS_API_URL=http://localhost:8001/api/v1          # CMS API base
SITE_URL=https://www.usher.org.tw                 # canonical URLs, OG tags, sitemap, JSON-LD
SITE_BUILD_TOKEN=your-build-token-here            # sent as X-Site-Build-Token during build
SNAPSHOT_API_URL=https://member.usher.org.tw/api/v1 # optional; target for `npm run snapshot` / `refresh:content`
VERCEL_AUTOMATION_BYPASS_SECRET=...               # only for `npm run check:parity` on protected previews
```

The old `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` are still read as
fallbacks. Copy `.env.example` to `.env.local` to get started. Production values
are configured on Vercel. Never expose `SITE_BUILD_TOKEN` to client code.

## Content sources

### API mode (default)

`astro build` fetches every article and page from the CMS and writes static
HTML. Any failed fetch fails the whole build (all-or-nothing); nothing falls
back silently.

### Snapshot mode (fallback)

Use this only when the CMS cannot be reached at build time, for example in CI.

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
(singular) directory migrated from Hugo. Use `npm run snapshot -- --skip-attachments` to skip the download.

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

## Publishing and rebuilds

There is no runtime revalidation. When an editor creates, updates, publishes,
archives or deletes content, the CMS queues a call to a **Vercel Deploy Hook**,
which rebuilds and redeploys the whole site in about two minutes. A scheduled
rebuild also runs daily at 03:00. The build authenticates to the CMS with the
`X-Site-Build-Token` header (`SITE_BUILD_TOKEN`), and a failed build leaves the
previous deployment live.

## Images

Two sources, handled differently:

1. **Migrated assets** from the original Hugo site live in `public/images/` and
   `public/attachment/`. The API returns relative paths such as
   `/images/blog/2024-lecture.jpg`, served straight out of `public/`.
2. **CMS uploads** live on the Laravel backend. The API returns absolute URLs
   such as `https://member.usher.org.tw/storage/articles/images/...`. They are rendered as plain `<img>` elements, so no host allow-list is needed.

## Gotchas

- **Case-sensitive paths.** macOS is case-insensitive, Linux hosting is not. A
  reference to `logo_long.png` for a file named `Logo_long.png` works locally and
  breaks in production.
- **Never catch-and-fallback in `getStaticPaths` or page frontmatter.** A failed
  fetch must fail the build instead of publishing an empty page.
- **Use `toRoutePath()`**, not `Astro.url`, for links and the current route:
  with `build.format: "file"` the raw pathname contains `.html`.
- **Optional chaining on article relations.** `article.categories`,
  `article.tags` and `article.attachments` are absent on related-article
  payloads. Always use `?.length`.
- **Port 8001, not 8000**, for the CMS.

## Project layout

| Path | Contents |
|---|---|
| `src/pages/` | Routes (`.astro` pages, `sitemap.xml`, `robots.txt`) |
| `src/layouts/` | `BaseLayout.astro` |
| `src/styles/` | `global.css` (Tailwind theme) |
| `src/data/` | Static homepage data |
| `src/components/` | Shared UI components |
| `src/lib/api.ts` | API client and every data-fetching function |
| `src/lib/types.ts` | Interfaces for API payloads, `CONTENT_TYPE_PATHS` |
| `src/lib/metadata.ts`, `jsonld.ts`, `site.ts`, `sitemap.ts` | SEO helpers |
| `src/lib/markdown.ts`, `nav.ts` | Build-time markdown, navigation and `toRoutePath()` |
| `content-snapshots/` | Committed content for snapshot mode |
| `scripts/` | Snapshots, content/asset/a11y/coverage checks, parity checker, font subsetting, logo prep |
| `vercel.json` | Build settings, clean URLs, redirects |
| `hugo-archive/` | The original Hugo site, kept for reference |

`CLAUDE.md` in the repository root covers the same ground in a format aimed at
coding agents.
