

## Plan: Deals Discovery Platform + Location-Based Merchant Discovery

This combines the two previously approved plans into one implementation: (1) an Explore marketplace tab on the customer Access Card page, and (2) location-based merchant sorting and proximity suggestions.

---

### What Gets Built

**1. Database: Add coordinates to merchants**

Add `latitude` (numeric, nullable) and `longitude` (numeric, nullable) columns to the `merchants` table. No new tables needed.

**2. Geocoding Edge Function**

Create `supabase/functions/geocode-address/index.ts` that calls the free OpenStreetMap Nominatim API to convert a merchant's text address into lat/lng. Called when a merchant saves their address in settings.

**3. Merchant Settings: Auto-geocode on save**

Update `MerchantSettings.tsx` to call the geocode edge function after saving the address, storing the returned coordinates.

**4. Customer Access Card: Add Explore tab**

Refactor `AccessCard.tsx` to add a two-tab switcher at the top:
- **My Rewards** — the current personalized view (My Stores, filtered rewards, transactions, etc.)
- **Explore** — new marketplace view showing ALL active promotions across ALL merchants

**5. New components in `src/components/customer/`**

| Component | Purpose |
|-----------|---------|
| `ExploreTab.tsx` | Main Explore view with sections: Near You, Featured Campaigns, Hot Rewards, Monthly Offers, Browse Merchants |
| `NearbyMerchants.tsx` | "Near You" section showing merchants sorted by distance with distance badges |
| `MerchantPreview.tsx` | Bottom sheet / dialog showing a merchant's deals, rewards, and offers when tapped |
| `IndustryFilter.tsx` | Filter chips for Coffee Shop, Retail, Restaurant |

**6. Geolocation utility**

Create `src/lib/geo.ts` with:
- Haversine distance formula
- A React hook `useUserLocation()` that requests `navigator.geolocation` permission and returns lat/lng
- Graceful fallback when permission is denied (show all merchants without distance sorting)

**7. Proximity suggestion banner**

When the Explore tab loads and location is available, if any merchant is within ~500m, show a toast/banner: "You're near [Store Name]! They have a deal: [top reward/campaign title]"

---

### Explore Tab Layout

```text
┌─────────────────────────────┐
│  [My Rewards]  [Explore]    │  ← Tab switcher
├─────────────────────────────┤
│  📍 Near You (if location)  │  ← Merchants within 5km, sorted
│  distance badges on cards   │     by distance
├─────────────────────────────┤
│  🔥 Featured Campaigns      │  ← Full-width carousel, all
│  (all merchants)             │     active campaigns
├─────────────────────────────┤
│  🎁 Hot Rewards              │  ← Horizontal scroll cards
│  "Visit to start earning"   │
├─────────────────────────────┤
│  📅 Monthly Offers           │  ← Active offers grouped by
│                              │     merchant
├─────────────────────────────┤
│  ☕ 🛍️ 🍴  Industry Filters  │  ← Filter chips
│  🏪 Browse All Merchants     │  ← Grid of all merchants
│  Each card: logo, name,     │
│  reward count, distance     │
└─────────────────────────────┘
```

---

### Data Strategy

No new RLS policies needed. Existing policies already allow authenticated users to SELECT active rewards, campaigns, monthly_offers, and merchant records. The Explore tab simply queries all active items without merchant filtering.

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add `latitude`, `longitude` to `merchants` |
| `supabase/functions/geocode-address/index.ts` | New — geocodes address via Nominatim |
| `src/lib/geo.ts` | New — Haversine formula + `useUserLocation` hook |
| `src/components/customer/ExploreTab.tsx` | New — Explore marketplace with all sections |
| `src/components/customer/NearbyMerchants.tsx` | New — Near You section with distance badges |
| `src/components/customer/MerchantPreview.tsx` | New — Merchant detail dialog |
| `src/components/customer/IndustryFilter.tsx` | New — Industry filter chips |
| `src/pages/AccessCard.tsx` | Add My Rewards / Explore tab switcher |
| `src/pages/MerchantSettings.tsx` | Call geocode function on address save |

### What stays the same
- All existing My Rewards functionality (My Stores, points, filtered data, redemptions)
- Merchant dashboard — no changes
- Authentication — no changes
- Multi-merchant architecture — no changes
- Plan gating — no changes

### Limitations
- PWA cannot do background geolocation — suggestions only work while the app is open
- Geocoding uses free Nominatim API (no API key needed), sufficient for Australian addresses
- Existing merchants will need to re-save their address to trigger geocoding (or a one-time backfill)

