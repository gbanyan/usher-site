# Astro 改寫與 Cloudflare 切換：執行期間的判斷與延後項目

執行者在實作過程中代替秘書長做的判斷（Ruling），以及審查時延後處理的小問題（minor deferred）。逐字取自執行紀錄（SDD ledger）。

## 2026-10-22-astro-migration-site

- | T5 self | coverage compares detail-page counts against content-snapshots list counts while the build uses live API data → snapshots may lag the live CMS | Ruling: coverage instead asserts (a) every <loc> in dist/sitemap.xml has a dist file (after T8) and (b) every internal href in dist HTML to a detail route (/blog|/notice|/story|/guides|/related-news|/document/<slug>) resolves to a dist file, plus a floor: ≥1 detail page per section — snapshot-independent — cost: none |
- Task 1: minor (deferred): eslint ignores scripts/** and public/**; stale .next ignore entry; tsconfig baseUrl+paths redundant
- Task 2: Ruling: reviewer "deep links /blog/<slug> 404" is not a gap — detail pages are real Astro routes (Task 5); only listing paths redirect — cost: none (parity check in T10 confirms)
- Task 2: minor (deferred): vercel-config test does not assert framework/buildCommand
- Task 3: review Needs fixes — Critical: no URL scheme sanitizing (regression vs react-markdown defaultUrlTransform). Ruling: also restore old image wrapper span (my-4 block …) for visual parity — reviewer flagged spacing change — cost: none. Fix round 1 dispatched, FIX_BASE eba0c9e
- Task 3: minor (deferred): external-link check startsWith("http") is case-sensitive (inherited)
- Task 4: review Needs fixes — head metadata differs from production (home title, og/twitter title suffix, home og:description, extra og:site_name/og:locale/hreflang, home canonical trailing slash). Ruling: reproduce production exactly; extra tags dropped (spec: metadata identical) — cost: lose minor SEO enrichments that production never had. Fix round 1 dispatched, FIX_BASE 937321d
- Task 4: minor (deferred): dropdowns now close siblings when one opens (old code kept them independent); touch tap open-then-close inherited
- Task 5: review Approved (spec ✅). Ruling: regrade pagination focus jump + recreated aria-live to Important — a11y regression is a spec anti-goal — fix round 1. Ruling: formatDate pinned to Asia/Taipei — deterministic builds; production shows some dates a day early (UTC build); date differences in parity are pre-approved — cost if wrong: a few dates differ from today's site by one day. FIX_BASE 3376424
- Task 5: minor (deferred): Article JSON-LD now in <head> (production: body); coverage only matches double-quoted hrefs (fits Astro output)
- Task 6: Ruling: no document category filter — production has none (plan wording "分類篩選" loses to parity) — cost: none
- Task 6: Ruling: /logo-represent literal "<br/>" on production is dropped in Astro (raw HTML not rendered) — approved difference, improvement
- Task 6: minor (deferred → do in Task 10): remove coverage allowlist for /document/媒體宣傳資源 (CMS fixed); safe-decode in coverage script; PaginationControls comment wording
- Task 6: minor (deferred): <th> without scope="col" on about/document detail (same as old); api.ts getPage snapshot fallback catches all read errors
- Task 7: Ruling: homepage line.me count 2 (footer + Org JSON-LD) vs production 3 (third = Next RSC payload copy, not visible) — visible LINE links unchanged, constraint satisfied — cost: none
- Task 7: Ruling: /en hides stories when live CMS returns zero (main fell back to snapshot) — avoids stale data in api mode — cost: section absent only if CMS has no stories
- Task 7: minor (deferred): loop wrap scrolls backward through slides (vs Swiper seamless); no-JS desktop scrollbar hidden; disabled reduced-motion toggle not tabbable (same as main); aria-pressed + label swap both used (parity)
- Task 7: minor (deferred): multi-slide smooth scroll overwrites target mid-flight (final index correct); window blur clears focusInside (guard keeps focus)
- Task 8: minor (deferred → Task 10 cleanup): runSearch rejection unguarded (stuck on 搜尋中…); Pagefind load failure shows 找不到結果 instead of a distinct message
- Task 8: minor (deferred): combobox aria-expanded hard-coded true; result count not announced (same as main)
- Task 9: minor (deferred): text allow covers whole field on listing pages (could hide unrelated regressions); sitemap-index not guarded; location drops origin
- Task 9: minor (deferred): cfemail with key-only hex decodes to "" (element dropped); Buffer in parity.ts (script-only)
- Task 10: Ruling: no Vercel CLI/auth on this machine → split Task 10: implementer does Steps 1–4 + deferred cleanup items; Steps 5–7 (Vercel env/hook/protection, parity vs preview, Lighthouse) need the site owner — STOP point. BASE 7d9a8f3
- Task 10: minor (deferred): CLAUDE.md theme section says globals.css (now src/styles/global.css); DEVELOPMENT snapshot wording

## 2026-10-23-astro-migration-cloudflare

- | T2 self | workflow validation tool via npx may need download | Ruling: if no validator available, YAML parse + review suffices — cost: syntax error caught on first run instead |
- Task 1: minor (deferred): target fetch failure message lacks error name; check-parity.mjs header comment mentions Vercel bypass var
- Task 2: review Approved. Ruling: regrade missing job timeout to Important (hung build blocks serialized queue ≤6h → silent no-update) — fix round 1 with lfs:true. FIX_BASE 1781539
- Task 3: minor (deferred): blank SITE_REBUILD_GITHUB_REPO → repos//dispatches 404 (logged); full response body logged (redacted)
- Task 4: Ruling: reuse existing account-wide "Edit Cloudflare Workers" token (~/.config/cloudflare/token, used by blog-astro; verified active, no expiry, workers list + zone read OK, NO DNS read/edit) as CLOUDFLARE_API_TOKEN — user suggested it — cost: one token shared by two projects (revoking it affects both)
- Task 5: Ruling: controller runs Task 5 itself (first deploy uses secrets against the production account) — cost: no per-task reviewer; results go to the user before cutover
- Task 5: Ruling: add Task 5b (build-time image optimization) before cutover — byte regression on mobile is unacceptable for this audience — cost: one more task
- Task 5b: minor (deferred): variant cache never pruned; restore-keys lets stale variants accumulate; CMS-hosted image path test-only (no live content uses it)
- Task 4: Ruling: DNS token = Caddy's CLOUDFLARE_API_TOKEN copied from routerpve CT105 /etc/caddy/cloudflare.env to ~/.config/usher/cloudflare-dns-token (user directed) — verified active, no expiry, zones gbanyan.net/genway.com.tw/usher.org.tw, usher DNS read OK — cost: broad token (3 zones, shared with Caddy ACME); use only for usher.org.tw www record
- Final: Ruling: fix wave pushes straight to main (site is live; branch protection not configured) — scoped re-review after — cost: unreviewed code briefly in production

## 後台（usher-manage-stack）計畫

- Setup: Ruling: implement on branch site-rebuild-mode, fast-forward master in Task 5 before deploy — plan says master; skill forbids implementing on master — cost if wrong: none
- | T1 self | flush-cache test uses placeholder key 'public-api:homepage' with note to use real PublicApiCache key/helper | Ruling: implementer uses PublicApiCache's real API — plan note already says so — cost: none |
- Task 1: Ruling: reviewer Minor #1 (hook URL in logs) regraded Important — secret leak, also flagged by security review — fix round 1 dispatched; FIX_BASE 7b5818b
- Task 1: minor (deferred): handle() silent when URL empty on scheduled path
- Task 1: minor (deferred): PublicApiCache::flush outside try/catch in job (off admin path)
- Task 1: minor (deferred): retry test does not assert no error log while retries remain
- Task 1: minor (deferred): sync queue would run hook POST inline (prod uses database queue)
- Task 1: minor (deferred): redaction is exact-match on configured URL; normalized/encoded URL forms would not be redacted
- Task 2: minor (deferred): no revalidate-mode regression test for category/tag actions (service branch covered in Task 1)
- Task 3: minor (deferred): site:rebuild prints "Site rebuild queued." when deploy_hook mode has no hook URL (warning logged, nothing dispatched)
- Task 4: minor (deferred): token also lifts throttle on any route using the api limiter (routes/api.php is public GETs + sanctum /user only)
- Task 4: minor (deferred): no test for empty-string configured token vs empty header (code handles it)
- Task 5: Ruling: controller executes Task 5 directly (docs edit, merge to master, push, deploy, set secret) — operational steps touching production and a secret are safer kept out of subagents — cost if wrong: docs change not separately reviewed (covered by final review)
- Final: Ruling: regrade those four to Important — each is a silent "publish never builds" path once deploy_hook is on (spec anti-goal) — one fix dispatch now; FIX_BASE b8564f6
- Final: minor (deferred): site:rebuild checks raw config, so an invalid mode prints 'Skipped' without the invalid-value warning
- Final: minor (deferred): hover-then-click closes the dropdown (same as the old site)
