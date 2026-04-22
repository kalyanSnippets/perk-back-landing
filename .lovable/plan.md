
## Remove the current “in-store exclusive” block and replace it with a lighter store-filter experience

### Recommendation based on similar platforms
For loyalty products like Starbucks, ShopBack-style merchant views, and multi-brand rewards apps, the best pattern is usually not a large “exclusive section” card. It adds visual weight and duplicates information that already appears below.

Your chosen direction is the right one:
- use a compact store filter bar
- keep **All Stores** as the default landing view
- when a store is selected, filter the existing rewards page instead of opening a separate section
- prioritize:
  1. points + next reward
  2. offers + campaigns
  3. recent activity

This will feel cleaner, faster, and more app-like on mobile.

---

## What I will change

### 1. Remove the current “Exclusive store section” block entirely
In `src/pages/AccessCard.tsx`, I will remove the large selected-store panel that currently shows:
- “Exclusive store section”
- merchant logo/address header
- 4 stat tiles
- explanatory message about everything being filtered

This section is the part making the page feel heavy and repetitive.

### 2. Replace it with a compact store filter bar
I’ll keep the “My Stores” concept, but redesign it into a cleaner filter control more like a chip rail / compact selector:
- **All Stores** chip first
- one chip/button per joined merchant
- active state clearly highlighted
- each store chip can show:
  - store name
  - small logo or store icon
  - optional points badge
- no large expanded card by default

This keeps the dashboard focused and is closer to how modern loyalty/rewards apps handle merchant switching.

### 3. Make the selected store visible inside the hero points area instead of a separate section
Rather than using a dedicated section, the selected store context will appear where it matters most:
- points card label changes clearly
- selected store name appears near the points/progress area
- next reward progress becomes obviously merchant-specific
- optional small “Filtered by [Store]” badge near the top

This keeps the page informative without adding another full card.

### 4. Reorder the rewards tab so the important store-specific content leads
When a store is selected, the page flow will emphasize the priorities you chose:

```text
Top area
├─ Points / next reward progress
├─ Store filter bar
├─ Campaigns + monthly offers
├─ Available rewards
├─ Recent activity / points earned
└─ Redemptions / gamification
```

Compared with the current version, this means:
- offers/campaigns move into a more prominent position for selected-store browsing
- recent activity becomes easier to find
- the page feels like one continuous dashboard, not a dashboard plus a sub-dashboard

### 5. Improve “All Stores” vs selected-store behavior
I’ll make the distinction more intuitive:

#### All Stores view
- overall points total
- mixed rewards across merchants
- mixed campaigns/offers
- full activity history

#### Selected store view
- merchant-specific points
- merchant-specific next reward progress
- only that merchant’s rewards
- only that merchant’s campaigns and offers
- only that merchant’s transaction and redemption history

No extra explanation card will be needed because the filtered UI itself will make the behavior obvious.

### 6. Keep the design aligned with similar mobile loyalty apps
I’ll follow the current PerkBack visual style but make it more restrained for this area:
- rounded chip selector instead of heavy store cards
- keep gradients only where they add value
- reduce repeated merchant headers
- preserve the premium mobile look while improving clarity

This fits your existing brand better and avoids over-designing the store-selection flow.

---

## Suggested UI pattern I recommend
Best option for PerkBack:

```text
Rewards tab
├─ Top nav
├─ Points hero card
│  ├─ Total points / selected-store points
│  └─ next reward progress
├─ Store filter chips
│  ├─ All Stores
│  ├─ Cafe A
│  ├─ Shop B
│  └─ Restaurant C
├─ Featured campaigns / monthly offers
├─ Available rewards
├─ Recent activity
└─ My redemptions
```

Why this is the best fit:
- easier to scan on mobile
- no duplicated merchant content
- keeps all-store overview strong
- merchant filtering still feels powerful
- closer to patterns users already know from other rewards apps

---

## Files I will update

- `src/pages/AccessCard.tsx`
  - remove the current selected-store “exclusive section”
  - replace the large store cards/selection treatment with a compact filter bar
  - rebalance section order for selected-store mode
  - strengthen store-specific context in the points/progress area
  - make recent activity more prominent in filtered mode

Potentially reuse existing visual patterns from:
- `src/components/customer/IndustryFilter.tsx`
  - for compact horizontal chip/filter behavior
- `src/components/shared/HeroPointsCard.tsx`
  - as styling inspiration for clearer top-level points emphasis

---

## Final behavior after the change

```text
Customer opens Rewards tab
  ├─ default = All Stores overview
  ├─ taps a merchant chip
  ├─ page stays on same tab
  └─ all content quietly filters to that merchant
```

```text
No more:
  - big “Exclusive store section” block
  - duplicated merchant summary card
  - extra explanation panel

Instead:
  - compact store filter
  - cleaner dashboard flow
  - selected-store context embedded into the main rewards experience
```

---

## Technical notes
- No database change is required.
- Existing filtering logic using `selectedMerchantId` can stay in place.
- This is mainly a UX/layout refactor of `AccessCard.tsx`.
- Real-time updates, auth persistence, merchant/customer sync, and existing rewards logic will remain unchanged.
