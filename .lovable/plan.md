

## Three fixes

### 1. Address autocomplete in signup forms
Currently `MerchantAuth.tsx` (and the merchant onboarding/settings address field) uses a plain `<Input>` with no suggestions. Customer signup has no address field, so this only applies to the **merchant** address field on `MerchantAuth.tsx` and `MerchantSettings.tsx` (Profile/Business tab).

**Approach** — build a small `AddressAutocomplete` component that:
- Wraps `<Input>` and shows a dropdown of suggestions below as the user types (debounced ~350ms, min 3 chars).
- Calls the existing `geocode-address` edge function, but extended to support a `suggest` mode that returns up to 5 Nominatim results (display_name + lat + lng) instead of just the first.
- On suggestion click: fills the input with `display_name` and emits `{ address, latitude, longitude }` to parent so the parent can store coords directly at signup time (no separate geocoding call needed).
- Uses Australia bias (`countrycodes=au`) + Nominatim's `addressdetails=1`.

**Files**
- `supabase/functions/geocode-address/index.ts` — accept optional `mode: "suggest"` returning an array of up to 5 results.
- `src/components/AddressAutocomplete.tsx` — new reusable component (debounced fetch, keyboard nav, click-outside to close).
- `src/pages/MerchantAuth.tsx` — replace the address `<Input>` with `<AddressAutocomplete>`. When a suggestion is picked, store the lat/lng in local state and write them into the `merchants` row right after signup (alongside the existing logo/address/phone update).
- `src/pages/MerchantSettings.tsx` — same swap on the address field; store lat/lng on save.

This solves a second latent bug too: it explains issue #3 (only Cafe Shop KK has coords because address is selected from suggestions → coords stored at registration time).

### 2. Redemptions section overlay issues
`MerchantRedemptions.tsx` renders fine on desktop but on smaller widths the verify form is `flex gap-3` with the `Input` and a fixed-width `Button` next to it — on narrow screens the button can clip the input, and the `verifyResult` panel + recent-redemption rows can overflow because of the long monospace code + status badge.

**Fixes inside `src/pages/MerchantRedemptions.tsx`**
- Verify form: switch the `flex gap-3` to `flex flex-col sm:flex-row gap-2 sm:gap-3` so on mobile the input and button stack instead of overlapping.
- Result card: add `break-words` to the success/error text so long error strings don't push the card outside its container.
- Recent redemptions row: change to `flex items-center justify-between gap-3` and wrap the meta line in `flex-wrap` so the code/points/date chips don't push the status badge offscreen. Also add `truncate` on `reward_title`.
- Wrap the badge container with `shrink-0` so it never gets compressed under the title.
- Header: also ensure `BackToDashboard` and the `Header` aren't double-padding the page on this route (already `pt-20 sm:pt-24` — leave as-is).

### 3. Hover map only shows on Cafe Shop KK
**Root cause confirmed via DB query**: only `Cafe Shop KK` has `latitude` + `longitude` populated. Leaf Cafe, Charlany Cafe, Kent Street Coffee and Cupcake all have `NULL` coordinates, so the hover map block (`{m.latitude != null && m.longitude != null && ...}`) is correctly skipped — the visual "nothing happens" is real, not a bug.

Two complementary fixes:

a. **Backfill geocodes for existing merchants** — one-shot edge function call: loop over all merchants where `latitude IS NULL` and address is set, call Nominatim, write back. Implemented as a new admin-only edge function `backfill-merchant-geocodes` triggered once by the maintainer, OR a tiny SQL+function script run from the migration tool.

b. **Always show *something* on hover** — even with no coordinates, hovering should show the address overlay so the UX is consistent across cards. Update the hover layer in `ExploreTab.tsx` Browse Merchants cards: when coords are missing, show an address chip + small "Map unavailable" hint instead of nothing.

c. Once fix #1 is in place, all *new* merchants will have coords from the day they sign up.

**Files**
- New `supabase/functions/backfill-merchant-geocodes/index.ts` (admin-gated, batches with 1s sleeps to respect Nominatim rate limit).
- `src/pages/AdminPanel.tsx` — add a small "Backfill merchant geocodes" button that invokes the new function (admin only).
- `src/components/customer/ExploreTab.tsx` — extend the hover overlay so cards without coords show the address instead of nothing.

## Validation
1. Sign up as a new merchant → start typing the address → suggestions appear → pick one → register → verify in DB that merchant row has lat/lng populated.
2. Run the backfill from Admin Panel → recheck DB → all four older merchants now have coords → hover any card on Explore → map preview animates in for every card.
3. Open `/merchant/redemptions` on mobile (982×696 and ≤640) → verify input/button stack cleanly, long error/title text wraps, status badge always visible.

## Files to change
- `supabase/functions/geocode-address/index.ts`
- `supabase/functions/backfill-merchant-geocodes/index.ts` (new)
- `src/components/AddressAutocomplete.tsx` (new)
- `src/pages/MerchantAuth.tsx`
- `src/pages/MerchantSettings.tsx`
- `src/pages/MerchantRedemptions.tsx`
- `src/pages/AdminPanel.tsx`
- `src/components/customer/ExploreTab.tsx`

No DB schema changes required.
