

## Plan: 6 Feature Requests Implementation

### Request 1: AI-Powered Reward Creation (Merchant Side)

**What changes:**
- In `src/pages/MerchantRewards.tsx`, add an "AI Suggest" button next to the title/description fields in the reward creation form
- When clicked, calls the existing `ai-merchant-assistant` edge function with context about the merchant's industry type and existing rewards
- Returns suggested title, description, and generates an AI image using the Lovable AI image generation model (`google/gemini-2.5-flash-image`)
- Add an image_url column to the `rewards` table via migration
- Display generated image preview in the form with option to regenerate

**Files:** `src/pages/MerchantRewards.tsx`, `supabase/functions/ai-merchant-assistant/index.ts` (update to handle reward suggestions), migration for `rewards.image_url`

---

### Request 2: Customer Access Card Redesign

**Layout restructuring in `src/pages/AccessCard.tsx`:**

1. **Points balance** — move to the top, right after greeting (before the loyalty card)
2. **Promo banner carousel** — move up, right after loyalty card
3. **Digital Wallet buttons** — collapse into a single row of icon buttons adjacent to the card (inside the card actions row: Copy | Share | Apple | Google | Samsung), remove the separate "Add to Digital Wallet" card section
4. **Rewards section** — keep, but make each reward card clickable. On click, if redeemable show the redemption modal inline; if not yet redeemable show a detail popup with progress
5. **Remove "Active Campaigns" section** — campaigns already appear in the banner carousel, no need for a separate list
6. **Monthly Offers** — only render the section if `monthlyOffers.length > 0` (remove the empty state)
7. **Points Earned** — move to a collapsible sidebar/panel on larger screens, or keep below on mobile
8. **Ways to Claim Points** — convert to a popup/modal triggered by an info button instead of a full section

**Files:** `src/pages/AccessCard.tsx`

---

### Request 3: Navigation Alignment Fix

**Problem:** Nav links overlap on medium screens between mobile and desktop breakpoints.

**Fix in `src/components/Header.tsx`:**
- Change desktop nav from `hidden md:flex` with `gap-4 lg:gap-8` to use `gap-2 lg:gap-6` and add `text-xs lg:text-sm` for responsive font sizing
- Add `flex-shrink-0` and `whitespace-nowrap` to prevent wrapping
- Consider bumping the breakpoint to `lg:flex` if items still overflow, or use a horizontal scroll container

**Files:** `src/components/Header.tsx`

---

### Request 4: Get Started Page — Login-First + Password Toggle

**Changes to `src/pages/GetStarted.tsx`:**
- Default `authMode` to `"login"` instead of `"signup"`
- Remove the Tabs component; show login form as the primary view
- Add a small text link at the bottom: "Don't have an account? Sign up as Customer | Sign up as Merchant"
- Clicking those links switches to signup mode with the appropriate role pre-selected
- Add an eye icon toggle button (from lucide: `Eye`/`EyeOff`) inside the password `Input` field to show/hide password

**Files:** `src/pages/GetStarted.tsx`

---

### Request 5: Hide Pricing/Testimonials Nav for Customers on Access Card

**Changes to `src/components/Header.tsx`:**
- When the current route is `/customer/access-card`, filter out "Pricing" and "Testimonials" from the `navLinks` array
- Use `useLocation()` to detect the current path
- Customer-facing pages should only show: Home, About Us, Blog, Contact Us

**Files:** `src/components/Header.tsx`

---

### Request 6: Digital Wallet Info + Pricing Payment Integration

**Digital Wallet:** This is informational — I will provide guidance in the plan notes below. Implementation requires Apple Developer account ($99/year) for Apple Wallet passes and Google Pay API for Google Wallet. Both use `.pkpass` (Apple) and JWT-based save links (Google). This is a future integration that needs third-party credentials.

**Pricing Payment Page:** Enable the Stripe integration to create a checkout flow when users click "Start Free Trial" or "Get Started" on the pricing page. The pricing CTAs will redirect to a Stripe Checkout session for Growth ($29/mo) and Pro ($79/mo) plans.

**Files:** `src/pages/Pricing.tsx` (update CTAs), new edge function for Stripe checkout (after Stripe is enabled)

---

### Implementation Order
1. Request 3 — Nav fix (quick CSS)
2. Request 4 — Login-first page + eye toggle
3. Request 5 — Hide Pricing/Testimonials for customers
4. Request 2 — Access Card redesign (largest change)
5. Request 1 — AI reward suggestions
6. Request 6 — Stripe payment (requires enabling Stripe connector first)

### Technical Notes

- **Migration needed:** Add `image_url text` column to `rewards` table for AI-generated reward images
- **No new tables** required
- **Stripe:** Will need to enable the Stripe connector before implementing payment flows
- **Digital Wallet:** Apple Wallet requires an Apple Developer account and signing certificates; Google Wallet requires Google Pay API access. Both are external integrations that need API credentials — I will document the setup steps but cannot fully implement without those credentials.

