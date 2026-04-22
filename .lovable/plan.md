
Implement an in-dashboard store detail experience inside `src/pages/AccessCard.tsx` so tapping a My Store card transitions the customer into a dedicated store-focused screen instead of only filtering the current dashboard.

### What will be built

### 1. Turn store card tap into a full in-dashboard store page
When a customer taps a My Store card:
- switch from the generic “My Rewards” overview into a dedicated store detail view inside the same dashboard
- preserve the current top tab navigation and shared page shell
- show a clear back action to return to the main rewards overview
- keep session, routing, and auth behavior unchanged

Recommended state model:
- keep `activeMainTab`
- add a store detail mode such as `activeStoreViewMerchantId`
- use that state to render either:
  - the main rewards overview
  - or the dedicated selected-store page

### 2. Redesign My Store cards to be simpler and more premium
Replace the current busy card treatment with a cleaner visual layout:
- large background image/banner
- dark gradient overlay for readability
- merchant logo badge
- store name
- industry label
- points balance
- reward count summary at the bottom
- optional visits/spend as smaller secondary metadata

Design direction:
- simpler composition
- less visual clutter
- stronger image-led layout
- more consistent card heights and padding
- keep the active/selected styling subtle and premium

### 3. Build a dedicated store detail page section
The new store page should show all relevant info for the selected merchant in one place:

```text
Back to My Rewards
Store hero
Store name + industry + address
Points at this store
Reward summary
Campaigns / monthly offers
All rewards for this store
Directions CTA
```

Content to include:
- merchant image/banner
- merchant logo
- store name
- industry
- address
- points balance for that merchant
- visits and spend
- active campaigns
- monthly offers
- all rewards for that merchant

### 4. Make reward cards redirect to store directions
When a reward is tapped from the dedicated store page:
- open a store-specific reward action experience instead of only the current generic reward dialog
- primary action should be a directions CTA to the merchant
- preserve redeem behavior if the reward is ready
- if not ready, still show points needed and direct the user to the store

Recommended reward interaction:
- reward card tap opens a store reward modal/sheet
- modal includes:
  - reward title
  - reward image if present
  - store name
  - required points
  - customer’s points at this store
  - redeem CTA when eligible
  - “Get directions” CTA
  - optional address snippet

### 5. Add store directions consistently
Use merchant address to generate a maps URL everywhere relevant:
- store detail hero CTA
- reward detail CTA
- optional offer/campaign CTA if desired

Behavior:
- if address exists, open Google Maps directions
- if address is missing, hide the directions action instead of showing a broken button

### 6. Keep the main overview dashboard cohesive
The generic customer dashboard should remain the overview page:
- points hero
- simplified My Stores section
- campaigns/offers/rewards overview
- transaction history

But once a store is selected:
- the customer should feel like they are “inside that store”
- the overview sections should no longer compete with the store-specific content

### 7. Preserve and adapt existing working logic
Keep these behaviors working:
- merchant selection analytics
- filtered merchant rewards/offers/campaign data
- reward redemption flow
- realtime updates after merchant changes
- merchant status / gamification logic where applicable

Adjust existing logic so:
- My Store cards enter store view
- “View All” exits store view
- campaigns/offers on the store page stay limited to the selected merchant
- the existing reward modal is upgraded into a store-aware action modal

### 8. Refactor AccessCard to keep it maintainable
To avoid further bloat in `src/pages/AccessCard.tsx`, extract the store-specific UI into focused components.

Recommended components:
- `src/components/customer/MyStoreCard.tsx`
- `src/components/customer/StoreDetailView.tsx`
- `src/components/customer/StoreRewardActionDialog.tsx`

This keeps:
- page-level state in `AccessCard.tsx`
- presentation logic in reusable customer components

### Files to update
- `src/pages/AccessCard.tsx`
- `src/lib/industryImages.ts` if stronger fallback imagery is needed
- new customer UI components for the store cards/detail screen/reward dialog

### Implementation details
- no database changes required
- no auth changes required
- no route changes required because you chose to keep this inside the dashboard
- reuse existing merchant-derived data from:
  - `customerMerchants`
  - `rewards`
  - `campaigns`
  - `monthlyOffers`
- derive a store maps URL from merchant address
- promote merchant imagery using existing reward/campaign images first, then `getIndustryImage(...)` fallback

### UX recommendations
Best final experience:
- overview dashboard = browse all stores
- tap store card = enter that store’s own mini-page
- tap reward = see reward details + directions + redeem action
- back button = return to all stores overview

This gives you the “exclusive” store experience you want without sending the user to a separate app route, while also making the My Store cards cleaner, more premium, and more useful on mobile.
