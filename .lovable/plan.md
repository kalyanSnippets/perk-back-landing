

## Plan: Single-Card Carousel for Rewards + Bolder Browse Merchants + Sample Images

### 1. Available Rewards & Hot Rewards — One-Card-at-a-Time Carousel

Use the existing `Carousel` component (`src/components/ui/carousel.tsx`, embla-based) with `opts={{ align: "start", loop: false }}` and `basis-full` items so exactly one full-width card shows at a time, swipeable horizontally.

**`src/pages/AccessCard.tsx` (Available Rewards section ~641-714)**
- Wrap rewards in `<Carousel>` → `<CarouselContent>` → `<CarouselItem className="basis-full">`.
- Keep the existing split layout (image header `h-[180px]` + solid content area below).
- Add dot indicators below the carousel showing current slide position.
- Add `<CarouselPrevious>` / `<CarouselNext>` arrows (small, inline, not absolute outside) for desktop; swipe handles mobile.

**`src/components/customer/ExploreTab.tsx` (Hot Rewards section ~222-267)**
- Same treatment: `<Carousel>` with `basis-full` items, one card visible at a time.
- Keep split layout with image header `h-[160px]` + colored content section using `HOT_REWARD_COLORS`.
- Add dot indicators.

### 2. Browse Merchants — Larger Images, Bolder Colors

**`src/components/customer/ExploreTab.tsx` (Browse Merchants section)**
- Switch from compact list to a 2-column grid (`grid-cols-2 gap-3`) on mobile.
- Larger logo area: `h-32` colored header block (industry-tinted gradient) with merchant logo centered at `h-16 w-16` rounded-2xl.
- Bolder industry badges with saturated bg colors per industry (amber/blue/emerald/pink/purple).
- Card: gradient accent strip on top (4px), bold merchant name `text-base font-bold`, distance + industry badge below.
- Hover: lift + colored shadow glow matching industry.

### 3. Seed Sample Images in Database

Run SQL `UPDATE` statements via migration to add `image_url` to existing rewards and campaigns that have `NULL` image_url, using royalty-free Unsplash URLs matched to industry/reward type:
- Coffee rewards → coffee imagery
- Restaurant rewards → food imagery  
- Retail rewards → shopping imagery
- Generic fallback → gift/celebration imagery

Tables to update: `rewards.image_url`, `campaigns.image_url` (only rows where currently NULL, scoped per industry via merchant join).

### Technical Notes
- Files modified: `src/pages/AccessCard.tsx`, `src/components/customer/ExploreTab.tsx`
- One DB migration to seed sample image URLs (non-destructive — only fills NULLs)
- Reuses existing `Carousel` shadcn component — no new deps
- Dot indicators built with `api.selectedScrollSnap()` listener pattern

