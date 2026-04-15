

## Fix: Google Wallet Edge Function Non-2xx Error

### Problem
The `google-wallet-pass` edge function returns HTTP 401, 404, 500, 503 for various error cases. The Supabase JS client (`supabase.functions.invoke()`) treats any non-2xx response as an error and discards the response body. This means the client only sees a generic "Edge Function returned a non-2xx status code" message instead of the actual error details.

### Solution
Change all error responses in the edge function to return HTTP 200 with a JSON body containing `{ ok: false, error: "..." }` and success responses as `{ ok: true, saveUrl: "..." }`. Update the client code to check `data.ok` instead of relying on the HTTP status code.

### Changes

**1. `supabase/functions/google-wallet-pass/index.ts`**
- Replace all non-2xx `status` codes (401, 404, 500, 503) with `status: 200`
- Wrap all responses in `{ ok: true/false, ... }` format
- Success: `{ ok: true, saveUrl: "..." }`
- Errors: `{ ok: false, error: "message" }`

**2. `src/pages/CustomerConfirmation.tsx`**
- Update `handleAddToGoogleWallet` to check `data?.ok === false` and show `data.error` as the toast message
- Keep existing `saveUrl` handling for success case

**3. `src/pages/AccessCard.tsx`** (if it also calls this function)
- Apply same client-side response handling update

### No database changes needed.

