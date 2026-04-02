

## Plan: Merchant Subscription Tiers with Feature Access Control

### Summary
Add `merchant_subscriptions` and `merchant_feature_overrides` tables, a centralized feature-gating hook, plan-locked UI across the merchant dashboard, and an admin Subscriptions tab for plan management.

---

### 1. Database Migration

**New table: `merchant_subscriptions`**
```sql
CREATE TABLE public.merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  current_plan text NOT NULL DEFAULT 'free' CHECK (current_plan IN ('free','growth','pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','cancelled','expired')),
  billing_cycle text CHECK (billing_cycle IN ('monthly','yearly')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: merchants SELECT own record; admins full access via `has_role`; service role full access.

**New table: `merchant_feature_overrides`**
```sql
CREATE TABLE public.merchant_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  allow_campaigns boolean NOT NULL DEFAULT false,
  allow_rewards boolean NOT NULL DEFAULT false,
  allow_analytics boolean NOT NULL DEFAULT false,
  allow_ai_suggestions boolean NOT NULL DEFAULT false,
  allow_pos_integration boolean NOT NULL DEFAULT false,
  allow_advanced_reports boolean NOT NULL DEFAULT false,
  allow_gamification boolean NOT NULL DEFAULT false,
  allow_birthday_offers boolean NOT NULL DEFAULT false,
  allow_monthly_offers boolean NOT NULL DEFAULT false,
  allow_priority_support boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: merchants SELECT own; admins full access; service role full access.

**Trigger:** Auto-create a `merchant_subscriptions` row (free/active) when a new merchant is inserted via a trigger on `merchants`.

**Admin RPC:** `admin_get_all_merchants_with_plans()` — security definer function returning merchant info + subscription + customer count for the admin panel.

---

### 2. Feature Access System

**New file: `src/lib/features.ts`**
- Define `FEATURE_CATALOG` mapping each feature key to its minimum plan (`free`, `growth`, `pro`), display name, and upgrade description.
- Features: `dashboard`, `customers`, `loyalty_cards`, `transactions`, `settings`, `add_points` (free); `campaigns`, `rewards`, `analytics`, `ai_suggestions`, `unlimited_customers` (growth); `pos_integration`, `advanced_reports`, `gamification`, `birthday_offers`, `monthly_offers`, `priority_support` (pro).
- Export `hasFeatureAccess(plan, featureKey, overrides?)` pure function.
- Export `getRequiredPlan(featureKey)` helper.
- Export `CUSTOMER_LIMIT = { free: 50, growth: Infinity, pro: Infinity }`.

**New hook: `src/hooks/useMerchantSubscription.ts`**
- Fetches `merchant_subscriptions` + `merchant_feature_overrides` for the current merchant.
- Returns `{ plan, status, canAccess(featureKey), customerLimit, loading, subscription, overrides }`.
- Caches in React Query.

---

### 3. Reusable Locked Feature Components

**New file: `src/components/merchant/LockedFeature.tsx`**
- Full-page locked screen: icon, title, description, required plan badge, benefit text, "Upgrade to {Plan}" / "Contact Admin" CTA button.

**New file: `src/components/merchant/LockedWidget.tsx`**
- Card-sized locked state with blur overlay, lock icon, plan badge, short CTA.

**New file: `src/components/merchant/PlanBadge.tsx`**
- Small badge showing current plan + status (e.g., "Growth · Active", "Free · Trial").

**New file: `src/components/merchant/UpgradeBanner.tsx`**
- Contextual banner for Free/Growth merchants with plan-specific messaging and upgrade CTA.

**New file: `src/components/merchant/CustomerLimitBanner.tsx`**
- Warning banner when Free merchant is at/near 50 customer limit.

---

### 4. Merchant Dashboard Updates

**`src/pages/MerchantDashboard.tsx`**
- Use `useMerchantSubscription` hook.
- Show `PlanBadge` next to store name.
- Show `UpgradeBanner` for Free/Growth merchants.
- Show `CustomerLimitBanner` when Free plan at limit.
- Add Growth-tier widget teasers (Campaign Performance, Analytics, AI Suggestions) as `LockedWidget` cards for Free merchants.
- Add Pro-tier widget teasers (Gamification, Birthday Insights, POS Status) as `LockedWidget` cards for Free/Growth merchants.
- Existing KPI cards and Add Points flow remain unchanged.

**`src/pages/MerchantSettings.tsx`**
- Add "Subscription" tab showing current plan, features included/locked, status, trial info, and "Request Upgrade" / "Contact Admin" CTA.
- POS tab: gate behind `canAccess('pos_integration')` — show `LockedFeature` if Pro not available.

---

### 5. Merchant Sidebar Navigation

**New file: `src/components/merchant/MerchantSidebar.tsx`**
- Not a full sidebar redesign — add a navigation section within the existing dashboard layout.
- Quick action buttons updated: locked features show lock icon + disabled state.
- Navigation items grouped: Always (Dashboard, Customers, Transactions, Settings), Growth+ (Campaigns, Rewards, Analytics), Pro (Gamification, Offers, POS, Reports).
- Locked items visible but disabled with lock icon and tooltip showing required plan.

---

### 6. Admin Panel — Subscriptions Tab

**`src/pages/AdminPanel.tsx`**
- Add 5th tab: "Subscriptions" with a `SubscriptionsTab` component.

**New file: `src/components/admin/SubscriptionsTab.tsx`**
- Table: Merchant Name, Email, Current Plan, Status, Customer Count, Trial End, Actions.
- Search/filter by plan and status.
- Actions per merchant:
  - Change Plan dropdown (Free/Growth/Pro)
  - Toggle trial on/off (sets trial dates)
  - Cancel/Reactivate subscription
  - Feature Overrides dialog — toggle individual feature flags.
- All changes via direct Supabase updates (admin RLS policies allow it).
- Plan changes apply immediately.

---

### 7. Route Protection by Plan

**`src/components/ProtectedRoute.tsx`**
- No changes needed — plan gating is handled at the page/component level, not route level.
- Each merchant page checks `canAccess()` and shows `LockedFeature` inline rather than redirecting.

---

### Files Changed/Created

| File | Action |
|------|--------|
| New migration | `merchant_subscriptions`, `merchant_feature_overrides`, auto-create trigger, admin RPC |
| `src/lib/features.ts` | New — feature catalog + access logic |
| `src/hooks/useMerchantSubscription.ts` | New — hook for plan/access state |
| `src/components/merchant/LockedFeature.tsx` | New — full-page locked screen |
| `src/components/merchant/LockedWidget.tsx` | New — card locked state |
| `src/components/merchant/PlanBadge.tsx` | New — plan + status badge |
| `src/components/merchant/UpgradeBanner.tsx` | New — contextual upgrade banner |
| `src/components/merchant/CustomerLimitBanner.tsx` | New — 50 customer limit warning |
| `src/components/admin/SubscriptionsTab.tsx` | New — admin merchant plan management |
| `src/pages/MerchantDashboard.tsx` | Add plan badge, banners, locked widgets |
| `src/pages/MerchantSettings.tsx` | Add Subscription tab, gate POS tab by plan |
| `src/pages/AdminPanel.tsx` | Add Subscriptions tab |

### What Stays Unchanged
- Pricing page — untouched
- Customer flows — untouched
- Auth/session/routing — untouched
- Manual Add Points — always available (Free tier)
- Existing KPI cards, transactions page, header, footer
- All existing data preserved on downgrade (hidden, not deleted)

