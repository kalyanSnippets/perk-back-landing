
Polish the loyalty card rendering and harden the merchant join flow so both feel reliable and premium on mobile.

### 1. Fix the loyalty card visual quality
Refine `src/components/customer/LoyaltyCardFlip.tsx`, `src/components/Barcode.tsx`, and `src/components/QRCodeDisplay.tsx` so the card looks crisp instead of soft or blurred.

What to fix:
- remove visually blurry barcode/QR presentation caused by transparent backgrounds and SVG scaling inside soft containers
- replace tiny low-contrast copy on the card back with cleaner wording
- improve the card proportions and spacing so it reads like a real loyalty card, not a panel

Recommended implementation:
- give the barcode and QR code solid white surfaces instead of transparent rendering
- set explicit SVG dimensions / classes so barcode and QR render at native size without browser scaling blur
- tighten front-side typography:
  - reduce excessive letter spacing on the card number
  - prevent cramped text blocks
  - improve contrast on labels
- update back-side copy to something clearer, e.g.:
  - eyebrow: `Use at checkout`
  - title: `Scan your loyalty ID`
  - helper: `Present this code or barcode to earn points in store`
- keep the flip interaction, but make the back layout cleaner:
  - barcode first
  - QR secondary
  - concise footer with name + issued date

### 2. Make the card back feel intentional, not duplicated
The current back side repeats “Scan to identify” and feels generic.

What to change:
- remove duplicate helper wording beneath the QR if the screen already says it above
- treat barcode as the primary checkout identifier
- make QR the secondary fast-scan option
- keep only one supporting message

Recommended card-back structure:
```text
Use at checkout
Scan your loyalty ID

[ Barcode panel ]
[ QR panel ]

Present this at participating stores
Issued date • member name
```

### 3. Fix the Explore join-store logic in the dashboard
The existing backend function already exists (`join_merchant`), so the main work is making the frontend flow robust and obvious.

Likely issue in current dashboard flow:
- the join action depends on a refetch to refresh membership state
- after join, the UI switches tabs but does not guarantee a clean “joined store” state transition
- loading/error handling is minimal, so failed joins are hard to diagnose in the UI

What to build:
- add an explicit join flow in `src/pages/AccessCard.tsx` and `src/components/customer/StoreDetailView.tsx`
- when user taps Join Store:
  - disable the button immediately
  - call `join_merchant`
  - update local joined-store state optimistically
  - keep the selected store open
  - switch the store detail into joined mode without making the user reopen it
  - then optionally move the user into Rewards context after success

Recommended behavior after success:
- stay on the same store detail screen
- replace the join prompt with:
  - points
  - rewards
  - offers
  - gamification / progress (if enabled)
- show a success toast like:
  - `You joined {store_name}`

### 4. Harden join-state detection before and after RPC
Make sure the UI correctly knows whether the customer is already joined.

Implementation details:
- derive `isJoined` from `customerMerchants` as today, but also introduce a temporary local joined override immediately after a successful join
- avoid waiting only on `fetchData()` to change the UI
- preserve selected merchant id when refetching
- if the RPC returns success but the relationship already existed, treat it as success and update the UI the same way

Recommended state additions in `AccessCard.tsx`:
- a local set/map for merchants joined in-session
- a dedicated success path that:
  - marks merchant joined locally
  - refreshes customer + merchant relationship data
  - keeps `activeStoreViewMerchantId` unchanged

### 5. Improve error handling for join-store failures
Make join failures visible and actionable.

What to add:
- better parsing of RPC response errors
- clearer messages for:
  - not authenticated
  - customer profile missing
  - merchant not found
  - generic join failure
- a fallback retry action in the join section if needed

Recommended user-facing copy:
- `Please sign in to join this store.`
- `We couldn’t link your loyalty profile yet. Please try again.`
- `This store is unavailable right now.`

### 6. Fix the QR poster / slug-based join flow so failures aren’t hidden
The QR entry flow in `src/pages/CustomerJoin.tsx` has a reliability problem: it navigates away in `finally`, which can hide actual link failures.

What to change:
- do not redirect to `/customer/access-card` unconditionally in the auto-link effect
- only redirect after confirmed success
- if linking fails:
  - keep the user on the join screen
  - show the error
  - offer retry / sign-in / continue options
- if already linked, treat it as success and continue

Recommended improvement:
- extract a shared `linkCustomerToMerchant` helper used by:
  - `CustomerJoin.tsx`
  - dashboard Explore join flow
- normalize success/error handling across both entry points

### 7. Add a simple join-flow wireframe in the implementation
Use the following flow as the target UX:

```text
Explore
  -> Open store detail
      -> If not joined:
         [Hero]
         [Join Store CTA]
         [Preview of rewards/offers]
      -> Tap Join Store
         [Joining...]
      -> Success
         [Same store detail stays open]
         [Points / rewards / offers now visible]
         [Back returns to Explore]
```

QR / poster flow:
```text
Poster QR
  -> Join landing
  -> Sign in / create wallet
  -> Link to merchant
  -> Success screen
  -> Open Access Card
```

### 8. Files to update
Frontend:
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/components/Barcode.tsx`
- `src/components/QRCodeDisplay.tsx`
- `src/pages/AccessCard.tsx`
- `src/components/customer/StoreDetailView.tsx`
- `src/pages/CustomerJoin.tsx`

Optional shared helper:
- new shared utility for merchant-linking flow if needed, e.g. `src/lib/customerMerchantJoin.ts`

### 9. Technical notes
- no new database migration is required because `join_merchant` and `join_merchant_by_slug` already exist
- the main fixes are frontend state handling, redirect logic, and clearer UI states
- keep auth/session behavior unchanged
- preserve the existing in-dashboard shared store detail flow

### 10. Expected final result
After this pass:
- the loyalty card will render sharply with cleaner wording and a more premium feel
- the back of the card will look intentional and readable
- joining a merchant from Explore will work reliably and update the store page immediately
- joining from QR/slug flow will no longer hide failures behind an automatic redirect
