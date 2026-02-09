# Accessibility & UX Improvement Plan

## 1. Executive Summary
This report outlines the findings from an accessibility audit of the Usher Syndrome Association website and proposes a detailed plan to enhance UX and compliance with WCAG 2.1 AA standards. The primary focus is on color contrast, semantic HTML, and keyboard navigation optimization for visually impaired users.

## 2. Audit Findings

### 2.1 Color Contrast Violations
*   **Issue:** The primary accent color (`#ec9b05`) is used as a background for buttons and CTA sections with **white text**.
*   **Data:** White (#FFFFFF) on Orange (#ec9b05) has a contrast ratio of **1.98:1**, which fails WCAG AA requirements (minimum 4.5:1 for normal text).
*   **Affected Areas:**
    *   Hero Slider "About Us" / "More Stories" buttons.
    *   CTA Section "Contact Us" button (White bg on Orange is fine, but the reverse usage in other places is problematic).
    *   Header "Active" link states if they use white on orange.
    *   Badge/Tag backgrounds.

### 2.2 Semantic HTML & Keyboard Navigation
*   **Hero Slider (`HeroSlider.tsx`):**
    *   Navigation arrows are `<div>` elements with `cursor-pointer`, making them inaccessible to keyboard users (cannot Tab to them).
    *   Missing `aria-label` attributes on navigation controls.
*   **Navigation (`Header.tsx`):**
    *   Dropdown menus rely heavily on `hover` states. While there is some keyboard support, interaction should be predictable (e.g., toggling on Click/Enter rather than just Hover).
*   **Link Affordance:**
    *   Some interactive elements rely solely on color change on hover.

### 2.3 Typography & Readability
*   **Font Size:** Body text is generally legible, but some `text-sm` combined with low contrast grays (`text-gray-400`) may be hard to read.
*   **Line Length:** Some text blocks in the "About" section might span too wide on large screens.

## 3. Implementation Plan

### 3.1 Color Palette Adjustments
We will not change the brand color, but we will change how it is paired.
*   **Rule:** When using `bg-accent` (#ec9b05), text MUST be **Dark** (e.g., `text-primary-dark` #0d0d1f or `text-black`), NOT White.
    *   **New Contrast Ratio:** Black on Orange #ec9b05 = **10.6:1** (AAA Pass).

**Code Snippet (Tailwind):**
```tsx
// BEFORE (Fail)
<Link className="bg-accent text-white ...">

// AFTER (Pass)
<Link className="bg-accent text-primary-dark font-bold ...">
```

### 3.2 Component Refactoring

#### A. Hero Slider (`src/components/HeroSlider.tsx`)
Replace `div` navigation with semantic `<button>` elements.

```tsx
<button
  type="button"
  className="custom-swiper-button-prev ..."
  aria-label="Previous slide"
>
  <svg ... />
</button>
```

#### B. Header (`src/components/Header.tsx`)
*   Ensure focus rings are highly visible (Orange outline on focus).
*   Verify Tab order.

#### C. Article Cards (`src/components/ArticleCard.tsx`)
*   Ensure "Pinned" badge uses dark text on orange background.
*   Ensure `text-gray-300` on dark backgrounds meets 4.5:1. (Light Gray #d1d5db on Dark Blue #1a1a37 is ~11:1. Safe.)

### 3.3 Global Styles (`src/app/globals.css`)
Enhance the focus indicator to be unmistakable.

```css
:focus-visible {
  outline: 4px solid var(--color-accent);
  outline-offset: 4px;
  border-radius: 2px;
}
```

### 3.4 Accessibility Features ("Skip to Main")
The site already includes a "Skip to content" link, which is excellent. We will ensure it is styled effectively.

## 4. Proposed Timeline
1.  **Phase 1:** Global CSS updates (Focus styles).
2.  **Phase 2:** Component fixes (HeroSlider, Header).
3.  **Phase 3:** Page-level contrast fixes (Home page CTA, Buttons).
4.  **Phase 4:** Final verification using Axe DevTools.
