# Contributing

Thank you for looking. This is the website of a small Taiwanese nonprofit run by
volunteers, and help is genuinely welcome.

Contributions in English or Traditional Chinese are both fine. 中英文皆可。

## The most useful thing you can do

**Tell us where the site fails you.** The people this site serves are losing
vision and hearing at the same time, and we cannot test every combination of
screen reader, magnifier, braille display and browser ourselves. If something is
unreachable by keyboard, unreadable at 400% zoom, unannounced by your screen
reader, or simply confusing, that is a bug worth reporting — however small it
seems, and even if you cannot describe it in technical terms.

Open an issue and tell us what you were trying to do, what happened, and what you
were using (browser, screen reader, operating system, magnification). A rough
description is far better than no report.

## Reporting a bug or suggesting a change

Open an issue on GitHub. Please include:

- What you expected, and what happened instead
- The page URL
- Your browser and assistive technology, if relevant
- A screenshot or recording, if you can and if it helps

## Contributing code

1. Read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for setup. You will need
   Node.js 24; for content you will need the Laravel CMS, but for most UI work
   the pre-built static output is enough.
2. Branch from `main`.
3. Run `npm run lint` before opening a pull request.
4. Describe what changed and why. Screenshots help for anything visual.

### Accessibility requirements for any UI change

These are not preferences. A change that breaks one of them will not be merged:

- **Keyboard.** Every interactive element must be reachable and operable by
  keyboard alone, with a visible focus indicator. Use real `<button>` and `<a>`
  elements rather than click handlers on `<div>`s.
- **Contrast.** Text must meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large
  text). The accent orange takes dark text, never white — see
  [`ACCESSIBILITY_PLAN.md`](ACCESSIBILITY_PLAN.md) for why.
- **Names.** Icon-only controls need an `aria-label`. Images need meaningful
  `alt` text, or `alt=""` if genuinely decorative.
- **No colour-only meaning.** Anything communicated by colour must also be
  communicated by text, shape or position.
- **Structure.** Use headings in order, landmarks, and semantic HTML. Screen
  reader users navigate by these.

If you are unsure whether something passes, say so in the pull request and we
will work it out together. Asking is always better than guessing.

## Content

Article and page content is **not** in this repository. It is written by
association staff in a separate Laravel CMS and pulled in at build time. The
files under `content-snapshots/` are generated copies used as a build fallback —
edit them only to fix a formatting error, never to change what the association
has published.

For corrections to the wording of published content, please contact the
association directly rather than opening a pull request.

## Contact

Through the channels listed at
[www.usher.org.tw/contact](https://www.usher.org.tw/contact), or by opening an
issue here.
