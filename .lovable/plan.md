

## Prepare PerkBack for Square POS Integration

### Summary
Add the missing database tables, token lifecycle management, persistent customer mapping, webhook event logging, and unmatched transaction handling — without changing existing UI or breaking current flows.

### What Already Works (No Changes)
- OAuth connect/disconnect flow (`square-oauth-callback`, `PosTab`)
- Webhook processing (`pos-webhook`) with customer matching and dedup
- Points trigger (`trg_sync_points_on_transaction`)
- Manual "Add Points" RPC
- All auth, routing, dashboards

---

### Migration: New Tables + Schema Updates

**1. Add token lifecycle columns to `pos_connections`**
```sql
ALTER TABLE pos_connections
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS token_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'active'
    CHECK (connection_status IN ('active','token_expired','error','disconnected'));
```

**2. Create `external_customer_mappings` table**
Persists the customer identity resolution so the webhook doesn't re-resolve every time.
```sql
CREATE TABLE public.external_customer_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  provider text NOT NULL DEFAULT 'square',
  external_customer_id text NOT NULL,
  merchant_id uuid NOT NULL,
  match_method text, -- 'card','phone','email','manual'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_customer_id, merchant_id)
);
```
RLS: merchants can view/manage their own mappings; service role has full access.

**3. Create `integration_events` table**
Logs every webhook event for debugging and reconciliation.
```sql
CREATE TABLE public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'square',
  event_type text NOT NULL,
  external_event_id text,
  merchant_id uuid,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processed','skipped','failed')),
  payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
```
RLS: service role only (webhook runs as service role).

**4. Create `unmatched_transactions` table**
Stores webhook payments where no customer could be matched, for later manual linking or retry.
```sql
CREATE TABLE public.unmatched_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'square',
  external_payment_id text,
  purchase_amount numeric NOT NULL,
  external_customer_id text,
  match_attempted jsonb, -- { card: null, phone: '+61...', email: null }
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','linked','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
```
RLS: merchants can view their own unmatched transactions; service role has full access.

---

### Edge Function Changes

**`pos-webhook/index.ts`** — three additions, no removals:

1. **Log every event** — Insert into `integration_events` at the start of processing (status `received`), update to `processed`/`skipped`/`failed` at the end.

2. **Use persistent customer mappings** — Before the current card→phone→email matching chain, check `external_customer_mappings` for a cached match by `(provider, external_customer_id, merchant_id)`. If found, skip the rest. If the chain finds a match, insert into `external_customer_mappings` for next time.

3. **Store unmatched transactions** — When no customer is found, instead of just returning `customer_not_found`, also insert into `unmatched_transactions` with the attempted match data. This preserves the payment for later manual linking.

**`square-oauth-callback/index.ts`** — one addition:

- After token exchange, compute `token_expires_at` from `tokenData.expires_at` (Square returns an ISO timestamp) and store it alongside the access token in the upsert. Set `connection_status = 'active'`.

---

### Files Changed

| File | Change |
|------|--------|
| New migration | 4 schema changes above |
| `supabase/functions/pos-webhook/index.ts` | Add event logging, cached mapping lookup/insert, unmatched tx storage |
| `supabase/functions/square-oauth-callback/index.ts` | Store `token_expires_at`, set `connection_status` |

### What Stays Unchanged
- All UI components including `PosTab`
- Manual "Add Points" flow
- Auth context, routing, session persistence
- Customer/merchant dashboards
- Points trigger and loyalty card generation

### Technical Notes
- `external_customer_mappings` uses a composite unique index so the same external customer can map to different PerkBack customers across different merchants (e.g., a Square customer who shops at two PerkBack merchants)
- `integration_events` is write-heavy; no indexes beyond PK initially — add if query patterns emerge
- `unmatched_transactions` enables a future UI where merchants can manually link unclaimed payments to customers

