

## Root cause

When a user signs up via `MerchantAuth.tsx` (or originally as a customer), our `handle_new_user` trigger **always creates a customer record AND a merchant record under the same `auth.users` row** (one user_id powers both). So the "merchant account" and "customer account" are not two separate accounts — they share one login.

When you used the in-app "Delete Account" flow, our `delete-user-account` edge function correctly removed:
- the merchants row
- the customers row
- all related data
- the auth.users row

That single deletion wiped the entire login. The "merchant account" you expected to keep no longer exists, which is why login returns "Invalid credentials".

DB confirms it:
- `madurikalyan@gmail.com` — completely gone from auth.users (cannot log in, as expected).
- `madurikalyan27@gmail.com` — exists, owns merchant "Cafe Shop KK", can log in normally.
- No orphaned merchant rows exist for the deleted user.

So the data is consistent — but the UX is wrong. The dialog let a customer delete their account without warning that **the merchant side will also be deleted** (and vice versa).

## The fix

Make deletion role-aware so users keep the side they want to keep.

### 1. Edge function — `supabase/functions/delete-user-account/index.ts`
Accept an optional `scope` param: `"all" | "customer_only" | "merchant_only"`.
- `customer_only`: delete `customers` + customer-side related rows. Do NOT delete `auth.users` if a merchant record still exists.
- `merchant_only`: delete `merchants` + merchant-side related rows. Do NOT delete `auth.users` if a customer record still exists.
- `all` (default): current behavior — full purge including auth.users.

### 2. Dialog — `src/components/DeleteAccountDialog.tsx`
Add a new Step 1 question when the user has both roles:
> "You have both a customer profile and a merchant store under this login. What would you like to delete?"
> - Just my customer profile (keep merchant store)
> - Just my merchant store (keep customer profile)
> - Delete everything and close my account

Pass the chosen scope to the edge function.
- If scope is partial → show success toast, refresh the page (no signout needed).
- If scope is `all` → keep current behavior (local signout + redirect home).

If the user only has one role, skip this step and behave exactly like today.

### 3. Trigger entry points
- `MerchantSettings.tsx` → defaults the dialog to "merchant context" (preselects "Just my merchant store").
- `AccessCard.tsx` (customer) → defaults to "customer context" (preselects "Just my customer profile").
- User can still escalate to "delete everything".

### 4. UX copy update
Step 2 and 3 wording dynamically reflects scope:
- "merchant only" → warns about losing store, customers, subscription, transaction history.
- "customer only" → warns about losing points, rewards, redemption history.
- "all" → current full warning + mentions login will be permanently removed.

### What you should do right now to recover the lost merchant account
The auth user `madurikalyan@gmail.com` was fully deleted, so that login cannot be restored. You'll need to re-register the merchant with that email (or use `madurikalyan27@gmail.com` which is still active and owns "Cafe Shop KK").

### Files to change
- `supabase/functions/delete-user-account/index.ts` — add `scope` handling, conditional auth.users deletion.
- `src/components/DeleteAccountDialog.tsx` — add scope selector step + dynamic copy + post-deletion behavior branch.
- `src/pages/MerchantSettings.tsx` — pass `defaultScope="merchant_only"`.
- `src/pages/AccessCard.tsx` — pass `defaultScope="customer_only"`.

No DB schema or migration changes required.

