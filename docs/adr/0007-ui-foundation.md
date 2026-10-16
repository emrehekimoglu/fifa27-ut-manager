# ADR-0007: UI foundation

- **Status:** Proposed
- **Date:** 2026-10-09

## Context

The web app has three demo pages: the source page (M1), the catalog (M2) and the playground (M3). Each page styled itself from one hand-written stylesheet with one media query. There was no navigation between pages other than a back link to the landing page. On a phone the pages worked but did not feel like an app: small tap targets, no persistent navigation, and long single-column lists.

The PRD already requires:

- NFR-1: fully usable on a 360 px phone and on desktop;
- NFR-9: WCAG 2.1 AA colour contrast, every action reachable without drag-and-drop;
- SQD-8: a visual style that resembles FUT cards.

The full UI was planned for M4 (squad builder) and the polish for M8. The owner decided on 2026-10-09 to lay a UI foundation now, before M4, so that every later page is built on it instead of being restyled at the end.

## Decision

**1. Plain CSS with design tokens, organised in cascade layers.** No CSS framework and no CSS-in-JS.

- `src/styles/tokens.css` defines every colour, space, radius, shadow, font size and breakpoint-related size as a custom property on `:root`.
- The other files use only tokens, never raw values for colour, space or radius.
- The files declare their layer (`@layer reset, base, layout, components, features`), so feature rules always win over component rules without specificity fights.

| File             | Layer      | Contents                                                        |
| ---------------- | ---------- | --------------------------------------------------------------- |
| `tokens.css`     | (none)     | Custom properties only                                          |
| `base.css`       | reset/base | Box sizing, body, typography, links, focus ring                 |
| `layout.css`     | layout     | App shell: header, bottom tab bar, page container, footer       |
| `components.css` | components | Button, field, panel, badge, stat tile, list row, rating chip…  |
| `features.css`   | features   | Page-specific rules (catalog, card detail, playground, sources) |

**2. A dark, FUT-inspired visual language.**

- Dark navy surfaces in three elevation steps, a gold accent for ratings and primary actions, green and red for status.
- Every text and background pair used meets WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text and UI borders that carry meaning).
- System font stack, so the app needs no web-font download and works offline later (NFR-3). Numbers use tabular figures.

**3. An app shell with persistent navigation.**

- Four sections: Ana sayfa, Katalog, Kadro (the playground, later the squad builder) and Kaynaklar.
- On screens narrower than 768 px the navigation is a bottom tab bar with icons and labels, within thumb reach. From 768 px it moves into the top header.
- The current section is marked with `aria-current="page"`; card detail pages count as the catalog.
- A "İçeriğe geç" skip link is the first focusable element.
- Pages no longer render their own "← Ana sayfa" link.

**4. Mobile-first sizing.**

- Interactive controls (buttons, inputs, selects, navigation links) are at least 44 px tall, the minimum touch target in Apple's and Google's guidelines.
- Inputs use a 16 px font, so iOS does not zoom on focus.
- Content respects the device safe areas (`env(safe-area-inset-*)`).

**5. Verification by end-to-end tests at both viewports.** The shell, the touch-target sizes and the absence of horizontal scrolling are asserted by Playwright at desktop and at 360 px. Visual details (colours, shadows) are checked by the owner on the preview deployment.

## Alternatives considered

- **Tailwind CSS.** Fast to write and well known, but it adds a build plugin and a second styling vocabulary next to the existing CSS. The app has two users and a handful of screens; tokens plus a small component layer give the same consistency without the dependency.
- **A component library (MUI, Chakra, Mantine).** Brings ready widgets, but a heavy runtime, a generic look that works against SQD-8, and theming effort to reach the FUT style.
- **CSS Modules per component.** Good isolation, but the pages are small and share most rules; cascade layers keep global CSS predictable enough. This can be revisited when the squad builder grows.
- **Hamburger menu on mobile.** Hides the navigation behind an extra tap. With four sections a tab bar fits a 360 px screen.

## Consequences

- New pages and the M4 squad builder use the tokens and the component classes; page-specific CSS goes into the `features` layer.
- A visual change (colour, spacing) is a token change in one file.
- The next UI-foundation step is a FUT-style card component and a pitch view for the playground (SQD-8), which M4 reuses.
- Visual regressions are not caught automatically. Screenshot tests were not added, because CONTRIBUTING.md rules out snapshot-only tests and the owner checks the preview deployment.
