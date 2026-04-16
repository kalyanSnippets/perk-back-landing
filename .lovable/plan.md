

## Fix Text Visibility on Reward Cards + Full-Width Hot Rewards

### Problem
1. **Available Rewards (AccessCard.tsx)**: Text overlaid on images is hard to read — white text on potentially light images.
2. **Hot Rewards (ExploreTab.tsx)**: Still uses horizontal scroll with small cards — needs the same full-width stacked treatment.

### Changes

#### 1. Available Rewards — Text Below Image (AccessCard.tsx, lines ~641-713)

- **Split layout**: Image takes the top half (~180px), content sits below on a solid card background — no text-on-image readability issues.
- When `image_url` exists: image displayed as a `h-[180px] object-cover` header, with a subtle gradient fade at the bottom edge.
- Content section below uses standard `text-foreground` colors on solid `bg-card` background.
- Badges ("Ready!", reward type) positioned as overlays on the image portion only.
- Progress bar, points, store name, and CTA button all on the solid background section below.
- When no image: keep the gradient header with decorative elements, content still below.

#### 2. Hot Rewards — Full-Width Stacked Cards (ExploreTab.tsx, lines ~222-267)

- **Remove horizontal scroll**: Replace `flex gap-3 overflow-x-auto snap-x` with `space-y-3` vertical stack.
- **Remove small card sizing**: Drop `min-w-[200px] snap-start flex-shrink-0`. Cards become `w-full`.
- **Same split layout as Available Rewards**: Image on top (`h-[160px] object-cover`), content below on solid background.
- Merchant logo overlaid on image corner.
- Title, points, store name, and "Earn & redeem" CTA on the solid section below — fully readable.
- Keep the colorful border accents from `HOT_REWARD_COLORS` for visual variety.

### Technical Details
- No database changes needed.
- Two files modified: `src/pages/AccessCard.tsx` and `src/components/customer/ExploreTab.tsx`.
- Text always on solid backgrounds — eliminates all readability concerns.

