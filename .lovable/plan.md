

## Plan: Implement All Feature Pages — One by One

This plan builds real functionality into the 6 empty shell pages, plus enhances 2 existing pages. Each feature is implemented sequentially so you can test before moving to the next.

---

### Current Status

| Page | Status | What exists |
|------|--------|-------------|
| Campaigns | Working | Full CRUD |
| Monthly Offers | Working | Full CRUD |
| Customers | Partial | List only, no points/spend columns |
| Transactions | Working | Full list with search |
| POS | Working | Square integration |
| Settings | Working | Profile, password, subscription tab |
| **Rewards** | **Shell** | Placeholder text only |
| **Analytics** | **Shell** | Placeholder text only |
| **AI Suggestions** | **Shell** | Placeholder text only |
| **Gamification** | **Shell** | Placeholder text only |
| **Birthday Offers** | **Shell** | Placeholder text only |
| **Reports** | **Shell** | Placeholder text only |

---

### Implementation Order

#### Feature 1: Rewards (Growth+)
**What it does:** Merchants create custom rewards that customers can redeem with their points.

**Database:** New `rewards` table with columns: id, merchant_id, title, description, points_required, reward_type (discount/freebie/voucher/custom), active, is_limited_time, expires_at, created_at, updated_at. RLS: merchants manage own records.

**UI:** Full CRUD — create reward form (title, description, points required, type dropdown), list with toggle active/inactive, delete. Same card-list pattern as Campaigns page.

---

#### Feature 2: Birthday Offers (Pro)
**What it does:** Merchants configure automatic birthday rewards for their customers.

**Database:** New `birthday_offer_settings` table: id, merchant_id (unique), enabled, reward_type (points_bonus/discount_percent/free_item/custom), reward_value, message, days_before, days_valid. RLS: merchants manage own.

**UI:** Settings form with upsert logic — enable/disable toggle, reward type dropdown, reward value input, custom birthday message, days before birthday to send, validity period. Save button with loading state.

---

#### Feature 3: Gamification (Pro)
**What it does:** Merchants configure stamp cards and visit streak rules.

**Database:** New `gamification_settings` table: id, merchant_id (unique), stamp_card_enabled, stamps_required, stamp_reward, visit_streak_enabled, streak_threshold, streak_reward, levels_enabled. RLS: merchants manage own.

**UI:** Two setting sections — Stamp Card (enable, stamps required, reward text) and Visit Streaks (enable, threshold, reward text). Each with save/upsert. Preview cards showing how it looks to customers.

---

#### Feature 4: Analytics (Growth+)
**What it does:** Visual dashboard showing customer insights, spending trends, and segmentation.

**Database:** No new tables — computed from existing `transactions` table.

**UI:**
- 4 summary cards: total customers, total revenue, avg transaction value, repeat customer rate
- Line chart: daily transactions over last 30 days (Recharts)
- Bar chart: points awarded per day over last 30 days
- Top 5 customers table (by total spend)
- All data fetched from `transactions` and computed client-side

---

#### Feature 5: Reports (Pro)
**What it does:** Date-filtered reporting with CSV export.

**Database:** No new tables — reads from `transactions`.

**UI:**
- Date range picker (from/to inputs)
- Summary cards: total transactions, total revenue, total points, unique customers in range
- Transaction list filtered by date
- "Export CSV" button that generates and downloads a CSV file of the filtered data

---

#### Feature 6: AI Suggestions (Growth+)
**What it does:** AI-powered campaign and offer suggestions based on merchant's transaction data.

**Backend:** New edge function `ai-merchant-assistant` that:
- Reads merchant's transaction summary (total customers, avg spend, transaction frequency)
- Calls Lovable AI (google/gemini-3-flash-preview) with structured output via tool calling
- Returns 3-5 campaign suggestions with title, description, target audience, expected impact

**UI:**
- "Generate AI Suggestions" button
- Loading state while AI processes
- Results displayed as cards with title, description, target, impact
- "Create Campaign" button on each card that pre-fills and creates a campaign in the `campaigns` table

---

#### Feature 7: Customers Page Enhancement
**What it does:** Add points balance and total spend columns to existing customer list.

**Database:** No changes — compute from `transactions` and `customers` tables.

**UI:** Each customer row now shows points balance (from customers table via enriched RPC) and total spend (computed from transactions). Sort options by name, points, or spend.

---

#### Feature 8: Monthly Offers Enhancement
**What it does:** Add date range fields (valid_from, valid_to) to the create form.

**Database:** No changes — columns already exist on `monthly_offers` table.

**UI:** Add two date inputs to the create form for valid_from and valid_to. Show date range on offer cards.

---

### Files Changed/Created

| File | Action |
|------|--------|
| New migration | `rewards`, `birthday_offer_settings`, `gamification_settings` tables + RLS |
| `src/pages/MerchantRewards.tsx` | Full CRUD for rewards |
| `src/pages/MerchantBirthdayOffers.tsx` | Settings form with upsert |
| `src/pages/MerchantGamification.tsx` | Stamp card + streak settings |
| `src/pages/MerchantAnalytics.tsx` | Charts + summary cards using Recharts |
| `src/pages/MerchantReports.tsx` | Date filtering + summary + CSV export |
| `src/pages/MerchantAISuggestions.tsx` | AI-powered suggestions with edge function |
| `supabase/functions/ai-merchant-assistant/index.ts` | New edge function for AI |
| `src/pages/MerchantCustomers.tsx` | Add points + spend columns |
| `src/pages/MerchantMonthlyOffers.tsx` | Add date range to create form |

### What Stays Unchanged
- Dashboard layout, KPI cards, feature card grid
- Campaigns page (already working)
- Transactions page (already working)
- POS integration, Settings
- Auth, routing, subscription gating
- Admin panel
- Customer-facing flows (AccessCard)

