

## Square POS Integration — Full Implementation Plan

### Overview
Enable merchants to connect their Square POS so customer purchases automatically award loyalty points in PerkBack. This covers database setup, OAuth flow, webhook processing, and a merchant-facing UI.

### Phase 1: Database — `pos_connections` table

Create a new table to store merchant POS credentials:

```text
pos_connections
├── id (uuid, PK)
├── merchant_id (uuid, references merchants.id)
├── provider (text: 'square')
├── access_token (text, encrypted at rest)
├── refresh_token (text)
├── location_id (text)
├── webhook_signature_key (text)
├── is_active (boolean, default false)
├── connected_at (timestamptz)
├── created_at / updated_at
```

RLS: merchants can only SELECT/UPDATE/DELETE their own connections. INSERT restricted to authenticated users who own the merchant record.

### Phase 2: Square OAuth Edge Function

**`supabase/functions/square-oauth-callback/index.ts`**
- Receives the OAuth redirect from Square with an authorization code
- Exchanges the code for access + refresh tokens using Square's OAuth API
- Stores tokens in `pos_connections`
- Redirects merchant back to `/merchant/settings` with a success message

**Secrets required** (will prompt user):
- `SQUARE_APPLICATION_ID`
- `SQUARE_APPLICATION_SECRET`

### Phase 3: POS Webhook Edge Function

**`supabase/functions/pos-webhook/index.ts`**
- Receives `payment.completed` events from Square
- Validates the webhook signature using the stored key
- Extracts customer identifier (phone or email) and purchase amount
- Looks up the PerkBack customer by phone/email
- Calls `add_points_to_customer` logic to award points and record transaction with `source = 'square'`
- Returns 200 OK to Square

### Phase 4: Merchant Settings UI — POS Tab

**`src/pages/MerchantSettings.tsx`** — Add a 4th tab: "POS"
- Shows connection status (connected/disconnected)
- "Connect Square" button → redirects to Square OAuth authorization URL
- Once connected: shows Square location info, last sync time, disconnect button
- Disconnect removes the `pos_connections` record

### Phase 5: Transaction Source Tracking

Add `source` column to transactions table already exists (`'dashboard'` default). Square transactions will use `source = 'square'`. This lets merchants see which transactions came from POS vs manual entry.

---

### Technical Details

**Square OAuth flow:**
1. Merchant clicks "Connect Square" → browser redirects to `https://connect.squareup.com/oauth2/authorize?client_id=...&scope=PAYMENTS_READ+CUSTOMERS_READ+MERCHANT_PROFILE_READ&redirect_uri=...`
2. Square redirects back to the `square-oauth-callback` edge function with `?code=...`
3. Edge function exchanges code → tokens, stores in DB, redirects to settings page

**Webhook customer matching priority:**
1. Phone number match against `customers.phone`
2. Email match against `auth.users.email` → `customers.user_id`
3. If no match found, log the transaction for manual review

**Files changed/created:**
- **Migration:** new `pos_connections` table + RLS policies
- **Created:** `supabase/functions/square-oauth-callback/index.ts`
- **Created:** `supabase/functions/pos-webhook/index.ts`
- **Modified:** `src/pages/MerchantSettings.tsx` — add POS tab with connect/disconnect UI
- **Modified:** `supabase/config.toml` — add function config entries

**Secrets to request from user:**
- `SQUARE_APPLICATION_ID`
- `SQUARE_APPLICATION_SECRET`

