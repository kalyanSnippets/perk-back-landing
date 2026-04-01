

## Fix Critical Backend Issues

Three targeted fixes — no UI changes.

### 1. Session Persistence Race Condition
**File:** `src/contexts/AuthContext.tsx`

**Problem:** `loading` is set to `false` before `detectRole` completes (line 102). The `setTimeout` on line 95 makes it worse — roles briefly reset to false, causing `ProtectedRoute` to redirect authenticated users to `/` on page refresh.

**Fix:**
- Add a `rolesLoaded` boolean state
- Only set `loading = false` after `detectRole` finishes (not before)
- Remove `setTimeout` — call `detectRole` directly and `await` it inside `onAuthStateChange`
- In `getSession` path, also wait for `detectRole` to finish before setting `loading = false`

### 2. Duplicate Loyalty Card Prevention
**File:** New database migration + `src/pages/CustomerConfirmation.tsx`

**Migration:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_loyalty_card_unique
ON public.customers (loyalty_card_number)
WHERE loyalty_card_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_crn_unique
ON public.customers (crn)
WHERE crn IS NOT NULL;
```

**Code change:** In `handleGenerateCard`, catch errors with code `23505` (unique violation) and redirect to access-card instead of showing an error.

### 3. Points Balance Consistency
**Migration — add trigger:**
```sql
CREATE OR REPLACE FUNCTION public.sync_points_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.customers
  SET points_balance = points_balance + NEW.points_awarded
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_points_on_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_points_on_transaction();
```

**Then remove manual points updates from two places** (to prevent double-counting):

- **`add_points_to_customer` DB function:** Remove the `UPDATE public.customers SET points_balance = points_balance + _points WHERE id = _customer_id;` line — the trigger handles it now.

- **`pos-webhook` edge function** (`supabase/functions/pos-webhook/index.ts`): Remove the manual read-then-update block (lines ~195-205) that fetches `currentCustomer.points_balance` and updates it.

### Files Changed
| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Fix race: await detectRole before setting loading=false |
| `src/pages/CustomerConfirmation.tsx` | Handle 23505 unique constraint gracefully |
| `supabase/functions/pos-webhook/index.ts` | Remove manual points balance update |
| New migration | Unique indexes on loyalty_card_number/crn + points sync trigger + update add_points_to_customer RPC |

