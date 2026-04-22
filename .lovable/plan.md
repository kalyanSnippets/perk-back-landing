
## Rework customer discovery so Rewards owns all rewards, and Explore becomes a cleaner store-browsing experience

### Recommended product direction
For PerkBack, the cleanest flow is:

```text
Rewards tab = loyalty destination
- total points
- My Stores
- all rewards across joined / available stores
- tap any reward -> store-aware reward action

Explore tab = discovery destination
- search + industry filter
- swipe through one merchant per screen
- tap merchant -> open the same dedicated store detail view used by My Stores
```

This keeps the app easy to understand:
- Rewards = what I can earn/redeem
- Explore = where I can discover stores

---

## What I will change

### 1. Remove “Hot Rewards” from Explore
I’ll remove the current Hot Rewards carousel from `ExploreTab`.

### 2. Move all rewards into the Rewards section
I’ll make the Rewards tab the single place where reward cards live:
- show all rewards there
- include the items currently shown in “Hot Rewards”
- remove duplicate reward surfacing from Explore

Recommended ordering in Rewards:
1. Total points summary
2. My Stores
3. All Rewards
4. Optional offers/campaign highlights only if they support the rewards journey

Reward sorting recommendation:
- ready to redeem first
- then closest-to-unlock
- then the rest

That makes the section more useful for customers than a random “hot” list.

### 3. Make Explore merchant browsing one-card-per-screen
Instead of stacking merchant cards vertically, I’ll redesign Explore so:
- one merchant fills the main viewport at a time
- users can swipe left/right to browse merchants
- each merchant feels more premium and easier to focus on
- the card layout visually matches the simpler My Store style

Recommended card structure:
- full image / banner
- gradient overlay
- logo badge
- store name
- industry
- address or distance
- reward count / member badge at the bottom

### 4. Add merchant search to Explore
I’ll add a search input above the swipeable merchant browser so customers can quickly find a store by:
- store name
- industry
- possibly address text

This will work together with the existing industry filter.

### 5. Make Explore merchant tap open the same store detail experience as My Stores
Right now Explore uses its own merchant preview dialog. I’ll replace that behavior so clicking a merchant from Explore opens the same dedicated store detail view already used by My Stores.

That means:
- one consistent store page experience
- same hero, offers, rewards, directions, and actions
- no separate lightweight preview that feels disconnected

### 6. Preserve source-aware navigation
When a store is opened from Explore:
- the customer enters the shared store detail view
- tapping Back returns them to Explore, not My Stores

When a store is opened from My Stores:
- Back returns them to Rewards

This will make the experience feel intentional instead of confusing.

### 7. Keep Store Detail as the shared destination
The existing `StoreDetailView` already has the right direction. I’ll use it as the shared store destination for both entry points:
- My Stores
- Explore

I’ll refine it only where needed so it works naturally regardless of where the customer came from.

---

## Implementation approach

### In `src/pages/AccessCard.tsx`
I’ll centralize store-opening behavior so the page can:
- track the active tab
- track the active store detail merchant
- track where the store was opened from (`my-rewards` or `explore`)
- render the same store detail screen for both flows
- move the full rewards list into the Rewards tab only

### In `src/components/customer/ExploreTab.tsx`
I’ll refactor Explore to:
- remove Hot Rewards
- remove the current stacked Browse Merchants list
- remove the separate merchant preview dialog behavior
- add search
- build a swipeable one-merchant-per-screen carousel
- notify `AccessCard` when a merchant is opened

### In `src/components/customer/MyStoreCard.tsx`
I’ll align the Explore merchant visual treatment with the simpler My Store direction:
- cleaner image-led card
- details anchored at the bottom
- less clutter
- stronger consistency between My Stores and Explore

### In `src/components/customer/StoreDetailView.tsx`
I’ll keep the shared store-detail experience and adjust only what is needed for:
- source-aware back behavior
- consistent use from both Explore and My Stores
- rewards/offers/campaigns display staying merchant-specific

### Likely cleanup
- remove or stop using `src/components/customer/MerchantPreview.tsx` if the shared store-detail flow fully replaces it

---

## Files to update
- `src/pages/AccessCard.tsx`
- `src/components/customer/ExploreTab.tsx`
- `src/components/customer/MyStoreCard.tsx`
- `src/components/customer/StoreDetailView.tsx`
- possibly `src/components/customer/MerchantPreview.tsx` for removal or deprecation
- use existing `src/components/ui/input.tsx` for search

---

## Design recommendations for this project
For a loyalty platform like PerkBack, I recommend:

### Rewards tab
Keep it practical and action-based:
- customer points
- joined stores
- redeemable / near-unlock rewards
- minimal distractions

### Explore tab
Make it feel like browsing premium local merchants:
- one store at a time
- swipe interaction
- search + industry filter
- strong image-led presentation
- tap to enter full store view

This fits the product better than long stacked cards, because customers are discovering lifestyle/local brands, not scanning a dense admin-style directory.

---

## Technical notes
- No database changes are required.
- No auth changes are required.
- Existing merchant/reward/campaign/offer queries can be reused.
- Existing in-dashboard store-detail architecture can be extended instead of rebuilt.
- The main change is UI flow consolidation so customers get one consistent store-opening experience across Rewards and Explore.
