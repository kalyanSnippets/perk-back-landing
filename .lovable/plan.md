

## Plan: Settings Enhancements, Customer Dashboard Restructure, Search, Reviews Navigation, and UX Improvements

This plan addresses all requested changes across merchant settings, customer dashboard, navigation, NFC explanation, and visual improvements.

---

### 1. Settings Plan Tab: Add "Change Plan" and "Delete Subscription" Buttons

Currently the Plan tab only shows included/locked features. Add:
- **Change Plan** button that navigates to the pricing page or triggers an upgrade request
- **Delete Subscription** button with a confirmation dialog that downgrades to Free plan

**File:** `MerchantSettings.tsx` (subscription tab section, lines 234-262)

### 2. Profile Tab: Add "Delete Photo" and "Delete Logo" Buttons + Image Specs

Add delete buttons next to the upload buttons for both profile photo and business logo. Show recommended image specifications.

**Changes in `MerchantSettings.tsx`:**
- Profile photo section: Add "Delete Photo" button that sets `profile_image_url` to null. Show spec: "Recommended: 400x400px, square, JPG/PNG, max 2MB"
- Business logo section: Add "Delete Logo" button that sets `logo_url` to null. Show spec: "Recommended: 200x200px, square with transparent background, PNG, max 2MB. This appears on your dashboard banner and customer cards."

### 3. Customer Search in Points & Stamps (Add Points, Stamp Cards, QR Scanner)

Add a phone/mobile number search field to find customer loyalty card numbers. When the merchant types a phone number, search the `customers` table for matching records and display the loyalty card number.

**File:** `MerchantPoints.tsx`
- Add a shared "Find Customer" search component at the top of Add Points and QR Scanner tabs
- Search by phone number against `customers.phone` column
- Display matching customer name and loyalty card number
- Auto-fill the card number field when a customer is selected

**New component:** `src/components/merchant/CustomerSearch.tsx`
- Input field for phone number
- Searches `customers` table via a security-definer function (since merchants can't directly query customers table)
- Shows results with name + card number

**Database:** New RPC function `search_customer_by_phone` (security definer) that takes merchant_id and phone, returns matching customer id, name, and loyalty_card_number only if the customer has a relationship with that merchant (via `customer_merchants` table).

### 4. Streaks & Customer Levels Explanation

This is an informational answer (no code change):

**Visit Streaks:** When a merchant enables streaks with threshold of 5, customers who visit 5 consecutive times (e.g., 5 days in a row or 5 visits without a long gap) earn the configured bonus reward (e.g., bonus points). The merchant sets this up; customers see their streak progress on their dashboard. Currently, streak tracking logic is **not yet fully implemented** in the backend -- the `gamification_settings` table stores the config, but there's no `customer_streaks` table or trigger to track consecutive visits. This would need a future implementation.

**Customer Levels (Bronze/Silver/Gold/VIP):** These are tier labels based on cumulative points at a merchant. When a merchant enables levels, customers are categorized into tiers (Bronze 0+, Silver 500+, Gold 1500+, VIP 5000+). Currently, levels are **display-only configuration** -- the tiers show in settings but aren't surfaced on the customer dashboard yet. Future implementation would show the customer their current tier and perks.

### 5. Plan Badge Visibility on Merchant Dashboard Banner

The `PlanBadge` component uses `bg-muted text-muted-foreground` for the Free plan, which blends into the dark gradient banner. Fix by adding a banner-specific variant.

**File:** `MerchantDashboard.tsx` (line 175)
- Wrap `PlanBadge` with a white/light background pill so it's visible against the gradient: `bg-white/20 backdrop-blur-sm` container, or override PlanBadge styles for banner context with light text colors.

**File:** `PlanBadge.tsx`
- Add an optional `variant="banner"` prop that uses light/white text styles for dark backgrounds.

### 6. Move "Reviews" to Header Navigation (Below Contact Us)

Currently "Review" is a tab inside AccessCard. Move it to the main site navigation as a standalone page.

**Changes:**
- `Header.tsx` — Add "Reviews" nav link after "Contact Us" in the `navLinks` array
- `AccessCard.tsx` — Remove "Review" from the 3-tab switcher, make it 2 tabs (My Rewards | Explore)
- New `src/pages/ReviewPage.tsx` — Standalone page with the `WriteReviewSection` component, accessible to logged-in customers
- `App.tsx` — Add `/reviews` route

### 7. Separate "Card" Tab in Customer Access Card

Move the loyalty card display (barcode, card details, copy/share actions, wallet buttons) into a dedicated "Card" tab.

**File:** `AccessCard.tsx`
- Change tab switcher to 3 tabs: **My Rewards** | **My Card** | **Explore**
- "My Card" tab shows: loyalty card with barcode, card details (CRN, card number, issued date), copy/share actions, wallet buttons
- "My Rewards" tab becomes more focused: My Stores, Points Balance, Promotions carousel, Available Rewards (redesigned), Stamp Cards, NFC Tap, Monthly Offers, Redemption History

### 8. Customer Dashboard: Focus on Offers, Rewards, Stamps

Restructure the "My Rewards" tab to prioritize promotional content:

**File:** `AccessCard.tsx` (My Rewards tab restructure)
- Order: My Stores → Points Balance → **Promo Carousel** (campaigns + monthly offers) → **Available Rewards** (redesigned, see below) → **Stamp Card & NFC** → Points History (collapsed) → Redemption History
- Remove loyalty card from this tab (moved to "My Card")

### 9. Available Rewards: Make More Attractive

Redesign the rewards cards with modern trends:

**File:** `AccessCard.tsx` (rewards section, lines 547-604)
- Use larger cards with gradient backgrounds per reward type
- Add a shimmer effect on "Ready to redeem" cards
- Show merchant logo alongside store name
- Add a prominent CTA button on each card ("Claim" or "X pts to go")
- Use glassmorphism-style card borders
- If reward has no image, show a colorful gradient placeholder with the reward type icon

### 10. NFC Explanation and Status

**How NFC works in PerkBack:** The Web NFC API is used on Android Chrome. When a customer taps "Tap NFC Tag," their phone starts scanning. The merchant has a physical NFC tag at the counter programmed with a unique token. When the customer's phone reads the token, it calls the `process-nfc-tap` edge function which validates the token against `nfc_tap_tokens` table and awards a stamp.

**Current limitations and fixes needed:**
- NFC only works on Android Chrome (Web NFC API). iOS does not support Web NFC.
- For iOS, the QR fallback exists (shows card number for merchant to manually enter)
- The NFC tag must be programmed with the merchant's token (generated in the NFC settings tab)
- No code fixes needed -- the implementation is functional. The main gap is documentation/onboarding for merchants on how to program NFC tags.

No code changes for NFC, but I'll add a small info tooltip in the `NfcTapButton` component explaining how it works.

---

### Files Changed Summary

| File | Change |
|------|--------|
| `MerchantSettings.tsx` | Add Change Plan + Delete Subscription buttons, Delete Photo/Logo buttons with image specs |
| `MerchantPoints.tsx` | Integrate customer phone search in Add Points and Scanner tabs |
| `src/components/merchant/CustomerSearch.tsx` | **New** — Phone-based customer lookup component |
| `PlanBadge.tsx` | Add `variant="banner"` prop for light-on-dark styling |
| `MerchantDashboard.tsx` | Use banner variant for PlanBadge |
| `Header.tsx` | Add "Reviews" nav link after Contact Us |
| `AccessCard.tsx` | Restructure to 3 tabs (My Rewards / My Card / Explore), redesign rewards, remove Review tab |
| `src/pages/ReviewPage.tsx` | **New** — Standalone review page |
| `App.tsx` | Add `/reviews` route |
| `NfcTapButton.tsx` | Add info tooltip explaining how NFC works |
| **DB migration** | New `search_customer_by_phone` RPC function |

