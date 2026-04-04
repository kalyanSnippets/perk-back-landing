

## Plan: Show All Merchant Offers to All Customers

### Problem
Currently, the Access Card page only fetches rewards, campaigns, and monthly offers from merchants the customer has **transacted with**. Customers with no transactions see nothing. The user wants ALL customers to see ALL active offers from ALL merchants.

### RLS Consideration
- `rewards`, `campaigns`, `monthly_offers` already have RLS policies allowing authenticated users to read active records — no DB changes needed.
- `merchants` table only allows `auth.uid() = user_id` for SELECT, so customers **cannot** query merchant names. We need a new RLS policy to allow authenticated users to read basic merchant info (id, store_name).

### Changes

**1. Database Migration — Add RLS policy on `merchants`**
```sql
CREATE POLICY "Authenticated users can view merchant store names"
ON public.merchants FOR SELECT TO authenticated
USING (true);
```
This allows customers to look up store names. The merchants table doesn't contain sensitive data (no passwords, no API keys).

**2. Update `src/pages/AccessCard.tsx`**

In both `fetchData` (lines 245-260) and `fetchOffersData` (lines 209-227):
- Remove the `merchantIds` filtering — fetch ALL active rewards, campaigns, and monthly offers without `.in("merchant_id", merchantIds)`
- Fetch ALL merchants to build the name map (no `.in()` filter)
- Remove the `if (merchantIds.length === 0) return` early exit in `fetchOffersData`
- Remove dependency on `transactions` in `fetchOffersData` — only depend on `customer`

### Files Changed
| File | Change |
|------|--------|
| Migration | Add SELECT policy on `merchants` for authenticated users |
| `src/pages/AccessCard.tsx` | Remove merchant ID filtering, fetch all active offers from all merchants |

### What Stays Unchanged
- Loyalty card, barcode, points balance, transactions list
- Promo carousel, reward progress bars, campaign/offer card designs
- All merchant dashboard pages
- RLS on rewards/campaigns/monthly_offers (already allow reading active records)

