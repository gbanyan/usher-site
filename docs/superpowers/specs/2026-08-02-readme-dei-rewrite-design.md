# Design: English-first, mission-forward README

**Date:** 2026-08-02
**Status:** Approved (design), pending implementation plan

## Problem

`README.md` is the untouched `create-next-app` boilerplate. It says nothing about
what this repository is for. Every piece of real project knowledge lives in
`CLAUDE.md`, which is written for coding agents, not people.

The repository is about to be submitted with an application for additional
service quota under a diversity, equity and inclusion programme. The application
form asks the applicant to describe how the project contributes to the ecosystem.
A reviewer who opens the repository must, within one screen, understand that this
is the website of a Taiwanese nonprofit serving people with Usher syndrome, and
must be able to see how the work contributes back.

## Audience

Primary reader: a **technical reviewer** evaluating the application. They will
skim for mission first, then look for evidence of real engineering — especially
accessibility engineering. Secondary reader: a volunteer developer.

## Decisions

| Decision | Choice |
|---|---|
| Language | English only. Chinese appears inline for proper nouns and UI labels (e.g. 病友故事 / Patient Stories). No Chinese-language section. |
| Developer docs | Moved out of `README.md` into a new `docs/DEVELOPMENT.md`. |
| `CLAUDE.md` | Unchanged. It remains the agent-facing reference. |
| Screenshot | Captured from the live site with headless Chrome, committed to `docs/assets/homepage.png`. |
| Tone | Factual. Every claim traceable to code, content, or a cited source. |

## Deliverables

1. `README.md` — rewritten (replaces boilerplate entirely).
2. `docs/DEVELOPMENT.md` — new; receives the operational content.
3. `docs/assets/homepage.png` — new screenshot asset.

## README structure

Sections in order. The ecosystem section is placed second because it answers the
application's central question.

### 1. Header

- Title: `Taiwan Usher Syndrome and Audiovisual Impairment Association`
  with `台灣尤塞氏症暨視聽弱協會` on a second line.
- One sentence: the official website of a Taiwanese nonprofit serving people with
  Usher syndrome, a genetic condition that causes combined vision and hearing loss.
- Live link: `https://www.usher.org.tw`.
- Screenshot of the homepage.

### 2. About the association (~120 words)

Translated and condensed from the live `/about` page content, not invented:

- Founded July 2023 by patients, parents, clinicians, researchers, and supporters.
- Members live with retinitis pigmentosa together with hearing loss — combined
  sensory impairment, not one disability or the other.
- Charter purpose: securing medical, genetic, academic and social-support
  resources for patients and families in Taiwan.
- Charter tasks, condensed to four bullets from the eight in the constitution:
  public rights advocacy; health and wellbeing; family support and resource
  referral; public awareness, research tracking, and international liaison.

### 3. Contribution to the Usher syndrome ecosystem

The section that carries the application. Structured as *gap → what this adds*,
with each claim backed by something in the repository.

**The gap.** Usher syndrome is rare, and combined deafblindness makes the affected
population small and geographically scattered. Practical, trustworthy information
in Traditional Chinese is scarce. Before the association was founded in 2023,
Taiwanese patients and families had no dedicated national organisation.

**What this repository adds.** Concrete, verifiable:

1. **A permanent, citable Chinese-language reference point.** 27 published items
   across four content types — 事務公告 (notices), 部落格 (blog), 協會文件
   (association documents), 相關報導 (related news coverage).
2. **First-person patient and family accounts** (`/story`, 病友故事) — the material
   a newly diagnosed family searches for and, in Chinese, largely cannot find.
3. **Practical care and resource guidance** (`/guides`, 建議與指引).
4. **Tracked media and research coverage** (`/related-news`) — the association's
   charter task of following domestic and international research progress,
   discharged in public.
5. **Institutional transparency.** `/about` publishes the registering authority,
   unified business number, incorporation letter number and legal-person
   registration number, with the certificates themselves and a versioned document
   system recording version numbers, file hashes and upload dates.

   *Correction applied during implementation:* an earlier draft of this spec
   described the 13 items of type `document` as governance documents. They are
   not. They are the resource centre — a plain-language explainer on Usher
   syndrome, ophthalmologist and special-education-teacher perspectives, welfare
   resources, and patient experience accounts. Governance material is a separate
   public-document system surfaced on `/about` and `/contact`. The README
   reflects the corrected reading.
6. **A reusable accessibility reference.** The deafblind-first design decisions,
   the failing contrast audit, and the fixes are documented in the open
   (`ACCESSIBILITY_PLAN.md` and this README). Other small disability nonprofits
   can copy the patterns rather than rediscover them.
7. **An architecture other volunteer-run nonprofits can afford.** Static-first,
   no runtime server dependency, near-zero hosting cost, resilient on poor
   connections.

**Claim discipline.** No epidemiological prevalence figure is stated unless it
carries a citation to a named source. If no source is confirmed at write time,
the text says "rare" and describes the Taiwanese situation, which is supported by
the association's own founding account. Superlatives such as "the only" are not
used for anything unverified.

### 4. Accessibility is the requirement, not a feature

Opens by naming the constraint: the primary audience has degenerative vision loss
*and* hearing loss, so neither visual nor audio fallbacks can be assumed. Then
the shipped facts, each verifiable in the repository:

| Feature | Evidence |
|---|---|
| Skip-to-content link | `src/app/layout.tsx:51` |
| 4px high-contrast focus ring, 4px offset, on every focusable element | `src/app/globals.css:48` |
| ARIA landmarks and labels throughout | 23 page and component files |
| Contrast remediation | White on accent orange failed at 1.98:1; replaced with dark text on orange at 10.6:1 (`ACCESSIBILITY_PLAN.md`) |
| Semantic, keyboard-operable controls | Slider and navigation use real `<button>` elements |
| Low-vision typography | Fluid `clamp()` type scale, 1.625 body line-height (`src/app/globals.css`) |
| Findability without navigation | Client-side search with Traditional Chinese segmentation (Pagefind) |

Target standard stated as WCAG 2.1 AA.

### 5. Accessibility roadmap

Short list, presented as open work rather than achievement:
`prefers-reduced-motion` support; automated axe checks in CI; a screen-reader
pass with VoiceOver and NVDA. Links to `ACCESSIBILITY_PLAN.md`.

### 6. Architecture at a glance

- Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript.
- Content from a Laravel 10 headless CMS at build time; the deployed site is
  fully static, with on-demand revalidation by webhook when editors publish.
- Why it matters here: no server to keep alive, fast on weak connections, cheap
  enough for a nonprofit to run indefinitely.
- Route table covering the live routes. `/research` is documented as a permanent
  redirect to `/document`, not as a content section.

### 7. Content and privacy

Content is authored in Traditional Chinese by association staff through the CMS.
The site's own language is `zh-TW`. The public site sets no analytics, no
third-party trackers, and no advertising scripts — verified: the only third-party
references in the source are outbound links to the association's public Facebook
group. Attachments are association documents, not personal data.

### 8. Development

Four lines only — prerequisites (Node 24), `npm install`, the three scripts
(`dev`, `build`, `start`), and a link to `docs/DEVELOPMENT.md`.

### 9. Licence and contact

Contact via the association's public channels. Repository licence status stated
as it actually is; if no licence file exists, the README says the code is
published for reference and does not claim a licence it does not have.

## docs/DEVELOPMENT.md structure

Receives everything operational, sourced from `CLAUDE.md` and the existing README
workflow notes:

1. Prerequisites — Node 24, the Laravel backend on **port 8001** (not 8000).
2. Two workflows — static polish (`build` once, then `start`, no Laravel needed)
   and hot reload (`dev`, Laravel required).
3. Environment variables — `CONTENT_SOURCE`, `NEXT_PUBLIC_API_URL`,
   `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_TOKEN`.
4. Content sources — API mode (default) and snapshot fallback via `npm run snapshot`.
5. Revalidation webhook — `POST /api/revalidate`, token header, payload, cache tags.
6. Image architecture — migrated Hugo assets in `public/` versus CMS uploads
   served from the Laravel backend; remote patterns in `next.config.ts`.
7. Gotchas — case-sensitive paths on Linux hosts versus case-insensitive macOS;
   no `searchParams` on listing pages (forces dynamic rendering).

`CLAUDE.md` is not modified. Some duplication between it and `docs/DEVELOPMENT.md`
is accepted deliberately: one is agent-facing, one is human-facing.

## Screenshot

Captured with headless Chrome, already installed:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --screenshot=docs/assets/homepage.png \
  --window-size=1440,900 --hide-scrollbars https://www.usher.org.tw
```

If the capture fails or renders incorrectly, the fallback is to ask the user for
a screenshot rather than ship a broken or misleading image. The image is
referenced with descriptive alt text — the README of an accessibility project
must not itself have an unlabelled image.

## Out of scope

- No changes to site code, styling, or content.
- No changes to `CLAUDE.md`.
- No new accessibility features. The roadmap section describes them; it does not
  implement them.
- No translation of site content into English.
- No licence file is added; the README only describes the status accurately.

## Success criteria

1. A reviewer reading only the first screen can state what the project is, who it
   serves, and that accessibility is central.
2. Every factual claim in the README is traceable to code, committed content, or a
   cited source. No unsourced statistics, no unverified superlatives.
3. Nothing from the boilerplate README survives.
4. A volunteer developer can still get the site running by following
   `docs/DEVELOPMENT.md` alone.
5. The ecosystem section answers the application question directly, in terms a
   reviewer can check against the repository.
