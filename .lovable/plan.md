

## Fix: Square OAuth "Refused to Connect" in Preview

### Root Cause
The Lovable preview runs inside an iframe. When the POS tab redirects to `squareupsandbox.com`, Square blocks loading inside iframes via `X-Frame-Options`. The current code uses `window.location.href = ...` which tries to navigate the iframe itself.

### Solution
Change the Square connect button to open the OAuth URL in a **new browser tab** using `window.open()` instead of `window.location.href`. This bypasses the iframe restriction.

### Changes

**File:** `src/components/merchant/PosTab.tsx`
- In `handleConnect()`, replace `window.location.href = initiateUrl` with `window.open(initiateUrl, "_blank")`

This is a one-line change. After the OAuth completes in the new tab, the user will be redirected back to `/merchant/settings?pos_connected=true`. The existing URL parameter detection in `useEffect` will pick up the success/error state when they return to the settings page.

### Note
The `SITE_URL` redirect in the edge function already points to the published app URL (`perk-back-landing.lovable.app`), so the OAuth callback will redirect to the published site. The merchant should test by opening the published URL directly, or the new tab will land on the published site after OAuth completes.

