

## Fix Available Rewards: Full-Width Stacked Cards with Image Backgrounds

### Problem
The Available Rewards section currently uses a horizontal scrolling layout with small cards (`min-w-[220px]`). The user wants each reward card to be full viewport width, not scrollable, with the image covering the entire card and content overlaid on top.

### Changes

**File: `src/pages/AccessCard.tsx` (lines ~641-714)**

1. **Remove horizontal scroll container** — Replace `flex gap-3 overflow-x-auto snap-x` with a vertical `space-y-3` stack so cards fill the full width.

2. **Make each card full-width** — Remove `min-w-[220px] snap-start flex-shrink-0`. Cards become `w-full`.

3. **Image covers entire card** — When `image_url` exists, use it as a full background with `absolute inset-0 w-full h-full object-cover` and overlay all content (title, points, progress bar, CTA) on top with a dark gradient overlay (`bg-gradient-to-t from-black/80 via-black/40 to-transparent`).

4. **Content overlaid inside the image** — Move the content section (title, store name, description, progress, button) inside the image container with `relative z-10` positioning, white/light text colors, and padding. Card height set to `min-h-[200px]` with `flex flex-col justify-end`.

5. **No-image fallback** — When no `image_url`, keep the existing gradient header but also make it full-card background with content overlaid similarly.

6. **Reward type badge and "Ready!" indicator** — Positioned as absolute elements at top-right of the card.

### Technical Details
- No database changes
- Only modifying the reward card layout in `AccessCard.tsx`
- Progress bar and CTA button will use light/white styling to contrast against the image background

