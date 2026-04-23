
Refine the customer access card experience across the card, explore flow, and profile tab so it feels cleaner, simpler, and closer to the shared mobile reference.

### What to change

### 1. Fix the loyalty card front layout
Update `src/components/customer/LoyaltyCardFlip.tsx` so the points section no longer competes with the logo.

What to adjust:
- restructure the front face into a stricter vertical layout:
  - eyebrow
  - logo
  - points value
  - points label directly under the points value
  - member details
  - card number
- reduce the visual height taken by the logo block
- add a clear spacing gap between logo and points block
- keep the card premium, but remove any layout choices that let the logo overlap or visually crowd the points content

Result:
- points and points label read clearly
- front face feels aligned and intentional
- layout matches the cleaner digital-card look you want

### 2. Remove duplicate copy actions and simplify card actions
Right now copy actions appear both inside the flip card and again below it.

Update:
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/pages/AccessCard.tsx`

What to change:
- remove the inline action row from `LoyaltyCardFlip.tsx` entirely
- keep only one simplified copy action in the card tab action panel below the card
- keep Share and wallet actions grouped cleanly below the card
- if useful, rename the surviving button more clearly, such as “Copy card number”

Result:
- no repeated copy controls
- cleaner card tab
- one obvious place for card actions

### 3. Fix scroll position when opening a store from Explore
The current store open flow changes internal state but does not reset scroll, so the user can land midway down the page.

Update `src/pages/AccessCard.tsx`:
- add an explicit scroll reset inside `openStoreView`
- scroll to the top immediately after switching into the store detail state
- also reset scroll when closing the store detail if needed so returning to Explore/Rewards feels stable

Recommended behavior:
```text
Open store -> page scrolls to top
Back to Explore/Rewards -> page scrolls to top
```

Result:
- store detail always opens from the beginning
- no landing in the middle or bottom of the page
- navigation feels deliberate on mobile

### 4. Redesign the profile tab to match the shared reference
Rebuild the profile section in `src/pages/AccessCard.tsx` so it follows the visual structure from the uploaded screenshot instead of the current utility-style cards.

### New profile structure
Use a top summary card, then grouped settings sections.

#### A. Header summary card
Create a blue profile summary card with:
- initials/avatar circle on the left
- customer full name
- member since month/year
- CRN on the same metadata line
- a bottom stat row for:
  - points
  - cards
  - visits

Notes:
- points can come from `customer.points_balance`
- cards can be a simple derived count based on joined merchants or a safe MVP count
- visits can use a derived total from `customerMerchants`

#### B. Simplified grouped list sections
Replace the current:
- Profile info card
- Account settings card
- Pages card

With grouped rows closer to the reference, such as:

```text
PERSONAL DETAILS
- Name & email
- Date of birth
- Saved addresses

WALLET & PAYMENTS
- Linked wallets
- Gift cards

PREFERENCES
- Notifications
- Birthday perks
```

Implementation approach:
- use reusable row styling with icon, title, right-side value, and chevron/toggle
- populate with real available customer data where it exists
- use safe placeholder/future-ready values only where the app does not yet support a full detail screen
- keep the options visually simplified even if some are non-editable for now

#### C. Logout button anchored at the bottom
Move logout out of the middle of the settings content and place it at the bottom of the profile tab.

What to do:
- keep the destructive delete-account action separate and lower priority
- place “Log out” as the final main action at the bottom of the profile page
- ensure spacing makes it feel detached from normal settings rows

Result:
- profile feels like a proper mobile account screen
- options are simplified and easier to scan
- logout is where users expect it

### Files to update
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/pages/AccessCard.tsx`

### Expected result
After this pass:
- the points label will sit properly under the points value
- duplicate copy controls will be removed
- opening a store from Explore will always start at the top of the page
- the profile section will look much closer to the shared design
- logout will appear at the bottom instead of mixed into the settings cards

### Technical notes
- `ScrollToTop.tsx` already handles route changes, but the Explore/store-detail issue is state-driven inside `AccessCard.tsx`, so the fix belongs in the local `openStoreView` / `closeStoreView` handlers.
- The current profile tab is built directly inside `AccessCard.tsx`; this redesign can either stay inline or be extracted into smaller presentational subcomponents if the file needs cleanup.
- The customer table already exposes fields like `full_name`, `phone`, and `date_of_birth`, so the redesigned profile can use real account data without backend changes.
