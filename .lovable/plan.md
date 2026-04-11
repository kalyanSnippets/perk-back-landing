

## Plan: GoRewards-Inspired UI Overhaul

This plan transforms PerkBack's visual identity to match the vibrant, colorful, playful design language of GoRewards (gorewards.com.ph) -- the Philippine retail loyalty app by Robinsons Retail.

---

### GoRewards Design Language Analysis

From the GoRewards website and app screenshots, the key design traits are:
- **Bold primary red** (`#E53935`) with white and blue accents
- **Playful floating shapes**: colorful circles, dots, hearts, abstract blobs scattered across sections
- **Large rounded cards** with generous padding and soft shadows
- **Bright, saturated section backgrounds** (red hero sections, white content areas)
- **Friendly, warm typography** with bold headings
- **Colorful iconography** using filled circular icon containers in red, blue, gold, green
- **Carousel-based promos** with full-bleed gradient cards
- **Clean white nav** with a bold accent-color login button

### What Changes

We will NOT change the app's blue/gold brand palette (PerkBack's identity should remain). Instead, we adopt GoRewards' **design patterns and visual energy**:

---

### 1. Color & CSS Variable Updates

**File: `src/index.css`**
- Add vibrant decorative accent colors for shapes: coral-red, teal, amber, emerald
- Add new CSS utility classes for floating shapes (`.floating-circle`, `.floating-dot`)
- Add shimmer/glow keyframe animations for cards
- Increase `--radius` to `1rem` for rounder cards everywhere
- Add a `.gradient-blob` class for colorful background blobs

### 2. Hero Section Overhaul

**File: `src/components/HeroSection.tsx`**
- Add floating decorative shapes (colored circles, rings, dots) like GoRewards' hero
- Larger, bolder headline with playful line breaks
- More saturated gradient background (from soft blue to deeper blue/purple)
- Bigger CTA buttons with rounded-full shape (pill buttons)
- Add a floating phone mockup or card illustration alongside the text (reuse existing loyalty card image)

### 3. How It Works Section

**File: `src/components/HowItWorks.tsx`**
- Circular icon containers (filled, saturated colors: red, blue, gold) instead of gradient squares
- Numbered step badges with brighter colors
- Add subtle floating shapes in the background

### 4. Rewards Showcase

**File: `src/components/RewardsShowcase.tsx`**
- Larger cards with colored left borders or top accent strips
- Progress bars with gradient fills matching GoRewards' colorful style
- Stamp card visualization with filled/empty circles (like GoRewards' visual stamps)

### 5. Benefits Section

**File: `src/components/BenefitsSection.tsx`**
- Two-column layout with colored icon circles (not gradient squares)
- Add playful floating shapes in background

### 6. Header & Footer

**File: `src/components/Header.tsx`**
- Cleaner white background (remove blur/transparency for crispness)
- Bold accent-colored CTA button (pill shape)

**File: `src/components/Footer.tsx`**
- Warmer dark blue footer with brighter accent links

### 7. Customer Access Card (Dashboard)

**File: `src/pages/AccessCard.tsx`**
- Tab switcher redesigned as pill-shaped segmented control with bold active color
- My Stores cards: larger with colored left accent strip + merchant logo prominent
- Points balance: bigger number, animated counter feel, colorful star icon
- Rewards cards: vibrant gradient backgrounds per reward type, bigger CTAs
- Promo carousel: bolder gradients, larger text, floating decorative shapes

### 8. Merchant Dashboard

**File: `src/pages/MerchantDashboard.tsx`**
- KPI stat cards with colored icon circles (red, blue, gold, green) instead of muted icons
- Feature cards with colored left borders and brighter hover states
- Banner: add floating shapes, more vibrant gradient

### 9. Merchant Nav (Mobile Bottom Bar)

**File: `src/components/merchant/MerchantNav.tsx`**
- Colored active icon (not just text change), add a subtle pill background behind active item
- Slightly larger icons for better tap targets

### 10. Dashboard Feature Cards

**File: `src/components/merchant/DashboardFeatureCard.tsx`**
- Add colored left accent strip based on feature category
- Brighter icon containers with saturated fills

### 11. Button Variants

**File: `src/components/ui/button.tsx`**
- Update `hero` variant: more rounded (rounded-full), bolder shadow
- Add `pill` size variant for fully rounded buttons

### 12. Card Component

**File: `src/components/ui/card.tsx`**
- Increase default border-radius to `rounded-2xl`
- Add subtle hover scale transition

### 13. Tailwind Config

**File: `tailwind.config.ts`**
- Add decorative colors: `coral`, `teal`, `emerald-accent`, `warm-amber`
- Add `float-slow` and `float-fast` animation variants
- Increase default radius

---

### Files Changed Summary

| File | Change |
|------|--------|
| `src/index.css` | New decorative shape classes, animations, updated radius, floating blobs |
| `tailwind.config.ts` | Decorative colors, new animations |
| `src/components/HeroSection.tsx` | Floating shapes, bolder text, pill CTAs, vibrant gradient bg |
| `src/components/HowItWorks.tsx` | Circular colored icons, floating shapes |
| `src/components/RewardsShowcase.tsx` | Larger colorful cards, accent strips |
| `src/components/BenefitsSection.tsx` | Colored icon circles, floating shapes |
| `src/components/Header.tsx` | Cleaner white bg, pill-shaped CTA |
| `src/components/Footer.tsx` | Warmer dark footer |
| `src/pages/AccessCard.tsx` | Pill tab switcher, vibrant rewards cards, colorful points display |
| `src/pages/MerchantDashboard.tsx` | Colored KPI icons, vibrant banner, floating shapes |
| `src/components/merchant/MerchantNav.tsx` | Colored active state with pill bg |
| `src/components/merchant/DashboardFeatureCard.tsx` | Colored left accent strip |
| `src/components/ui/button.tsx` | Rounder hero variant, pill size |
| `src/components/ui/card.tsx` | Rounder, hover scale |

### What Stays the Same
- All business logic, data fetching, authentication
- PerkBack's blue/gold brand colors (primary identity preserved)
- Database schema, API calls, routing
- Component structure and file organization

