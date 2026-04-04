

## Plan: Dynamic Customer Dashboard with Promo Banner Carousel

### What Changes

**Replace hardcoded offers** (lines 94-113) with real data from `rewards`, `campaigns`, and `monthly_offers` tables. Add a **hero promo carousel** at the top for visual impact.

### New Sections in `src/pages/AccessCard.tsx`

**1. Promo Banner Carousel (new, after loyalty card)**
- Full-width auto-sliding carousel using the existing `Carousel` component (embla)
- Pulls from active `campaigns` and `monthly_offers` with gradient backgrounds
- Each slide: large title, description, merchant name, "Ends in X days" badge
- Auto-play every 4 seconds, dot indicators, swipeable on mobile
- Gradient color palette cycles through navy/gold/secondary for visual variety
- Falls back to a single welcome banner if no promos exist

**2. Available Rewards (replaces hardcoded offers)**
- Fetched from `rewards` table filtered by merchant IDs the customer has transacted with
- Each card shows: title, points_required, reward_type icon, merchant store_name
- Progress bar: `points_balance / points_required` (capped at 100%)
- "Almost there!" pulse badge when ≥ 80%
- "Ready to redeem!" glowing badge when ≥ 100%
- Limited-time rewards show expiry countdown
- Horizontal scroll on mobile for card-swipe feel

**3. Active Campaigns**
- Cards with gradient accent strip on left edge
- Title, description, merchant name
- AI-generated sparkle badge if `ai_generated = true`
- Empty state: friendly "No campaigns right now" message

**4. Monthly Offers**
- Cards with validity date range and "Ends in X days" countdown
- Title, description, merchant name
- Empty state if none

### Data Flow
1. After fetching transactions, extract unique `merchant_id` values
2. Query `rewards` (active=true), `campaigns` (active=true), `monthly_offers` (active=true) filtered by those merchant IDs
3. Join `merchants(store_name)` on each query via select syntax
4. Store in state: `rewards`, `campaigns`, `monthlyOffers`
5. Extend existing realtime channel to listen for changes on all 3 tables → re-fetch on change

### Carousel Implementation
- Uses existing `src/components/ui/carousel.tsx` (Embla-based)
- Auto-play via `useEffect` with `setInterval` calling `api.scrollNext()`
- Dot indicators showing current slide
- Each slide is a gradient card with large typography

### Files Changed
| File | Change |
|------|--------|
| `src/pages/AccessCard.tsx` | Remove hardcoded `activeOffers`, add data fetching for rewards/campaigns/offers, add promo carousel, add 3 dynamic sections with progress bars |

### What Stays Unchanged
- Loyalty card, barcode, card actions, points balance
- Transaction history, write review, ways to claim
- Admin panel link
- All merchant pages, auth, routing

