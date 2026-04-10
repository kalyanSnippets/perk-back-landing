

## Combined Plan: Dashboard Consolidation + Digital Receipts + Product Offers + Performance & Security

This plan merges two previously approved plans into a single implementation pass.

---

### Part 1: Merchant Dashboard Consolidation

Reduce 13+ nav items to **5 unified sections** with internal tabs.

```text
BEFORE (13 items)                  AFTER (5 items)
──────────────────                 ─────────────────
Dashboard                    →    Dashboard (KPIs + Add Points)
Customers                    →    Customers
Transactions                 →    Insights (Transactions | Analytics | Reports | Redemptions)
Campaigns                    →    Marketing (Campaigns | Promotions | Rewards | Offers | Birthday | Monthly | AI | Product Offers)
Rewards                      →    Settings (Business | Profile | Password | POS | NFC | Subscription | Gamification)
Analytics / AI / Gamification
Promotions / Birthday / Monthly
POS / Reports / Redemptions
Settings
```

**Changes:**
- `MerchantNav.tsx` — reduce to 5 items: Dashboard, Customers, Insights, Marketing, Settings
- New `MerchantInsights.tsx` — tabs composing content extracted from Transactions, Analytics, Reports, Redemptions pages
- New `MerchantMarketing.tsx` — tabs composing content from Campaigns, Promotions, Rewards, Birthday/Monthly Offers, AI Suggestions, plus new Product Offers tab
- Update `MerchantSettings.tsx` — add Gamification and NFC tabs alongside existing Business/Profile/Password/POS/Subscription
- Update `App.tsx` — add new consolidated routes, redirect old routes to new ones
- Simplify `MerchantDashboard.tsx` — remove feature cards that now live under tabs

---

### Part 2: Digital Receipt Storage

**Database:** New `receipt_items` table

| Column | Type |
|--------|------|
| id | uuid PK |
| transaction_id | uuid FK → transactions |
| item_name | text |
| quantity | integer (default 1) |
| unit_price | numeric |
| total_price | numeric |
| sku | text (nullable) |
| category | text (nullable) |
| created_at | timestamptz |

**RLS:** Customers SELECT via transaction ownership, merchants INSERT/SELECT own.

**UI:** New `ReceiptDetail.tsx` dialog — customers tap a transaction to see itemized receipt. Integrated into `AccessCard.tsx` transaction history.

---

### Part 3: Product/SKU-Level Offers

**Database:** New `product_offers` table

| Column | Type |
|--------|------|
| id | uuid PK |
| merchant_id | uuid |
| product_name | text |
| sku | text (nullable) |
| category | text (nullable) |
| discount_type | text ('percent', 'fixed', 'bogo') |
| discount_value | numeric |
| description | text (nullable) |
| active | boolean (default true) |
| valid_from | timestamptz (nullable) |
| valid_to | timestamptz (nullable) |
| created_at, updated_at | timestamptz |

**RLS:** Merchants ALL own, authenticated SELECT active.

**UI:** New `ProductOffersTab.tsx` inside Marketing consolidated page. Customer Access Card shows product offers in promo carousel.

**Feature catalog:** Add `product_offers` key at Growth tier.

---

### Part 4: Security Hardening

1. **Merchants table SELECT policy** — Replace `USING (true)` with a security-definer function `safe_merchant_public_info()` that only exposes `id`, `store_name`, `logo_url`, `industry_type`, `latitude`, `longitude`. Owner policy unchanged.

2. **Storage bucket path enforcement** — Add `(storage.foldername(name))[1] = auth.uid()::text` to INSERT/UPDATE policies on `profile-images`. Add scoped DELETE policy.

3. **Realtime publication cleanup** — Remove `customers`, `transactions`, `redemptions`, `customer_stamps` from `supabase_realtime` publication (not actively used for realtime).

4. **Storage DELETE policy** — Add owner-scoped DELETE for `profile-images` bucket.

---

### Part 5: Performance Optimization

1. **Database indexes** — Add composite indexes:
   - `transactions(merchant_id, transaction_date)`
   - `transactions(customer_id)`
   - `customer_merchants(customer_id)`
   - `customer_stamps(customer_id, completed)`
   - `redemptions(customer_id, status)`

2. **Lazy-load routes** — Use `React.lazy()` + `Suspense` in `App.tsx` for merchant and admin pages to reduce initial bundle.

3. **Parallelize queries** — Refactor `MerchantDashboard.tsx` and `AccessCard.tsx` to use `Promise.all` / React Query for parallel data fetching instead of sequential waterfalls.

4. **Auth context cleanup** — Remove redundant `getUser()` calls in individual pages; standardize on `useAuth()` context.

---

### Files Changed Summary

| File | Change |
|------|--------|
| **DB migration** | Create `receipt_items`, `product_offers` tables + RLS + indexes |
| **DB migration** | Fix merchants SELECT policy, storage policies, remove Realtime tables |
| **DB migration** | Create `safe_merchant_public_info` function |
| `src/pages/MerchantInsights.tsx` | **New** — consolidated Transactions/Analytics/Reports/Redemptions |
| `src/pages/MerchantMarketing.tsx` | **New** — consolidated Campaigns/Promotions/Rewards/Offers/Birthday/Monthly/AI/ProductOffers |
| `src/components/merchant/ProductOffersTab.tsx` | **New** — product-level offers CRUD |
| `src/components/customer/ReceiptDetail.tsx` | **New** — itemized receipt dialog |
| `src/components/merchant/MerchantNav.tsx` | Reduce to 5 nav items |
| `src/pages/MerchantSettings.tsx` | Add Gamification + NFC tabs |
| `src/pages/MerchantDashboard.tsx` | Simplify cards, parallelize queries, remove redundant auth calls |
| `src/pages/AccessCard.tsx` | Add receipt viewing, product offers, extract sub-components, parallelize queries |
| `src/App.tsx` | Lazy-load routes, add consolidated routes, redirect old ones |
| `src/lib/features.ts` | Add `product_offers` feature key |

### What Stays the Same
- All existing data, loyalty logic, and points system
- Authentication flows and subscription gating
- Customer stamp cards, NFC tap, QR scanning
- POS integration logic
- Admin panel

