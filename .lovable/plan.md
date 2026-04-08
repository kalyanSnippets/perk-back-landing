

## Plan: Smart Promotion Rules + Stamp Cards + NFC Tap Loyalty

### What This Adds

Three major capabilities that combine Stamp Me's simplicity with PerkBack's platform power:

1. **Smart Promotion Rules** — Merchants create "Buy X Get Y Free" rules (e.g., "Buy 9 coffees, get 10th free")
2. **Customer Stamp Progress Tracking** — Track each customer's stamp count per merchant, auto-reward when threshold is met
3. **NFC Tap-to-Earn** — Customers tap their phone on an NFC tag at the merchant counter to log a visit/stamp (Web NFC API, Android Chrome only; fallback QR code for iOS)

### What PerkBack Still Needs (Feature Gap Analysis)

| Feature | Status | Priority |
|---------|--------|----------|
| **Stamp card progress per customer** | Missing — `gamification_settings` exists but no `customer_stamps` tracking table | Critical |
| **Smart promo rules engine** | Missing — no "Buy X Get Y" rule definitions | Critical |
| **NFC tap-to-earn** | Missing — no Web NFC integration | High |
| **QR code fallback for iOS** | Missing — needed since Web NFC is Android-only | High |
| **Auto-reward on stamp completion** | Missing — no trigger to grant reward when stamps hit threshold | Critical |
| **Stamp card visual on customer Access Card** | Missing — customer sees points but no stamp card UI | High |
| **Apple/Google Wallet passes** | Placeholder buttons only | Medium |
| **Push notifications** | Not possible in PWA without service worker push | Medium |
| **Customer segmentation tools** | Not built | Medium |
| **Multi-promo stacking rules** | Not built | Low |

---

### Database Changes

**New table: `customer_stamps`**
Tracks each customer's stamp progress per merchant.

```text
customer_stamps
├── id (uuid, PK)
├── customer_id (uuid)
├── merchant_id (uuid)
├── stamps_collected (integer, default 0)
├── stamps_required (integer) — snapshot from settings at time of card start
├── reward_text (text) — snapshot of reward
├── completed (boolean, default false)
├── completed_at (timestamptz, null)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── UNIQUE(customer_id, merchant_id) WHERE completed = false
```

**New table: `promotion_rules`**
Merchant-defined smart promo rules.

```text
promotion_rules
├── id (uuid, PK)
├── merchant_id (uuid)
├── rule_type (text) — 'buy_x_get_y', 'spend_x_get_y', 'visit_x_get_y'
├── trigger_count (integer) — X value (e.g., 9 coffees)
├── reward_description (text) — "Free coffee"
├── reward_type (text) — 'free_item', 'discount_percent', 'bonus_points'
├── reward_value (text) — "100" or "10%"
├── active (boolean, default true)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

**New table: `nfc_tap_tokens`**
Short-lived tokens for NFC tap verification.

```text
nfc_tap_tokens
├── id (uuid, PK)
├── merchant_id (uuid)
├── token (text, unique) — 8-char code written to NFC tag
├── created_at (timestamptz)
├── expires_at (timestamptz) — rotate every 24h
```

### RLS Policies
- `customer_stamps`: Customers SELECT own, merchants SELECT/INSERT/UPDATE own
- `promotion_rules`: Merchants ALL own, authenticated users SELECT active
- `nfc_tap_tokens`: Merchants ALL own, service role full access

### Database Function: `process_stamp`
Called when a customer taps NFC or scans QR. Validates the merchant token, increments `stamps_collected`, and if stamps hit the threshold, marks completed + auto-creates a redemption or bonus points entry. Resets with a new stamp card row.

---

### Merchant Side

**New page: `MerchantPromotions.tsx`** (`/merchant/promotions`)
- Create/edit/delete promotion rules
- Rule builder UI: "When customer [buys/visits/spends] [X] times → they get [free item/discount/bonus points]"
- List of active rules with toggle on/off
- Gated behind Growth plan (same as campaigns)

**Update: `MerchantGamification.tsx`**
- Show live stamp card stats: how many customers have active stamp cards, completion rate
- Link to view promotion rules

**Update: `MerchantDashboard.tsx`**
- Add "Promotions" card to dashboard grid

### Customer Side

**Update: `AccessCard.tsx`**
- Add stamp card section below points balance (per selected merchant)
- Visual stamp grid: filled circles for collected stamps, empty for remaining
- "X more to go!" progress text
- Auto-celebration animation when stamp card completes

**New: NFC Tap Component** (`src/components/customer/NfcTapButton.tsx`)
- "Tap to Earn" button that activates Web NFC reader
- Reads merchant token from NFC tag, calls `process_stamp` function
- Fallback: "Show QR Code" for iOS users — merchant scans customer's QR instead

**New: QR Code for merchants** (`src/components/merchant/StampQrScanner.tsx`)
- Merchant can scan a customer's QR code to award a stamp
- Alternative to NFC for merchants without NFC hardware

### Edge Function: `process-nfc-tap/index.ts`
- Accepts: `{ token, customer_id }`
- Validates token against `nfc_tap_tokens`
- Calls `process_stamp` DB function
- Returns stamp progress

---

### Feature Catalog Update

Add to `src/lib/features.ts`:
```text
promotions → Growth tier (allow_promotions override)
nfc_tap → Pro tier (allow_nfc_tap override)
```

Add `allow_promotions` and `allow_nfc_tap` to `merchant_feature_overrides` table.

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `customer_stamps`, `promotion_rules`, `nfc_tap_tokens` tables + `process_stamp` function |
| Database migration | Add `allow_promotions`, `allow_nfc_tap` to `merchant_feature_overrides` |
| `supabase/functions/process-nfc-tap/index.ts` | New — NFC tap verification endpoint |
| `src/lib/features.ts` | Add `promotions` and `nfc_tap` feature definitions |
| `src/pages/MerchantPromotions.tsx` | New — Smart promotion rules builder |
| `src/components/customer/NfcTapButton.tsx` | New — NFC tap-to-earn + QR fallback |
| `src/components/customer/StampCardProgress.tsx` | New — Visual stamp card on Access Card |
| `src/components/merchant/StampQrScanner.tsx` | New — QR scanner for manual stamp awarding |
| `src/pages/AccessCard.tsx` | Add stamp card section per merchant |
| `src/pages/MerchantGamification.tsx` | Add stamp card stats + link to promotions |
| `src/pages/MerchantDashboard.tsx` | Add Promotions card |
| `src/App.tsx` | Add `/merchant/promotions` route |

### What Stays the Same
- All existing points-based loyalty logic
- Rewards, campaigns, monthly offers
- Multi-merchant architecture
- Authentication
- Subscription gating
- Explore tab and location features

