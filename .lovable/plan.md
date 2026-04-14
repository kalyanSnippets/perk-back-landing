

## Wallet Integration System

This plan adds Google Wallet, Apple Wallet, and QR code support to PerkBack's existing loyalty card system. The existing `handleAddToWallet` placeholder in `AccessCard.tsx` will be replaced with real functionality.

---

### Architecture

```text
Customer clicks "Add to Wallet"
        │
        ▼
Frontend calls Edge Function
        │
        ├─ Google: returns save URL → redirect
        │
        └─ Apple: returns .pkpass download URL → trigger download
        
Points updated by merchant
        │
        ▼
Transaction trigger fires
        │
        ├─ Google Wallet API: PATCH loyalty object
        └─ Apple: push notification to update pass
```

---

### What Already Exists
- Customer identity system (CRN, loyalty card number, barcode via Code128)
- `AccessCard.tsx` with wallet button placeholders (line 332-334)
- `CustomerConfirmation.tsx` generates card on signup
- `Barcode.tsx` component using jsbarcode
- Merchant points system with `add_points_to_customer` RPC
- Real-time sync via Supabase channels

### What Needs to Be Built

#### 1. Add QR Code to Loyalty Card
- Install `qrcode.react` library
- Create `QRCodeDisplay` component encoding the loyalty card number
- Add QR code to the "My Card" tab in `AccessCard.tsx` alongside the existing barcode

#### 2. Google Wallet Edge Function
- Create `supabase/functions/google-wallet-pass/index.ts`
- Accepts customer_id, generates a Google Wallet loyalty pass JWT
- Uses Google Wallet API with a service account key (secret: `GOOGLE_WALLET_SERVICE_ACCOUNT`)
- Creates loyalty class (once per merchant) and loyalty object (per customer)
- Returns the `https://pay.google.com/gp/v/save/` URL
- Includes barcode (CODE_128), points balance, customer name, PerkBack branding

#### 3. Apple Wallet Edge Function
- Create `supabase/functions/apple-wallet-pass/index.ts`
- Generates a `.pkpass` file dynamically using passkit-generator logic
- Requires secrets: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT` (base64), `APPLE_PASS_KEY` (base64), `APPLE_WWDR_CERT` (base64)
- Includes barcode (CODE128), points, customer name
- Returns the `.pkpass` file as binary download

#### 4. Wallet Update on Points Change
- Create `supabase/functions/update-wallet-pass/index.ts`
- Called after points are updated (via database webhook or modified trigger)
- Updates Google Wallet loyalty object via API
- Sends Apple push notification to update pass

#### 5. Frontend Integration
- Update `AccessCard.tsx`:
  - Replace `handleAddToWallet` placeholder with real calls
  - Detect device: show Google Wallet button on Android, Apple Wallet on iOS, both on desktop
  - Add official "Add to Google Wallet" and "Add to Apple Wallet" button assets
  - Add QR code display next to barcode
- Update `CustomerConfirmation.tsx`:
  - Add wallet buttons after card generation

#### 6. Wallet Pass Table
- Create `wallet_passes` table to track which customers have added passes:
  - `id`, `customer_id`, `wallet_type` (google/apple), `pass_id`, `device_token`, `push_token`, `created_at`, `updated_at`
  - RLS: customers can view own, service role full access

---

### Secrets Required
| Secret | Purpose |
|--------|---------|
| `GOOGLE_WALLET_SERVICE_ACCOUNT` | Google Cloud service account JSON for Wallet API |
| `APPLE_PASS_CERT` | Apple Pass Type certificate (base64) |
| `APPLE_PASS_KEY` | Apple Pass Type private key (base64) |
| `APPLE_WWDR_CERT` | Apple WWDR certificate (base64) |
| `APPLE_PASS_TYPE_ID` | e.g. `pass.com.perkback.loyalty` |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/QRCodeDisplay.tsx` | Create — QR code component |
| `src/pages/AccessCard.tsx` | Modify — real wallet buttons, QR code, device detection |
| `src/pages/CustomerConfirmation.tsx` | Modify — add wallet buttons after card generation |
| `supabase/functions/google-wallet-pass/index.ts` | Create — generate Google Wallet save URL |
| `supabase/functions/apple-wallet-pass/index.ts` | Create — generate .pkpass file |
| `supabase/functions/update-wallet-pass/index.ts` | Create — sync points to wallets |
| Database migration | Create `wallet_passes` table |

### Implementation Order
1. QR code component + display (no secrets needed)
2. `wallet_passes` table migration
3. Google Wallet edge function (requires secret setup)
4. Apple Wallet edge function (requires secret setup)
5. Frontend wallet button integration with device detection
6. Points sync to wallets

### Important Notes
- Google Wallet requires a Google Cloud project with the Wallet API enabled and a service account. The user will need to set this up in Google Cloud Console.
- Apple Wallet requires an Apple Developer account ($99/year) with a Pass Type ID certificate. The user will need to generate certificates from the Apple Developer portal.
- The QR code fallback works immediately with no external setup.
- I will implement the QR code and full frontend first, then the edge functions. Secrets will be requested before building the wallet-specific backend code.

