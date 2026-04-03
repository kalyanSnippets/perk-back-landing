

## Plan: Replace Sidebar with Tab/Card Navigation on Dashboard

### Summary
Remove the `MerchantNav` sidebar component from all merchant pages. Instead, add a tab bar or card grid on the merchant dashboard that serves as the main navigation hub. Each feature is a clickable tab/card that either navigates to its dedicated page or shows its content inline. Plan-based locking stays — locked features show lock icon + upgrade prompt on the card.

---

### Architecture

```text
┌─────────────────────────────────────────┐
│  Header                                 │
├─────────────────────────────────────────┤
│  Store Name + PlanBadge                 │
│  UpgradeBanner (if Free/Growth)         │
│  CustomerLimitBanner (if Free)          │
├─────────────────────────────────────────┤
│  KPI Cards (4)                          │
├─────────────────────────────────────────┤
│  Feature Tabs/Cards Grid (scrollable)   │
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │Customers│ │Transac│ │Campgns│ ...    │
│  │  (free) │ │(free) │ │🔒grow│         │
│  └───────┘ └───────┘ └───────┘         │
├─────────────────────────────────────────┤
│  Quick Actions (Add Points, Settings)   │
└─────────────────────────────────────────┘
```

### Changes

**1. Remove `MerchantNav` from all pages**
Remove the sidebar/bottom-nav import and usage from:
- `MerchantDashboard.tsx`
- `MerchantTransactions.tsx`
- `MerchantCustomers.tsx`
- `MerchantCampaigns.tsx`
- `MerchantRewards.tsx`
- `MerchantAnalytics.tsx`
- `MerchantAISuggestions.tsx`
- `MerchantGamification.tsx`
- `MerchantBirthdayOffers.tsx`
- `MerchantMonthlyOffers.tsx`
- `MerchantPOS.tsx`
- `MerchantReports.tsx`
- `MerchantSettings.tsx`

Each page reverts to a simple full-width layout (no `flex gap-6` wrapper with sidebar).

**2. Add "Back to Dashboard" on sub-pages**
Each feature page (Customers, Transactions, Campaigns, etc.) gets a small back-link at the top: `← Dashboard` linking to `/merchant/dashboard`.

**3. Build feature navigation grid on `MerchantDashboard.tsx`**
Replace the locked widget teasers and quick actions with a unified feature card grid. Each card:
- Has an icon, label, and short description
- Links to the feature's route (e.g., `/merchant/campaigns`)
- If locked by plan: shows lock icon, required plan badge, muted/disabled styling, and clicking opens the locked feature page (which shows `LockedFeature` component)

Feature cards (in order):
| Card | Route | Min Plan |
|------|-------|----------|
| Customers | `/merchant/customers` | free |
| Transactions | `/merchant/transactions` | free |
| Add Points | opens modal | free |
| Campaigns | `/merchant/campaigns` | growth |
| Rewards | `/merchant/rewards` | growth |
| Analytics | `/merchant/analytics` | growth |
| AI Suggestions | `/merchant/ai-suggestions` | growth |
| Gamification | `/merchant/gamification` | pro |
| Birthday Offers | `/merchant/birthday-offers` | pro |
| Monthly Offers | `/merchant/monthly-offers` | pro |
| POS Integration | `/merchant/pos` | pro |
| Reports | `/merchant/reports` | pro |
| Settings | `/merchant/settings` | free |

**4. New component: `DashboardFeatureCard`**
Reusable card component accepting: `icon`, `label`, `description`, `route`, `featureKey`, `onClick`. Uses `canAccess()` to determine locked state. Locked cards show lock overlay + plan badge.

### Files Changed

| File | Change |
|------|--------|
| `src/components/merchant/DashboardFeatureCard.tsx` | New — reusable feature card with plan gating |
| `src/pages/MerchantDashboard.tsx` | Remove MerchantNav, add feature card grid |
| `src/pages/MerchantTransactions.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantCustomers.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantCampaigns.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantRewards.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantAnalytics.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantAISuggestions.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantGamification.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantBirthdayOffers.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantMonthlyOffers.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantPOS.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantReports.tsx` | Remove MerchantNav, add back-link, full-width layout |
| `src/pages/MerchantSettings.tsx` | Remove MerchantNav, add back-link, full-width layout |

### What Stays Unchanged
- All routes in `App.tsx`
- `ProtectedRoute` logic
- `useMerchantSubscription` hook and `features.ts`
- `LockedFeature` component (still used on feature pages)
- `PlanBadge`, `UpgradeBanner`, `CustomerLimitBanner`
- Admin panel
- All feature page functionality
- Pricing page, customer flows, auth

