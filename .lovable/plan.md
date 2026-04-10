

## Plan: Dashboard UX Overhaul, Merchant Registration, Merchant Branding, and Navigation Fixes

This plan addresses all the issues raised: gamification placement, mobile navigation, merchant registration requirements, attractive merchant branding, review section relocation, and industry filter fixes.

---

### 1. Move Gamification into a "Points & Stamps" Section

Currently gamification settings live under Settings. Move stamp card configuration and the "Add Points" action into a new unified nav item called "Points" that replaces the current Dashboard "Add Points" modal approach.

**Changes:**
- `MerchantNav.tsx` — Change nav from 5 to 6 items: Dashboard, Customers, **Points**, Insights, Marketing, Settings. The "Points" item links to `/merchant/points`
- New `src/pages/MerchantPoints.tsx` — Consolidated page with tabs: **Add Points** (the existing add-points form), **Stamp Cards** (gamification stamp config moved from Settings), **QR Scanner** (stamp scanner)
- `MerchantSettings.tsx` — Remove the Gamification tab
- `MerchantDashboard.tsx` — Remove the Add Points feature card and modal (moved to Points page)
- `App.tsx` — Add `/merchant/points` route

### 2. Fix Mobile Bottom Navigation

The 6 nav items need to fit on mobile. Use smaller icons and compact layout so all items are visible without scrolling.

**Changes:**
- `MerchantNav.tsx` — Adjust mobile bottom nav to use `text-[9px]`, smaller icon sizes (16px), tighter padding, and `justify-around` to fit 6 items evenly

### 3. Mandatory Fields in Merchant Registration

Add required fields during signup: logo upload, address, phone number, industry type (dropdown).

**Changes:**
- `MerchantAuth.tsx` — Add fields for: **Logo** (file upload to `profile-images` bucket), **Address**, **Phone Number**, **Industry Type** (dropdown: Coffee Shop, Retail, Restaurant). All required during signup. After signup, insert merchant record with all fields populated and upload logo to storage.

### 4. Attractive Merchant Dashboard Header with Logo & Banner

Replace the plain text heading with a branded banner showing merchant logo, store name, industry badge, and a gradient banner background.

**Changes:**
- `MerchantDashboard.tsx` — Replace the heading section with a banner card: gradient background, merchant logo (or placeholder), store name in large bold text, industry type badge, address snippet. Fetch `logo_url`, `industry_type`, `address`, `profile_image_url` from merchants table.
- Update `MerchantData` interface to include `logo_url`, `industry_type`, `address`, `profile_image_url`

### 5. Attractive Merchant Cards in Customer Views

Make merchant displays in "My Stores" and "Browse Merchants" more visually appealing with merchant photos, industry badges, and richer detail.

**Changes:**
- `AccessCard.tsx` (My Stores section) — Enlarge store cards, show a larger logo/photo, add industry type badge, address line. Use a card-style layout with gradient accent.
- `ExploreTab.tsx` (Browse Merchants grid) — Enlarge merchant cards, show bigger logo, add industry type as a colored badge, show address, add a "banner" gradient strip behind logo. Make cards more visually attractive.
- Fetch `profile_image_url`, `address`, `industry_type` alongside existing merchant queries

### 6. Move "Write a Review" into Customer Navigation

Remove the review section from the bottom of AccessCard and add it as a tab in the main tab switcher (My Rewards | Explore | **Review**).

**Changes:**
- `AccessCard.tsx` — Remove `<WriteReviewSection>` from the bottom. Add a third tab "Review" to the main tab switcher. Show `WriteReviewSection` when that tab is active.

### 7. Fix Industry Filter in Browse Merchants

The filter doesn't work because DB values ("Coffee supplies", "Restaurent") don't match filter values ("Coffee Shop", "Restaurant"). Fix this by making the filter dynamic — fetch actual industry types from the database.

**Changes:**
- `IndustryFilter.tsx` — Accept `industries` prop (list of actual industry types from DB) instead of hardcoded values. Add icons based on keyword matching (coffee → Coffee icon, restaurant → UtensilsCrossed, retail → ShoppingBag).
- `ExploreTab.tsx` — Extract unique industry types from fetched merchants and pass to `IndustryFilter`
- **DB data fix** — Use insert tool to update the misspelled "Restaurent" → "Restaurant" in the merchants table. Standardize "Coffee supplies" to "Coffee Shop" if appropriate (will confirm with migration or data update).

### 8. Industry Type Dropdown in Settings

Change the industry type input from free text to a dropdown to prevent future mismatches.

**Changes:**
- `MerchantSettings.tsx` (Business tab) — Replace the Industry Type text input with a `<Select>` dropdown offering: Coffee Shop, Retail, Restaurant, plus an "Other" option with custom input.

---

### Files Changed Summary

| File | Change |
|------|--------|
| `src/components/merchant/MerchantNav.tsx` | Add "Points" nav item (6 total), fix mobile layout for 6 items |
| `src/pages/MerchantPoints.tsx` | **New** — Add Points + Stamp Cards + QR Scanner tabs |
| `src/pages/MerchantAuth.tsx` | Add logo upload, address, phone, industry dropdown as required fields |
| `src/pages/MerchantDashboard.tsx` | Branded banner header with logo/industry, remove Add Points card |
| `src/pages/MerchantSettings.tsx` | Remove Gamification tab, industry type → dropdown |
| `src/pages/AccessCard.tsx` | Move review to tab, enhance My Stores cards |
| `src/components/customer/ExploreTab.tsx` | Dynamic industry filter, richer merchant cards |
| `src/components/customer/IndustryFilter.tsx` | Accept dynamic industries prop |
| `src/App.tsx` | Add `/merchant/points` route |
| **Data update** | Fix "Restaurent" → "Restaurant", "Coffee supplies" → "Coffee Shop" |

