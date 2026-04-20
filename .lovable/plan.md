

## Why mobile feels stuck for 5–10s

After auditing the codebase and assets, the slowness is mostly caused by **broken/oversized image assets blocking every page**, plus a few heavy patterns in dashboard pages. Code-splitting work done previously was correct, but it's being undermined by these issues.

### Root causes found

1. **Critical: broken header logo files (0 bytes)**
   `src/assets/perkback-logo-224.webp` and `perkback-logo-448.webp` are **empty (0 bytes)**. The Header preloads these with `fetchPriority="high"` on every single page. The browser repeatedly tries to fetch a corrupt image as the highest-priority resource — this stalls FCP on every navigation.

2. **Critical: broken hero image**
   `src/assets/loyalty-card-v2.webp` is **17 bytes (corrupt)**. Hero falls back/retries.

3. **Huge favicon and source assets**
   `public/favicon.png` is **349 KB**. `loyalty-card-v2.png` is **397 KB**, `perkback-logo-1024.png` is **634 KB** — all bundled even if unused. Mobile data + decode is expensive.

4. **`ScrollReveal` everywhere with a ref-forwarding bug**
   The console shows "Function components cannot be given refs" — Lazy chunks load but emit React warnings, and every section spawns a new IntersectionObserver. On lower-end phones this adds main-thread work and TBT.

5. **Dashboard pages do unbounded queries on mount**
   - `MerchantDashboard` runs `select("customer_id, points_awarded, purchase_amount, transaction_date")` for **all transactions ever** to compute KPIs in JS.
   - `AccessCard` subscribes to 4 realtime channels and re-runs full `fetchData()` on every transaction insert.
   - Both block the page until network completes — appears as 5–10s on slow mobile.

6. **`next-themes` loaded eagerly via Sonner toaster**
   Pulled into the initial bundle for a theme system that isn't actually used. `<Toaster>` is also mounted before the router so it's in the critical path.

7. **`BackToTopButton` / `PWAInstallPrompt` use `forwardRef` incorrectly**
   The console errors mean React is doing extra work and the Suspense fallback is firing more often than needed.

8. **Realtime channel on `AccessCard` triggers full re-fetch on every event**
   Causes input lag and stutter when navigating in/out.

## Plan

### Phase 1 — Asset fixes (biggest single win, ~3–5s improvement on mobile)

- **Regenerate the two broken logo files** (`perkback-logo-224.webp`, `perkback-logo-448.webp`) from the existing `perkback-logo.webp` (26 KB) source.
- **Regenerate** `loyalty-card-v2.webp` from `loyalty-card-v2.png`.
- **Shrink `public/favicon.png`** from 349 KB → ~5 KB by replacing it with a 48×48 PNG (keep `favicon.ico` as legacy).
- **Delete unused heavy source assets** that aren't imported anywhere: `loyalty-card-v2.png`, `loyalty-card.png`, `perkback-logo-1024.png`, `perkback-wordmark.png`, `perkback-hero.jpg`, `wallet-hero-banner.jpg` (verify imports first; remove only those not referenced).
- Drop the unused `/videos/perkback-intro.mp4` (no longer rendered).

### Phase 2 — Eliminate forwardRef warnings (removes Suspense-fallback flicker)

- Wrap `BackToTopButton`, `PWAInstallPrompt`, and `ScrollReveal` in `React.forwardRef` (or change the parent to not pass refs). Removes the dev warnings and stops React from re-mounting these subtrees.

### Phase 3 — Strip unused libs from initial bundle

- Replace `next-themes`-based `Sonner` wrapper with a static `<Toaster />` that doesn't import `useTheme`. Drops `next-themes` from the entry chunk.
- Move `<Toaster>` and `<Sonner>` *inside* `<BrowserRouter>` so they're not in the critical path.
- Remove duplicate logo source paths in `srcSet` once both files are valid (already correct, will work after Phase 1).

### Phase 4 — Faster public-page navigation

- Add **route prefetch on hover/touch** for the public nav links in `Header.tsx`. This warms the lazy chunk before the user clicks, so mobile taps feel instant.
- Add a tiny shared **page skeleton** as the `Suspense` fallback in `App.tsx` (instead of full-screen "Loading...") so each page-to-page transition shows the new layout immediately.

### Phase 5 — Faster dashboard pages

- `MerchantDashboard`: replace the full-table KPI fetch with **two scoped queries** (`count` + an aggregated date-filtered fetch). Capped result set; uses `head: true, count: 'exact'` for total customers and a today-range filter for revenue.
- `AccessCard`:
  - Throttle realtime handler so multiple inserts in <1 s collapse into a single refetch.
  - Lazy-split the heavy `ExploreTab` and `Carousel`/`Dialog` blocks already imported eagerly.
  - Stop re-fetching everything on a single point update (we already have the new value in the realtime payload).

### Phase 6 — Cheap rendering polish

- Replace per-element `IntersectionObserver` in `ScrollReveal` with a **single shared observer** (module-level). Drops dozens of observer instances per page on Pricing/Blog/Testimonials.
- Remove `backdrop-blur-sm` from the merchant dashboard banner (per known-issue note: backdrop-blur on animated content is expensive on mobile).

### Phase 7 — Caching / network

- Verify `public/_headers` covers the published site (Lovable hosting ignores `_headers` per docs — confirmed). Move long-lived caching expectation to Vercel/CDN if migration happens; otherwise rely on Vite's content-hashed asset URLs.
- Keep `loading="lazy"` on all below-the-fold images (already mostly done).

### Out of scope (not changing)

- No design/copy/brand changes.
- No routing structure changes.
- No new dependencies.

### Expected impact (mobile)

| Phase | Estimated time saved |
|---|---|
| 1. Asset fixes | 2–4 s on every navigation |
| 2. forwardRef | 200–500 ms TBT |
| 3. Bundle trim | 150–300 ms FCP |
| 4. Prefetch + skeleton | feels instant on tap |
| 5. Dashboard fetch fix | 1–3 s on dashboards |
| 6. Single observer | 100–200 ms TBT |

Combined: page-to-page should drop from 5–10s to **under 1s on mobile** for public pages, and **1–2s** for dashboards (network-bound).

