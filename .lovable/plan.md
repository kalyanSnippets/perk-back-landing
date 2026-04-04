

## Plan: Complete Redemption System

### Summary
Create a `redemptions` table, add "Redeem" buttons on customer reward cards that deduct points and generate one-time codes, show redemption history on the Access Card, and add a merchant-side verification/lookup flow.

---

### 1. Database Migration

**New table: `redemptions`**
```sql
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  merchant_id uuid NOT NULL,
  reward_id uuid NOT NULL,
  reward_title text NOT NULL,
  points_spent integer NOT NULL,
  redemption_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  redeemed_at timestamp with time zone,
  verified_at timestamp with time zone,
  verified_by uuid,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

**RLS policies:**
- Customers can SELECT own redemptions (`customer_id` matches via customers table)
- Customers can INSERT own redemptions (with check on customer_id)
- Merchants can SELECT redemptions for their merchant_id
- Merchants can UPDATE redemptions for their merchant_id (to verify/mark used)

**Database function: `redeem_reward`** (security definer)
- Validates customer has enough points
- Validates reward is active and exists
- Deducts points from `customers.points_balance`
- Generates a unique 8-char alphanumeric redemption code
- Inserts into `redemptions` with status `pending`, expires_at = now() + 48 hours
- Returns the redemption code and details
- Atomic — prevents double-spend via row-level locking

**Database function: `verify_redemption`** (security definer)
- Takes redemption_code, merchant_id
- Validates code exists, belongs to this merchant, status is `pending`, not expired
- Updates status to `verified`, sets verified_at and verified_by
- Returns customer name, reward title, points spent

---

### 2. Customer Side — Access Card (`src/pages/AccessCard.tsx`)

**Add "Redeem" button on reward cards:**
- Only visible when `progress >= 100` (customer has enough points)
- Button triggers `redeem_reward` RPC call
- On success: shows a modal/dialog with the redemption code in large text, a QR-style display, and "Show this to the merchant" instruction
- Points balance updates via existing realtime subscription

**Add new state:**
- `redemptions` array fetched from `redemptions` table
- `showRedemptionModal` with active redemption code details

**Add Redemption History section** (after Points Earned):
- Cards showing: reward title, merchant name, redemption code, status badge (pending/verified/expired), date
- Pending ones show the code prominently with "Show to merchant" prompt
- Verified ones show a green checkmark

---

### 3. Merchant Side — Verify Redemptions

**New page: `src/pages/MerchantRedemptions.tsx`**
- Input field for redemption code (or scan)
- "Verify" button calls `verify_redemption` RPC
- Shows result: customer name, reward, points, success/error
- Below: table of recent redemptions for this merchant (verified + pending)

**Dashboard integration:**
- Add a feature card on `MerchantDashboard.tsx` linking to `/merchant/redemptions`
- Add route in `App.tsx`

---

### 4. Files Changed

| File | Change |
|------|--------|
| Migration | Create `redemptions` table, RLS, `redeem_reward` + `verify_redemption` functions |
| `src/pages/AccessCard.tsx` | Add Redeem button, redemption modal, redemption history section |
| `src/pages/MerchantRedemptions.tsx` | New page: code verification + redemption list |
| `src/pages/MerchantDashboard.tsx` | Add Redemptions feature card |
| `src/App.tsx` | Add `/merchant/redemptions` route |

### What Stays Unchanged
- All existing reward/campaign/offer display
- Points earning flow and transaction history
- Loyalty card, barcode, wallet actions
- Merchant subscription gating
- Auth, routing, admin panel

