
## Refine the customer dashboard so it feels like one cohesive screen again, and restore the “My Stores” section to the earlier card-style layout shown in your reference

### What will change

### 1. Make the whole Rewards dashboard feel unified instead of stacked “pieces”
I’ll rework the `my-rewards` view in `src/pages/AccessCard.tsx` so the sections feel like one continuous premium dashboard rather than separate unrelated cards.

This means:
- tighten vertical rhythm and spacing between sections
- create a clearer visual order:
  1. greeting
  2. top tab switcher
  3. points balance hero
  4. My Stores card-slider section
  5. status/progress
  6. campaign / offer spotlight
  7. rewards and offers below
- reduce the feeling of “box inside box inside box”
- use more consistent radii, shadows, padding, and section backgrounds
- simplify the selected-store summary so it doesn’t compete too much with the main dashboard flow

### 2. Restore “My Stores” to the older visual style from your image
The current store area is more like a filter/control panel. I’ll bring it back to the previous visual pattern shown in the screenshot:

```text
My Stores
[ large horizontal store cards with image ]
[ store logo badge overlapping image ]
[ store name ]
[ industry ]
[ points ]
[ visits + spend ]
```

Planned update:
- replace the current select-heavy presentation with a visual store card carousel/grid
- each store card will show:
  - merchant image/banner
  - store logo/icon badge
  - store name
  - industry type
  - store-specific points
  - visits
  - total spend
- selecting a store will still filter rewards/offers, but the interaction will feel visual first, not form-first
- keep “All Stores” available, but make it secondary and cleaner

### 3. Keep the new functionality, but move it behind the restored store cards
You asked for it to feel like it used to before, so I won’t remove the useful logic that was recently added. Instead I’ll reposition it:

- store card tap/select → activates that merchant
- the richer store-specific actions/details can appear:
  - either beneath the active store cards
  - or inside a cleaner details sheet/modal
- this preserves:
  - working store filtering
  - reward modal
  - quick actions
  - analytics events
without making the “My Stores” section look overloaded

### 4. Simplify the selected-store experience
Right now the selected merchant block is visually too dense. I’ll tone it down so it supports the dashboard instead of dominating it.

Recommended direction:
- keep one compact selected-store detail panel
- reduce duplicate stats and repeated “reward focus” content
- make only one primary CTA prominent
- use smaller secondary actions
- preserve working links:
  - View offers
  - Redeem reward
  - Check points
  - Get directions / Store details

### 5. Match the screenshot’s softer premium style more closely
Your reference uses:
- white cards
- soft shadows
- large rounded corners
- lighter backgrounds
- cleaner spacing
- less visual fragmentation

I’ll align the rewards dashboard with that direction by:
- reducing heavy borders where not needed
- using softer card separation
- increasing white/neutral breathing room
- making the points card and stores section visually dominant
- keeping PerkBack’s blue/gold identity while avoiding over-clutter

### 6. Update the points + status flow so it fits better with the restored layout
The screenshot has a cleaner sequence:
- points hero first
- store cards second
- status strip third
- campaign card after

I’ll reshape the current flow to follow that pattern more closely:
- retain the current live points logic
- keep the merchant status card/tier strip
- place campaign/offer spotlight after the store section, not competing with it

---

## Files to update
- `src/pages/AccessCard.tsx`
- possibly `src/lib/industryImages.ts` if stronger/fallback merchant card imagery is needed

---

## Implementation details

### My Stores redesign
- convert the current “My Store” panel from filter-first UI into a card-based merchant showcase
- use merchant image/logo/industry metadata already available in `customerMerchants`
- preserve store selection state with `selectedMerchantId`
- keep analytics:
  - store switcher opened
  - merchant selected
- adapt analytics trigger so it still works with the restored card interaction

### Layout cleanup
- reduce nested wrappers in the rewards tab
- standardize section container styling
- rebalance spacing and hierarchy for mobile first (current viewport is narrow mobile)

### Functional preservation
I will keep:
- merchant filtering
- reward redemption behavior
- store detail modal
- quick-action buttons
- loading skeletons / empty states
- highlight-and-scroll behavior for points/rewards/offers

But I will present them in a cleaner structure so the screen feels more intentional.

---

## Recommended final UX direction
Best version for this screen:

```text
Greeting
Top tabs
Large points card
My Stores horizontal visual cards
Compact loyalty status strip
Featured campaign/offer card
Rewards section
Offers section
```

This will bring back the more polished “used to be before” feel from your screenshot while keeping the better filtering and working actions that were recently added.
