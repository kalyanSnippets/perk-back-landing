

## Plan: Refactor PerkBack to Multi-Merchant Architecture

### Current State Analysis

The existing system is **almost multi-merchant already** in many areas, but has one critical flaw: **the `customers.points_balance` is a single global number**, not per-merchant. Here is the full gap analysis:

**What already works for multi-merchant:**
- Transactions already have `merchant_id` -- correctly scoped
- Rewards, campaigns, monthly_offers all have `merchant_id` -- correctly scoped
- Merchant dashboard queries already filter by `merchant_id`
- RLS policies on merchant tables already scope to the owning merchant
- Redemptions already have `merchant_id`

**What breaks in multi-merchant:**
1. `customers.points_balance` is a **single global balance** -- should be per-merchant
2. The `sync_points_on_transaction` trigger adds points to this global balance
3. `redeem_reward` function deducts from the global balance
4. `add_points_to_customer` function reads/writes the global balance
5. Customer AccessCard page shows one total points balance instead of per-merchant balances
6. MerchantCustomers page reads from global `customers.points_balance`
7. No "My Stores" view for customers -- they see all rewards/campaigns from all merchants mixed together
8. No `customer_merchants` relationship table exists

---

### Phase 1: Database Schema Changes

**New table: `customer_merchants`**
```
customer_merchants
- id (uuid, PK)
- customer_id (uuid, NOT NULL)
- merchant_id (uuid, NOT NULL)
- points_balance (integer, default 0)
- total_spend (numeric, default 0)
- visit_count (integer, default 0)
- joined_at (timestamptz, default now())
- last_visit_at (timestamptz)
- UNIQUE(customer_id, merchant_id)
```

RLS policies:
- Customers can view their own records (customer_id matches auth user's customer record)
- Merchants can view records for their merchant_id
- Service role has full access

**Modify trigger: `sync_points_on_transaction`**
- Instead of updating `customers.points_balance`, update `customer_merchants.points_balance` for the specific merchant
- Also increment `visit_count`, update `total_spend`, and `last_visit_at`
- Auto-create the `customer_merchants` row if it doesn't exist (first transaction = auto-join)

**Modify function: `redeem_reward`**
- Deduct points from `customer_merchants.points_balance` (for the reward's merchant) instead of `customers.points_balance`

**Modify function: `add_points_to_customer`**
- No change needed -- it already inserts into transactions, and the trigger handles the rest

**Keep `customers.points_balance`** as a denormalized total (sum of all merchant balances) for backward compatibility, or deprecate it gradually. The trigger can update both.

---

### Phase 2: Customer App -- Multi-Store Experience

**Refactor `AccessCard.tsx` (the main customer page):**

Current: Shows one global points balance, all rewards/campaigns mixed from all merchants.

New structure:
- **"My Stores" section** at the top showing cards for each merchant the customer has a relationship with (from `customer_merchants`)
- Each store card shows: store name, merchant-specific points balance, last visit
- Tapping a store card expands/navigates to that merchant's detail view showing:
  - Merchant-specific loyalty card (same barcode, but context is per-merchant)
  - Merchant-specific points balance
  - That merchant's rewards (with Redeem buttons)
  - That merchant's campaigns
  - That merchant's monthly offers
  - Transaction history filtered to that merchant
- Keep the overall greeting and global loyalty card number at the top
- Rewards "Redeem" button checks `customer_merchants.points_balance` for that merchant

**No changes to:**
- Loyalty card number generation (stays global -- one card number per customer)
- Authentication flow
- Customer confirmation page

---

### Phase 3: Merchant Dashboard Isolation

**Already correct:** Most merchant pages already query by `merchant_id`. Minor fixes needed:

- **MerchantCustomers page**: Currently reads `customers.points_balance` (global). Must read from `customer_merchants.points_balance` instead, showing only customers who have a relationship with this merchant.
- **MerchantDashboard KPIs**: `totalCustomers` currently counts distinct `customer_id` from transactions. Can also use `customer_merchants` count. Both work.
- **All other merchant pages** (campaigns, rewards, analytics, etc.): Already correctly scoped by `merchant_id`. No changes needed.

---

### Phase 4: Admin Layer

**Already exists** with UsersTab, SubscriptionsTab, blog/testimonial management.

**Enhancements:**
- Add a "Merchants" overview tab showing all merchants with customer counts, transaction volumes, plan status (partially exists in SubscriptionsTab already)
- Add ability to view platform-wide stats: total customers, total merchants, total transactions
- No structural changes needed -- just additive UI in AdminPanel

---

### Phase 5: Security / RLS

**New RLS on `customer_merchants`:**
- Customer SELECT: `customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())`
- Merchant SELECT: `merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())`
- INSERT/UPDATE: service role only (managed by triggers/functions)

**Existing RLS is already correct** for all other tables -- campaigns, rewards, transactions, etc. are already merchant-scoped.

---

### Files Changed Summary

| Area | File/Table | Change |
|------|-----------|--------|
| **Database** | New migration | Create `customer_merchants` table with RLS |
| **Database** | New migration | Update `sync_points_on_transaction` trigger to write to `customer_merchants` |
| **Database** | New migration | Update `redeem_reward` function to use per-merchant balance |
| **Database** | New migration | Backfill `customer_merchants` from existing transactions data |
| **Frontend** | `src/pages/AccessCard.tsx` | Add "My Stores" view, per-merchant points/rewards/campaigns |
| **Frontend** | `src/pages/MerchantCustomers.tsx` | Read points from `customer_merchants` instead of `customers` |
| **Frontend** | `src/pages/AdminPanel.tsx` | Add platform-wide stats section |
| **Frontend** | `src/integrations/supabase/types.ts` | Auto-updated after migration |

### What stays exactly the same
- All merchant dashboard pages (already scoped)
- Authentication flow
- Plan gating logic
- Subscription management
- POS integration
- All UI components and design
- Header, navigation, routing
- Customer card generation flow

### Migration Safety
- A backfill migration will populate `customer_merchants` from existing transaction data, calculating points per merchant from transaction history
- The global `customers.points_balance` stays as a convenience field (updated alongside)
- Zero downtime -- additive changes only

