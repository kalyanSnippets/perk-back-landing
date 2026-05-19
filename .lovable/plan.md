## Problem

Looking at the auth logs, the recovery email is sent, the link works, and `PUT /user` returns 200 — so the password update technically succeeds. The real issues are:

1. **After resetting, the user is left signed in** (recovery flow auto-creates a session). The current code navigates to `/get-started` but does not sign out, so they are silently logged in with the recovery session instead of being asked to log in again with the new password.
2. **`CustomerAuth.tsx` has no "Forgot password?" link.** Customers landing on that page (e.g. from older links) can't trigger a reset. Only `MerchantAuth.tsx` and `GetStarted.tsx` expose it.
3. **`ResetPassword.tsx` recovery detection is fragile.** It reads `window.location.hash` once on mount, but Supabase's `detectSessionInUrl` clears the hash quickly. If the listener hasn't fired yet, the page can flash "Invalid or expired reset link." We should also accept an active session whose user came from a recovery event, and avoid the false-negative.

## Fix

### 1. `src/pages/ResetPassword.tsx`
- On successful `updateUser({ password })`:
  - `await supabase.auth.signOut()` to clear the recovery session.
  - `toast.success("Password updated. Please sign in with your new password.")`
  - `navigate("/get-started")`.
- Make recovery detection more reliable:
  - Keep the `onAuthStateChange("PASSWORD_RECOVERY")` listener.
  - Also check `window.location.hash` AND `window.location.search` for `type=recovery` immediately.
  - Add a small "checking…" state instead of immediately showing the "Invalid link" screen — only show the invalid screen if no recovery event arrives within ~1.5s AND there's no active session.
- Keep existing password length + match validation.

### 2. `src/pages/CustomerAuth.tsx`
- Add a `handleForgotPassword` that mirrors `MerchantAuth.tsx`: validates the email field, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`, shows a success toast.
- Render a "Forgot password?" text button under the Sign In button when `!isSignUp`.

### 3. No changes to
- `auth-email-hook` or `recovery.tsx` email template (already correct — logs confirm the email is sent and the link works).
- `GetStarted.tsx` forgot-password flow (already correct).
- Database / RPCs / Supabase config.

## Out of scope
- Mobile (`perkback-mobile/app/(auth)/forgot-password.tsx`) — already implemented and not mentioned by the user.
- Changing the email template design.
