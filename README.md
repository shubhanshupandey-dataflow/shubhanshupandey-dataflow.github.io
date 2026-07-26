# Ledger AI — Astro

A rebuild of the Ledger AI marketing site in Astro. Same design, same copy, same
URLs — but every page is prerendered to static HTML at build time instead of
being assembled in the browser by React.

## Why

The previous site was a Vite + React SPA. The HTML served to a crawler was an
empty `<div id="root">`; the title, description, canonical URL and JSON-LD were
all injected from a `useEffect` after hydration, and the blog posts were parsed
from JavaScript template literals at runtime. Anything that did not execute the
bundle saw nothing.

Now:

| | Before | After |
|---|---|---|
| Landing page HTML | empty shell | ~92 KB of real content |
| Meta / canonical / OG | injected after hydration | in the served HTML |
| JSON-LD | injected after hydration | in the served HTML |
| Blog body | parsed client-side from a `.ts` string | compiled at build time |
| JS shipped | React + framer-motion + lucide | ~12 KB of vanilla scripts |
| Sitemap / RSS / robots | none | generated |

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

## Layout

```
src/
  content/          all site copy, as markdown
    site/           brand, navigation, footer
    sections/       one file per page section
    features/       the five rotating product features (+ their demo data)
    steps/          "how it works" cards
    faqs/           FAQ entries — also the source for FAQPage JSON-LD
    blog/           articles
  content.config.ts collection schemas (zod) — the contract for the above
  components/       one .astro file per section of the old React tree
  layouts/          BaseLayout: head, meta, JSON-LD, analytics
  lib/
    content.ts      typed helpers for reading collections
    schema.ts       schema.org graph builders
  pages/            routes
  styles/global.css theme, entrance animations, article styles
scripts/
  gen-icons.mjs     regenerates components/icons-data.ts from lucide-react
  convert-blogs.mjs the one-off TS -> markdown migration (kept for reference)
```

### Editing copy

Everything a marketer would want to change lives in `src/content/`. Headlines,
button labels, FAQ answers, the bank list, the demo-panel sample data, error
messages — none of it is in a component. `content.config.ts` validates it, so a
typo in a field name fails the build rather than rendering blank.

### Icons

The React app imported `lucide-react`, which meant no icon appeared until the
bundle ran. `src/components/icons-data.ts` holds the exact same SVG path data,
extracted from `lucide-react` v1.7.0, and `Icon.astro` inlines it. To add an
icon, add its name to `scripts/gen-icons.mjs` and re-run it.

### Animations

framer-motion is replaced by CSS transitions plus one `IntersectionObserver` in
`BaseLayout.astro`. Elements carry `.anim` with a direction (`.anim-up`,
`.anim-left`, …) and an optional `--anim-delay`.

The hidden starting state is scoped to `html.js`, a class set by an inline
script in `<head>`. Without JavaScript — or for a crawler that skips scripts —
the content is simply visible. It is never hidden waiting for a script that may
not run.

### Show/hide

Toggling always uses the `hidden` **attribute**, never the `hidden` class:
Tailwind's preflight declares `[hidden] { display: none !important }`, so the
attribute reliably beats any `flex`/`grid` utility on the same element. The
class would lose to them.

## URLs

`build.format: 'file'` is deliberate — it emits `dist/blogs/<slug>.html`, which
GitHub Pages serves at `/blogs/<slug>` with no trailing-slash redirect, exactly
matching the old client-side router's paths.

## Deployment

`.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/` to
GitHub Pages with the `ledgerai.backoffice.digital` CNAME — unchanged from the
old repo apart from `npm ci` and the build output.

## Known issues carried over

- Blog copy links to `/services/bookkeeping`, a page that does not exist on this
  site. Present in the original content; not invented here.
- Footer "Privacy", "Terms" and "GDPR" links, and the cookie banner's policy
  links, all point at `#`.
- `src/components/Loader.astro` reproduces the old 2-second splash overlay but
  is **not** mounted. On a prerendered page it would hide content that has
  already painted, which works against the reason for this rewrite. Import it
  into `pages/index.astro` to restore it.
