

## Enhance Signup Forms and Customer Dashboard Visuals

### Changes Overview

This plan covers two main areas: (1) making all signup fields required + adding a terms checkbox, and (2) making the customer dashboard sections visually richer with images, gradients, and bolder design.

---

### 1. Signup Forms — All Fields Required + Terms Checkbox

**Files: `src/pages/GetStarted.tsx`, `src/pages/CustomerAuth.tsx`, `src/pages/MerchantAuth.tsx`**

- **GetStarted.tsx**: Remove "(optional)" from Phone, Date of Birth, Address, Contact Number, and Industry Type labels. Add `required` prop to all FormField calls. Add validation in `handleSubmit` to enforce all fields before submission.
- **CustomerAuth.tsx** and **MerchantAuth.tsx**: Same treatment — make all fields required with validation.
- **Terms & Conditions Checkbox**: Add a checkbox with label "I agree to the [Terms & Conditions](/privacy) and [Privacy Policy](/privacy)" below the last field, before the submit button. Use the existing `Checkbox` component. Block submission if unchecked. Link text opens the privacy policy page. Add state `agreedToTerms` and validate it on submit.

---

### 2. My Stores — Background Images + Large Fonts

**File: `src/pages/AccessCard.tsx` (lines ~466-510)**

- Each store card gets a gradient background based on industry type (e.g., warm tones for Coffee Shop, cool for Retail).
- Larger store name font (from `text-xs` to `text-sm font-bold`).
- If `logo_url` exists, use it as a subtle background image with overlay gradient.
- Points balance made more prominent with larger text and accent color.

---

### 3. Banners (Promo Carousel) — More Attractive + Clickable

**File: `src/pages/AccessCard.tsx` (lines ~547-587)**

- Add campaign `image_url` as background image with gradient overlay when available.
- Add a visible CTA button ("View Details") that opens the merchant preview dialog.
- Make the entire banner a clickable button (already partially done, enhance styling).
- Add subtle animation/shimmer effect on the current slide.

---

### 4. Featured Campaigns — Attractive Images

**File: `src/components/customer/ExploreTab.tsx` (lines ~147-188)**

- When `campaign.image_url` exists, display it as a background image with gradient overlay.
- Add merchant logo overlay in the corner.
- Increase card height for more visual impact.
- Add "Learn More" CTA text.

---

### 5. Available Rewards — Pictures + Enhanced Design

**File: `src/pages/AccessCard.tsx` (lines ~590-665)**

- When `reward.image_url` exists, display it as a header image above the gradient section.
- If no image, use a larger, more vibrant gradient header with decorative elements.
- Add floating sparkle/star decorations for "ready to redeem" rewards.
- Increase card width slightly for better visual presence.

---

### 6. Hot Rewards — Colorful Store Cards with Images

**File: `src/components/customer/ExploreTab.tsx` (lines ~190-223)**

- Apply unique gradient backgrounds per card based on index (rotating palette of vibrant colors).
- Show merchant logo prominently at top.
- When `reward.image_url` exists, display as a small image.
- Add colorful accent borders and hover glow effects.
- Increase card size from `min-w-[170px]` to `min-w-[200px]`.

---

### 7. Browse Merchants — Attractive + Colorful Cards

**File: `src/components/customer/ExploreTab.tsx` (lines ~264-327)**

- Add gradient accent strip at top of each card.
- Larger logo display area with colored background matching industry.
- Colorful industry type badges with distinct colors per industry.
- Add subtle gradient backgrounds rotating per card.
- Hover effect with colored shadow glow.

---

### Technical Details

- No database changes required.
- All image URLs (`image_url`, `logo_url`) already exist in the database schema.
- The `Checkbox` component from `src/components/ui/checkbox.tsx` will be used for terms agreement.
- Color gradients use existing Tailwind CSS custom properties (primary, secondary, accent, coral).
- Industry-specific color mapping: Coffee Shop (warm amber/orange), Retail (blue/indigo), Restaurant (green/teal).

