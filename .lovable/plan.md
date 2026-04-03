

## Plan: Complete Plan-Based Feature Access System

### What Already Exists (No Rebuild Needed)
- **Phase 1** (DB): `merchant_subscriptions` + `merchant_feature_overrides` tables, auto-create trigger, RLS policies
- **Phase 2** (Access helper): `src/lib/features.ts` with `hasFeatureAccess()`, `FEATURE_CATALOG`, `CUSTOMER_LIMIT`
- **Phase 2** (Hook): `useMerchantSubscription` returning `canAccess()`, `plan`, `customerLimit`
- **Phase 3** (Plan display): `PlanBadge` on dashboard header, Subscription tab in Settings showing included/locked features
- **Phase 5** (Locked UI): `LockedFeature` (full-page), `LockedWidget` (card-level) components
- **Phase 18** (Dashboard widgets): Locked teasers for campaigns, analytics, gamification, POS on dashboard
- **Phase 19** (Banners): `UpgradeBanner` + `CustomerLimitBanner` on dashboard
- **Phase 20-22** (Admin): `SubscriptionsTab` with plan change, trial toggle, cancel/reactivate, feature overrides dialog

### What Needs to Be Built

This is a large scope. I recommend implementing in **3 batches** to keep each change reviewable. Here is the full plan — I will implement Batch 1 first, then proceed on approval.

---

### Batch 1: Sidebar Navigation + Feature Pages (Phases 4, 6, 8-17)

**1. Merchant Sidebar/Navigation Component**
Create `src/components/merchant/MerchantNav.tsx` — a bottom tab bar on mobile / side nav on desktop that appears on all merchant pages.

Navigation items with plan gating:
| Item | Route | Min Plan |
|------|-------|----------|
| Dashboard | `/merchant/dashboard` | free |
| Customers | `/merchant/customers` | free |
| Transactions | `/merchant/transactions` | free |
| Campaigns | `/merchant/campaigns` | growth |
| Rewards | `/merchant/rewards` | growth |
| Analytics | `/merchant/analytics` | growth |
| AI Suggestions | `/merchant/ai-suggestions` | growth |
| Gamification | `/merchant/gamification` | pro |
| Birthday Offers | `/merchant/birthday-offers` | pro |
| Monthly Offers | `/merchant/monthly-offers` | pro |
| POS | `/merchant/pos` | pro |
| Reports | `/merchant/reports` | pro |
| Settings | `/merchant/settings` | free |

Locked items: visible with lock icon, clicking navigates to the route which shows `LockedFeature`.

**2. Feature Page Shells**
Create placeholder pages for each feature that:
- Check `canAccess(featureKey)` via `useMerchantSubscription`
- If locked: render `LockedFeature` component
- If accessible: render the feature UI (initially basic placeholder content, real functionality in later batches)

New pages:
- `src/pages/MerchantCustomers.tsx` — customer list (free)
- `src/pages/MerchantCampaigns.tsx` — campaign CRUD (growth+)
- `src/pages/MerchantRewards.tsx` — rewards management (growth+)
- `src/pages/MerchantAnalytics.tsx` — analytics dashboard (growth+)
- `src/pages/MerchantAISuggestions.tsx` — AI suggestions (growth+)
- `src/pages/MerchantGamification.tsx` — gamification (pro)
- `src/pages/MerchantBirthdayOffers.tsx` — birthday offers (pro)
- `src/pages/MerchantMonthlyOffers.tsx` — monthly offers (pro)
- `src/pages/MerchantPOS.tsx` — POS integration (pro)
- `src/pages/MerchantReports.tsx` — advanced reports (pro)

**3. Routes in App.tsx**
Add all new merchant routes wrapped in `ProtectedRoute requiredRole="merchant"`.

**4. Update Existing Pages**
- Add `MerchantNav` to `MerchantDashboard`, `MerchantTransactions`, `MerchantSettings`
- Move POS tab content from Settings into standalone `MerchantPOS` page

---

### Batch 2: Real Feature Content (Phases 7-17)

Build actual functionality inside each feature page:

- **Customers page**: list customers with transaction history, enforce 50-customer limit for Free in both UI and backend (add check in `add_points_to_customer` RPC)
- **Campaigns page**: CRUD campaigns from existing `campaigns` table
- **Rewards page**: basic rewards management (may need new `rewards` table)
- **Analytics page**: charts using Recharts — customer growth, points issued, transaction trends
- **AI Suggestions page**: AI-powered campaign ideas using Lovable AI (gemini-2.5-flash)
- **Gamification page**: placeholder with streak/stamp card concepts
- **Birthday Offers page**: manage birthday campaign settings
- **Monthly Offers page**: CRUD from existing `monthly_offers` table
- **POS page**: existing PosTab content
- **Reports page**: export CSV, date range filters
- **Transactions page**: add date range filter + sorting for Growth+ users, limit Free to recent 20

---

### Batch 3: Backend Enforcement + Polish (Phases 7, 24, 25)

- **Customer limit RPC check**: Update `add_points_to_customer` to check customer count vs plan limit before creating transactions for new customers
- **Backend validation edge function**: Create a reusable plan-check helper for edge functions
- **Mobile responsive polish**: Ensure sidebar/nav works well on 390px viewport
- **Consistent styling**: Verify all locked states, badges, banners match PerkBack design language

---

### Files Changed/Created (Batch 1)

| File | Action |
|------|--------|
| `src/components/merchant/MerchantNav.tsx` | New — sidebar/bottom nav with plan gating |
| `src/pages/MerchantCustomers.tsx` | New — customer list page |
| `src/pages/MerchantCampaigns.tsx` | New — campaigns page (growth+) |
| `src/pages/MerchantRewards.tsx` | New — rewards page (growth+) |
| `src/pages/MerchantAnalytics.tsx` | New — analytics page (growth+) |
| `src/pages/MerchantAISuggestions.tsx` | New — AI suggestions page (growth+) |
| `src/pages/MerchantGamification.tsx` | New — gamification page (pro) |
| `src/pages/MerchantBirthdayOffers.tsx` | New — birthday offers page (pro) |
| `src/pages/MerchantMonthlyOffers.tsx` | New — monthly offers page (pro) |
| `src/pages/MerchantPOS.tsx` | New — POS integration page (pro) |
| `src/pages/MerchantReports.tsx` | New — advanced reports page (pro) |
| `src/App.tsx` | Add 10 new merchant routes |
| `src/pages/MerchantDashboard.tsx` | Add MerchantNav |
| `src/pages/MerchantTransactions.tsx` | Add MerchantNav |
| `src/pages/MerchantSettings.tsx` | Add MerchantNav, remove POS tab (moved to standalone page) |

### What Stays Unchanged
- Pricing page
- Customer flows
- Auth/session/routing logic
- Admin panel
- All existing data and tables
- LockedFeature, LockedWidget, PlanBadge, UpgradeBanner components
- `features.ts` and `useMerchantSubscription` hook

### Technical Notes
- Navigation uses the existing `canAccess()` helper for consistent gating
- Each feature page is self-contained and checks access independently (no route-level redirect — shows LockedFeature inline)
- The 390px mobile viewport will use a horizontal scrollable bottom nav or compact icon-only nav
- Feature pages start as functional shells; real CRUD/analytics will be added in Batch 2

