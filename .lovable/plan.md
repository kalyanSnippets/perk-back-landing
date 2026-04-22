
## Improve the selected-store “exclusive box” so every action works, feels intentional, and looks premium

### What I found in the current implementation

The “exclusive box” is the selected merchant summary inside `src/pages/AccessCard.tsx`.

### What is already working
- Store switcher selection works.
- “View details” works and opens the store reward details dialog.
- Reward cards work by opening the reward dialog when the card is tapped.
- Campaign carousel cards work and can switch into a merchant view.

### What is not working well yet
- “View offers” does not actually navigate the user to a specific offers destination. It only keeps the user on the same tab and shows a toast.
- “Check points” does not move the user anywhere meaningful. It only re-triggers the points animation.
- “Redeem reward” only works when a ready reward exists; otherwise it stops at a toast instead of guiding the user to the next best action.
- The selected-store panel has no strong merchant destination links such as:
  - jump to offers section
  - jump to rewards section
  - jump to points summary
  - open map/address when available
- The box feels more informational than actionable. The UI does not clearly show what the primary next step is.
- Design-wise, the section is visually flatter than the rest of the dashboard and does not yet use merchant imagery/brand treatment strongly.

---

## Implementation plan

### 1. Turn the exclusive box into a fully interactive store hub
Update the selected merchant summary so all actions lead somewhere concrete:

- **View offers**
  - Scroll to the filtered monthly offers section if offers exist
  - If no offers exist, open the store details dialog and show a friendly empty state
- **Redeem reward**
  - If a reward is ready, open that exact reward dialog
  - If no reward is ready, jump to the rewards section and highlight the closest reward instead of only showing a toast
- **Check points**
  - Scroll to the top points balance card
  - Add a brief visual highlight so users can clearly see the selected store’s points balance
- **Address / location**
  - If the merchant has an address, add a “Get directions” link using a maps URL
- **Store details**
  - Keep the modal, but make it act as a secondary drill-down, not the only useful action

### 2. Add proper section targeting for the actions
Create in-page anchor refs for:
- points section
- rewards section
- offers section

Then wire the exclusive-box buttons to those refs so users land exactly where they expect.

### 3. Improve the reward guidance logic
Replace dead-end toasts with more helpful behavior:
- ready reward exists → open reward dialog
- no ready reward but rewards exist → jump to reward list and emphasize the nearest reward
- no rewards exist → show a clear store-specific empty state with “Check offers” or “Explore other stores”

### 4. Make reward CTAs semantically consistent
Refine reward card interactions so:
- the main card tap still opens details
- the “Claim Reward” button explicitly opens redemption flow
- button behavior is clear and not just visually decorative

### 5. Upgrade the selected-store panel design
Redesign the exclusive box to feel more like a premium loyalty card/store spotlight.

Recommended design direction based on similar loyalty/rewards apps:
- use a **merchant hero background** with:
  - merchant logo if available
  - reward/campaign image if available
  - otherwise an industry-based image fallback
- add a dark gradient overlay for readability
- place stats and quick actions on a lighter elevated content panel beneath the hero
- show:
  - store name
  - industry
  - address
  - points balance
  - next reward status
  - offers count
  - visits

### 6. Add a stronger visual hierarchy for the selected store
Recommended structure:

```text
[ Merchant image / branded hero ]
  Store name
  Industry + address
  “X points” + “Next reward in Y pts”

[ Quick actions ]
  View offers | Redeem reward | Check points | Get directions

[ Secondary content ]
  Closest reward
  Offer preview
  Store details link
```

### 7. Improve empty states inside the exclusive box
Add more polished states for:
- no merchant selected
- selected merchant has no rewards
- selected merchant has no offers
- selected merchant has low points and nothing redeemable yet

Use friendlier copy plus a clear next step:
- “Keep earning at this store to unlock your first reward”
- “No monthly offers live right now — check back soon”
- “You’re only X points away from your next reward”

### 8. Make the section visually richer without clutter
Recommended visual enhancements:
- background image with overlay instead of plain muted card
- floating accent shapes matching the project’s vibrant style
- pill badges for:
  - Ready to redeem
  - X pts to go
  - New offers
- subtle shadow and glow around the active store card
- optional industry tinting:
  - coffee → amber/orange
  - retail → blue/indigo
  - restaurant → emerald/teal

---

## Suggestions and recommendations from similar platforms

### Best-practice recommendations
- Keep the selected-store area focused on **one main next action**
  - If reward ready: make “Redeem reward” primary
  - If not ready: make “View progress” or “Earn more” primary
- Do not rely on toast messages for navigation
  - Users expect the screen to move or open something
- Show a **preview of one reward + one offer**
  - This makes the section feel alive
- Use merchant imagery carefully
  - one strong image is better than multiple competing visuals
- Keep actions above the fold on mobile
  - especially at the current narrow viewport

### My recommended final direction
The best version here is:
- a **compact merchant hero card**
- real action buttons that scroll/open the correct content
- one highlighted “closest reward”
- one mini offer preview
- maps link when address exists
- state-driven CTA logic

That will feel closer to polished loyalty apps and make the section both more useful and more attractive.

---

## Files to update
- `src/pages/AccessCard.tsx`
- possibly `src/lib/industryImages.ts` for stronger store/industry background fallbacks

---

## Technical notes
- No database changes are required.
- Existing merchant filtering logic can be reused.
- Existing reward modal and store details dialog can stay; they just need better action wiring.
- I will preserve the current store switcher analytics and extend behavior only at the UI interaction layer.
