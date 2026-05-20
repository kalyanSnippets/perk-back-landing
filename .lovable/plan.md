# Merchant-specific loyalty backend — audit & migration plan

## Good news: most of this already exists

After auditing the current Supabase schema, **the backend is already merchant-scoped**. Customer loyalty is not on a global points balance — it's already tracked per merchant in `customer_merchants`, and `sync_points_on_transaction` already routes points into that per-merchant row. The customer global `points_balance` on `customers` is only kept as a backward-compat mirror.

Here is what's already in place vs. what's missing.

## What already exists (no work needed)

- **`customer_merchants`** — has `id`, `customer_id`, `merchant_id`, `points_balance`, `visit_count`, `total_spend`, `joined_at`, `last_visit_at`, `created_at`, `updated_at`, `source`. ✓
- **`rewards`** — merchant-scoped via `merchant_id`, RLS restricts customer reads to merchants they've joined. ✓
- **`campaigns`** — merchant-scoped, RLS restricts customer reads to joined merchants. ✓
- **`redemptions`** — has `customer_id`, `merchant_id`, `reward_id`, `redemption_code`, `reward_title`, `points_spent`, `status`, `expires_at`, `redeemed_at`, `created_at`. ✓
- **`transactions`** — has `merchant_id`, `points_awarded`, `purchase_amount`, `transaction_date`, `refunded_at`, `source`. ✓
- **`customer_stamps`** — has `customer_id`, `merchant_id`, stamp progress, completion, reward text. ✓ (uses `stamps_collected` / `stamps_required` / `reward_text` instead of the names in your spec — see Decision 1).
- **RPCs already deployed**:
  - `join_merchant(_merchant_id, _source)` ✓
  - `join_merchant_by_slug(_slug, _source)` ✓ (creates `customer_merchants` row, generates CRN/card number)
  - `redeem_reward` — deducts from per-merchant balance ✓
  - `process_stamp` — per-merchant stamp progression ✓
  - `refund_transaction` — reverses per-merchant points ✓
  - `add_points_to_customer` — awards via transaction insert ✓
  - `verify_redemption`, `search_customer_*` ✓
- **Trigger `sync_points_on_transaction`** — already updates `customer_merchants.points_balance` as the source of truth on every transaction. ✓
- **RLS** — already matches the spec: customers read only their own `customer_merchants` / `customer_stamps` / `redemptions` / `transactions`, and only rewards/campaigns/monthly offers/promotions for merchants they've joined; merchants manage only their own data. ✓

## Gaps to close (the only real migration work)

Two small additive changes:

### Gap 1 — `campaigns` missing scheduling columns
The current `campaigns` table has no `starts_at` / `ends_at`. Add them as nullable timestamps so existing rows stay valid. The customer-visible RLS already filters on `active = true`; merchants can use these new fields to schedule.

### Gap 2 — Stamp card naming alignment (decision needed)
Your spec asks for `stamps_count`, `total_stamps`, `reward_name`. The table has `stamps_collected`, `stamps_required`, `reward_text` — semantically identical but different names. See Decision 1 below.

## Decisions I need from you

1. **Stamp card column names** — keep current `stamps_collected` / `stamps_required` / `reward_text` (no app code changes, no risk), **or** rename to `stamps_count` / `total_stamps` / `reward_name` (matches your spec but requires touching `process_stamp`, `refund_transaction`, and several frontend components). Recommend keeping current names.

2. **Global `customers.points_balance`** — currently mirrored by `sync_points_on_transaction`, `redeem_reward`, `refund_transaction`, and `process_stamp` for backward compat. Options:
   - (a) **Leave as-is** as a lifetime/summary mirror (zero risk).
   - (b) **Stop writing to it** going forward (functions updated, column kept).
   - (c) **Drop the column** (requires auditing frontend usage first).
   Recommend (a) or (b).

## Proposed migration (after you confirm)

```sql
-- Gap 1: campaign scheduling
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at   timestamptz;

-- (Optional Gap 2) Stamp column rename — only if you choose to rename
-- ALTER TABLE public.customer_stamps RENAME COLUMN stamps_collected TO stamps_count;
-- ALTER TABLE public.customer_stamps RENAME COLUMN stamps_required  TO total_stamps;
-- ALTER TABLE public.customer_stamps RENAME COLUMN reward_text      TO reward_name;
-- + update process_stamp(), refund_transaction(), and frontend references.

-- (Optional Decision 2b) Stop mirroring to customers.points_balance
-- Update sync_points_on_transaction, redeem_reward, refund_transaction,
-- process_stamp to remove the UPDATE public.customers ... lines.
```

## Summary

There is **no large backend migration needed** — the merchant-scoped model is already live. Please pick options for Decisions 1 and 2 and I'll run a small migration covering just the campaign scheduling columns (and any rename / cleanup you approve).
