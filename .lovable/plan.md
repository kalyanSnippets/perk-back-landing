

## Plan: Fix Negative Points Balance

### Root Cause

The negative balance (-34 pts) for Cafe Shop KK is a **data integrity issue from the multi-merchant migration backfill**. Here's what happened:

1. The customer earned 86 points at this merchant (across 5 transactions)
2. The customer redeemed 120 points (100 + 20) -- these redemptions happened **before** the multi-merchant migration, when the old `redeem_reward` function used the global balance and didn't have proper per-merchant checks
3. The backfill migration calculated: `86 earned - 120 redeemed = -34`
4. The current `redeem_reward` function now correctly checks per-merchant balance before allowing redemptions, so this won't happen again going forward

### Fix

**1. Data fix -- correct the negative balance**

Run a migration that resets this customer's balance to 0 (since they've already over-redeemed, they shouldn't owe points):

```sql
UPDATE customer_merchants
SET points_balance = GREATEST(points_balance, 0), updated_at = now()
WHERE points_balance < 0;
```

Also update the global `customers.points_balance` to stay in sync.

**2. Add a database constraint to prevent future negatives**

Add a validation trigger on `customer_merchants` that prevents `points_balance` from going below 0 (using a trigger, not a CHECK constraint, per project guidelines).

### Files Changed

| Area | Change |
|------|--------|
| Database migration | Fix negative balances to 0, add validation trigger |

### What's already correct
- The current `redeem_reward` function already validates sufficient balance before deducting -- this bug can't recur through normal redemption flow
- The trigger adds a safety net at the database level

