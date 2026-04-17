
Fix plan: correct the misleading “account already exists” flow after deletion.

1. Diagnosis from the current code and logs
- The delete itself is succeeding. The backend log shows “Account deleted for user …” and the current auth tables have no user/identity row for that email.
- The message is misleading because the real signup screen is `src/pages/GetStarted.tsx` (both `/customer/auth` and `/merchant/auth` route there), not the old `CustomerAuth.tsx` / `MerchantAuth.tsx`.
- In `GetStarted.tsx`, `handleSignUp()` treats every signup `422` as if the email already exists:
  - it checks `error.status === 422`
  - then it tries `signInWithPassword()`
  - when that fails, it throws “Account exists but password is incorrect”
- So the app is converting an unknown signup failure into a false “already exists” message.
- After deletion, `DeleteAccountDialog.tsx` calls normal `signOut()`. The logs show `/logout` returns `403 User from sub claim in JWT does not exist`, which means the deleted session is not being cleaned up safely and stale local auth state may remain.

2. Minimal code changes
- `src/pages/GetStarted.tsx`
  - Remove the broad `error.status === 422` fallback.
  - Only treat signup as “existing account” when the backend message explicitly says the user is already registered/already exists.
  - For any other signup error, show the real backend error instead of masking it.
  - Before signup, clear any stale local session if one exists.
- `src/components/DeleteAccountDialog.tsx`
  - After successful deletion, use local sign-out/forced local session cleanup instead of relying on server logout for a user that no longer exists.
  - Clear cached role/session state deterministically before redirecting home.
- Optional consistency hardening
  - Mirror the safer signup error handling in legacy `CustomerAuth.tsx` and `MerchantAuth.tsx`, or leave a note that those files are no longer the routed auth entry points.

3. Expected result
- If the email truly no longer exists, the user will be able to re-register with the same email.
- If signup fails for another reason, the app will show the real reason instead of the false “account already exists” message.
- Deleting an account will no longer leave a stale client session behind.

4. Validation steps
- Delete a test customer account.
- Confirm the app clears local session and redirects cleanly.
- Re-sign up immediately with the same email/password.
- Repeat once more after a fresh page reload.
- Confirm the error message now reflects the real backend response if signup still fails.
