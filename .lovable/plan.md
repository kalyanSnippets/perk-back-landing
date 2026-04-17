
The user wants an account deletion option in the customer settings, with friction (2-3 confirmation questions) before the actual delete happens.

Let me check current state — we have `MerchantSettings.tsx` but need to find customer settings location.

Looking at the file list: there's `AccessCard.tsx` for customer dashboard but no dedicated customer settings page. The merchant has `MerchantSettings.tsx`.

The request says "users" generally — best to add this to BOTH merchant and customer flows. For customer, since there's no dedicated settings page, I'll add it inside `AccessCard.tsx` (the customer dashboard) under a new "Account" section, OR add a small Settings entry. Cleanest: add a "Danger Zone" section to MerchantSettings (new tab) and add account deletion access to the customer side via AccessCard.

I'll keep scope tight: add deletion to MerchantSettings (new "Account" tab) and add it to the customer AccessCard menu.

## Plan: Add Account Deletion with Friction

### What we'll build
A multi-step "Delete Account" flow that requires the user to pass 3 confirmation steps before their account is permanently removed.

### Friction steps (modal with progress)
1. **Step 1 — Warning**: Explains what will be deleted (loyalty points, rewards, transaction history, subscription if merchant). User clicks "Continue" or "Cancel".
2. **Step 2 — Reason check**: Asks "Why are you leaving?" with options (Too expensive / Not using it / Found alternative / Other) — requires a selection. Includes "Are you sure? You'll lose all your rewards." retention message.
3. **Step 3 — Final confirmation**: User must type the word **DELETE** exactly into an input field AND check a box confirming "I understand this action is permanent and cannot be undone."

Only after all 3 steps are completed does the Delete button become active.

### Where it appears
- **Merchant Settings** (`src/pages/MerchantSettings.tsx`): New "Account" tab at the end of the tabs row, containing a clearly marked red "Danger Zone" card.
- **Customer Dashboard** (`src/pages/AccessCard.tsx`): Add a small "Account Settings" section/link at the bottom that opens the same deletion flow.

### Backend deletion
Create a Supabase edge function `delete-user-account` that:
- Verifies the caller's JWT
- Uses service-role client to delete the auth.users row (cascades to customers/merchants via existing FK relationships)
- Returns success/error

After successful deletion, the client signs out and redirects to the home page with a toast confirmation.

### New files
- `src/components/DeleteAccountDialog.tsx` — reusable 3-step dialog component (works for both merchant + customer)
- `supabase/functions/delete-user-account/index.ts` — secure edge function

### Modified files
- `src/pages/MerchantSettings.tsx` — add "Account" tab + dialog
- `src/pages/AccessCard.tsx` — add deletion entry point

### UX safeguards
- Red destructive styling only on final step
- "Cancel" available at every step
- Loading state during deletion
- Clear messaging that subscriptions are cancelled and data is irrecoverable

No DB schema changes needed — auth.users deletion cascades through existing foreign keys.
