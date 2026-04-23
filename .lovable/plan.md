
Implement a focused polish pass across rewards logic, the loyalty card experience, and Explore so the customer flow feels premium and the merchant reward setup produces sensible copy.

### 1. Fix reward and promotion wording so merchants can’t create confusing logic
Update the merchant-facing reward/promotion setup so labels and previews always match the selected rule type.

What to change:
- Separate plain rewards from promotion rules conceptually:
  - `rewards` = redeemable perks with points required
  - `promotion_rules` = earn/visit/spend triggers like “Buy 5, get 1 free”
- Replace unclear combinations like “buy one and get 10% points” with type-safe combinations:
  - Buy X items → Free item / Discount % / Bonus points
  - Spend $X → Free item / Discount % / Bonus points
  - Visit X times → Free item / Discount % / Bonus points
- Add clearer preview text in merchant promotion screens so the sentence reads naturally before saving.
- Normalize customer-facing reward chips so raw enum values like `discount_percent` or `bonus_points` become premium readable labels.

Recommended implementation:
- Add formatting helpers in a shared utility for:
  - reward type labels
  - promotion rule summaries
  - promotion reward summaries
- Use the same helper in:
  - `src/pages/MerchantPromotions.tsx`
  - `src/pages/MerchantMarketing.tsx`
  - customer reward/store views where reward types are shown

### 2. Upgrade the Card tab into a premium interactive loyalty card
Redesign the current card section so it feels like a real digital loyalty card instead of a static panel.

What to build:
- A front side:
  - PerkBack branding
  - member name
  - CRN
  - card number
  - subtle chip / gloss / layered gradients
- A back side:
  - barcode
  - QR code
  - issued date
  - “ready at checkout” style supporting copy
- Tap-to-flip interaction:
  - tap the card to rotate
  - smooth 3D flip
  - keep action buttons below the card

Recommended implementation:
- Extract the card UI into a dedicated component, e.g. `src/components/customer/LoyaltyCardFlip.tsx`
- Keep wallet, copy, and share buttons outside the flip surface
- Reuse current `Barcode` and `QRCodeDisplay` components
- Follow the existing prototype direction from `MobileCustomerPrototype` but adapt it to live data

### 3. Make Explore search simpler and more accurate
Simplify the Explore top controls so search feels useful immediately.

What to change:
- Keep a single strong search bar as the primary control
- Improve merchant matching to search against:
  - store name
  - industry
  - address
- Normalize search:
  - trim whitespace
  - lowercase
  - split terms so multi-word queries behave better
- Sort results more intentionally:
  1. exact/strong name matches
  2. joined stores
  3. closest stores when location is available
  4. then alphabetical

Recommended Explore layout:
```text
Search bar
Closest store CTA (if location available)
Swipeable merchant card
Dots / swipe indicator
```

Also refine the “Closest to you” behavior:
- make it more prominent
- let the CTA jump directly into the store detail view
- if location permission is missing, simply hide this block gracefully

### 4. Add a Join Store action for not-yet-joined customers
When a customer opens a store from Explore and hasn’t joined it yet, give them a clear way to join that store and unlock the full rewards relationship.

What to build:
- In the shared store detail view:
  - if joined: show normal store info/rewards state
  - if not joined: show a primary “Join Store” CTA
- After joining:
  - create the customer-store relationship
  - update the UI immediately
  - switch the store into joined mode
  - allow rewards/details to behave like My Store

Important backend note:
- The current access rules only allow customers to read `customer_merchants`, not insert into it.
- This requires a backend change before the Explore join action can work safely.

Recommended backend approach:
- Add a secure database function or policy for customer self-join
- Validate that:
  - the authenticated user owns the customer profile
  - the merchant exists
  - duplicates are prevented
- Prefer an RPC or controlled backend function over broad open insert rules

### 5. Remove the recommendation panel from Explore
Delete the recommendation message at the bottom of `ExploreTab` so the screen ends cleanly after the merchant browser.

### 6. Keep one shared store detail flow for both My Stores and Explore
Continue using the same dedicated in-dashboard store page for:
- joined stores from My Stores
- discovered stores from Explore

Refine it so:
- joined stores show points, offers, rewards, visits, and directions
- not-joined stores show store details and a Join Store action first
- back behavior still returns to the correct source tab

### 7. Files to update
Frontend:
- `src/pages/AccessCard.tsx`
- `src/components/customer/ExploreTab.tsx`
- `src/components/customer/StoreDetailView.tsx`
- `src/components/customer/StoreRewardActionDialog.tsx`
- new `src/components/customer/LoyaltyCardFlip.tsx`
- new shared formatter utility, e.g. `src/lib/rewardFormatting.ts`

Merchant reward logic:
- `src/pages/MerchantPromotions.tsx`
- `src/pages/MerchantMarketing.tsx`
- optionally `src/pages/MerchantRewards.tsx` for reward type label consistency

Backend:
- new database migration to support customer self-join safely for `customer_merchants`

### 8. Recommended final UX
Best direction for PerkBack:

```text
Rewards
- total points
- My Stores
- clear rewards

Card
- premium flip loyalty card
- barcode + QR on reverse

Explore
- one search bar
- closest store prompt
- swipe one merchant at a time
- open shared store page
- join store if not yet joined
```

This keeps the app elegant and easy to understand:
- Rewards = what I’ve earned
- Card = my wallet credential
- Explore = where I want to join next
