

## Fix: Add Square Sandbox/Production Environment Toggle

### Problem
The edge function uses production Square URLs (`connect.squareup.com`) but the secrets contain sandbox credentials (`sq0idp-...` / `sq0csp-...`). Sandbox credentials are rejected by the production Square OAuth page, causing "Unknown error."

### Solution
Add a `SQUARE_ENVIRONMENT` secret (value: `sandbox` or `production`) and update both edge functions to use the correct base URL.

### Changes

#### 1. Add `SQUARE_ENVIRONMENT` secret
- Use `add_secret` to request the user set this to `sandbox` (for now)

#### 2. Update `supabase/functions/square-oauth-callback/index.ts`
- Read `SQUARE_ENVIRONMENT` from env (default `sandbox`)
- Derive base URL:
  - `sandbox` → `https://connect.squareupsandbox.com`
  - `production` → `https://connect.squareup.com`
- Replace all 3 hardcoded `connect.squareup.com` references:
  - OAuth authorize URL (line 29)
  - Token exchange URL (line 67)
  - Locations API URL (line 94)
- Add credential prefix logging for debugging (prefix + length only, no full secrets)

#### 3. Update `supabase/functions/pos-webhook/index.ts`
- Same environment-aware base URL for any Square API calls

### Files
- **Secret added:** `SQUARE_ENVIRONMENT` = `sandbox`
- **Modified:** `supabase/functions/square-oauth-callback/index.ts`
- **Modified:** `supabase/functions/pos-webhook/index.ts`

