

## Full Square POS Integration — Comprehensive Plan

### What Already Exists
- `pos_connections` table with RLS policies (merchant_id FK to merchants)
- `square-oauth-callback` edge function (OAuth initiate + token exchange)
- `pos-webhook` edge function (basic payment processing)
- `PosTab` component in Merchant Settings (connect/disconnect UI)
- All 3 Square secrets configured (SQUARE_APPLICATION_ID, SQUARE_APPLICATION_SECRET, SQUARE_ENVIRONMENT)

### What Needs to Change

---

### Phase 1: Database Migration

**Add `external_payment_id` to `transactions` table** for duplicate protection:
```sql
ALTER TABLE public.transactions
  ADD COLUMN external_payment_id text UNIQUE;
```

**Add `provider_account_id` to `pos_connections` table** for merchant matching by Square seller ID:
```sql
ALTER TABLE public.pos_connections
  ADD COLUMN provider_account_id text;
```

**Enable realtime on `transactions` and `customers` tables:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
```

---

### Phase 2: Rewrite `pos-webhook` Edge Function

Current issues:
- No duplicate protection (no `external_payment_id` check)
- No webhook signature validation
- Broken points update (calls non-existent `add_points_balance` RPC with fragile fallback)
- Handles `payment.completed` but user spec says `payment.updated` with status check

Changes:
1. Add Square webhook signature validation using HMAC-SHA256
2. Handle `payment.updated` events, only process when `payment.status === "COMPLETED"`
3. Check `external_payment_id` before inserting (skip if duplicate)
4. Match merchant by `provider_account_id` OR `location_id`
5. Match customer by: loyalty_card_number (from note/reference_id) → phone → email
6. Points calculation: `floor(purchase_amount)` (1 point per $1, as specified)
7. Fix points update: direct read-then-update instead of broken RPC
8. Always return HTTP 200 to Square (even on errors)
9. Store `external_payment_id` in transaction record

---

### Phase 3: Update `square-oauth-callback` Edge Function

Add: after token exchange, fetch Square merchant ID and store as `provider_account_id` in `pos_connections`. Also register the webhook URL with Square using the Webhooks API (or document manual setup).

---

### Phase 4: Enhanced POS Tab UI (`src/components/merchant/PosTab.tsx`)

Add to the connected state:
- Last transaction synced time (query latest transaction with source='square')
- "Reconnect Square" button (re-initiates OAuth)
- "Test Mode" section with a form to simulate a Square webhook event (loyalty_card_number + amount)

The test mode will call the `pos-webhook` edge function directly with a simulated payload.

---

### Phase 5: Merchant Dashboard Real-Time Updates (`src/pages/MerchantDashboard.tsx`)

Subscribe to Supabase realtime on `transactions` table filtered by `merchant_id`. When new transactions arrive, auto-refresh KPIs without page reload.

---

### Phase 6: Customer Dashboard Real-Time Updates (`src/pages/AccessCard.tsx`)

Subscribe to Supabase realtime on `transactions` table filtered by `customer_id` AND `customers` table for points_balance changes. Auto-refresh transaction list and points display.

---

### Technical Details

**Files modified:**
- `supabase/functions/pos-webhook/index.ts` — full rewrite with signature validation, duplicate protection, improved customer matching
- `supabase/functions/square-oauth-callback/index.ts` — add provider_account_id storage
- `src/components/merchant/PosTab.tsx` — add last sync time, reconnect button, test mode
- `src/pages/MerchantDashboard.tsx` — add realtime subscription for transactions
- `src/pages/AccessCard.tsx` — add realtime subscription for transactions + points

**New migration:** add `external_payment_id` (unique) to transactions, `provider_account_id` to pos_connections, enable realtime

**Nothing broken:**
- Manual "Add Points" flow preserved (uses existing RPC)
- Auth/session persistence unchanged
- All existing routes and navigation unchanged

