

## Goals
1. Eliminate header CTA flicker on public routes (caused by deferred auth) with a subtle skeleton placeholder.
2. Address the video section in the hero — confirm whether it hurts performance, and if so, remove it and rebalance the hero so it stays visually strong.

## Investigation summary

**Header flicker root cause**
- `AuthContext` now defers `getSession()` on public routes until idle, so on first render `user` is `null` and `loading` is forced to `false`.
- `Header.tsx` immediately renders the "Sign Up / Sign In" pill. ~1–2s later, when auth hydrates, it swaps to Dashboard / My Card / Logout — visible flicker.
- Fix: while `loading` is true OR auth hasn't hydrated yet on a deferred route, render a neutral skeleton (same width/height as the CTA cluster) instead of either state. Once hydrated, swap to the real CTA.

**Hero video section impact**
- Current hero shows a static `video-thumbnail.webp` (1280x720) inside a clickable card. The actual `<video>` only mounts when the user clicks Play (lightbox). So the video itself is **not** loaded on first paint.
- However the thumbnail is a sizeable above-the-fold image competing with the loyalty card image for LCP. On a 440px viewport (current viewport), both stack and the thumbnail adds weight + decode cost.
- Verdict: the *video* is fine (deferred), but the *thumbnail card* is non-essential weight on mobile and creates a cluttered hero. Removing it simplifies the hero, reduces image bytes, and improves LCP focus on the loyalty card (the brand hero asset).

## Plan

### 1. Header CTA skeleton (no flicker)
- In `Header.tsx`, import `Skeleton` from `@/components/ui/skeleton`.
- Track an `authReady` signal: render skeleton when `loading === true` OR (`user === null` AND auth hasn't yet completed its first detection on a deferred route).
- Simplest robust approach: expose an `authReady` boolean from `AuthContext` that flips true only after the first `detectRole` call resolves (whether user exists or not). Until then, Header renders a neutral pill-shaped skeleton sized to match the signed-out CTA (~140x40 desktop, full-width on mobile).
- Skeleton uses the existing `bg-muted` animate-pulse — matches brand, no layout shift.

### 2. Remove hero video thumbnail card + rebalance hero
- In `HeroSection.tsx`:
  - Remove the entire video thumbnail block AND the `videoOpen` lightbox state/modal (no longer needed).
  - Drop the `Play`, `X` lucide imports and `useState` for video.
  - Convert the two-column grid into a single centered showcase featuring the loyalty card mockup as the visual anchor (larger, more prominent).
  - Keep floating `+50 Points` and `5/10 Stamps` badges — they reinforce the value prop and are cheap.
  - Add one extra trust/visual element to keep the hero feeling rich without being heavy: a small inline row of merchant industry icons (Coffee / Retail / Restaurant emoji or lucide icons) under the CTAs with copy like "Trusted by cafes, retailers & restaurants across Australia". Pure CSS/text — zero image cost.
- Net effect: lighter hero, faster LCP, brand-forward (loyalty card stays the star), still attractive.

### 3. Files touched
- `src/contexts/AuthContext.tsx` — add `authReady` flag to context.
- `src/components/Header.tsx` — render skeleton until `authReady`.
- `src/components/HeroSection.tsx` — remove video thumbnail, lightbox, related state/imports; recenter loyalty card; add lightweight trust row.

### Out of scope
- No changes to colors, fonts, copy of headline/subhead, or CTA labels.
- The intro video file itself (`/videos/perkback-intro.mp4`) and thumbnail asset can be left in `public/` — not loaded anymore, removable later if desired.

### Why this is safe
- Skeleton is visual-only, identical footprint to current CTA → zero CLS.
- Hero video was a click-to-play lightbox; removing it loses no critical content (the homepage doesn't depend on video for conversion — CTAs remain).
- All existing routing, auth, and brand identity preserved.

