

This is a large multi-feature request. Let me explore the key files first to understand the current state, then present a structured plan.
<lov-tool-use id="toolu_vrtx_01JFQxcbGYVDFZMbExjcfgwg" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AccessCard.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01XYsaR3iqfCpsiK25dSdPKw" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/customer/ExploreTab.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0184nRYAHn9Zair3vJhggkBW" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/MerchantPoints.tsx\", \"lines\": \"1-60\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_014HA3D2SZjgEv1Ntg2n8kVV" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/MerchantMarketing.tsx\", \"lines\": \"1-60\"}">
</lov-tool-use>
This is a very large multi-feature request. Let me quickly inspect the key relevant files in parallel before writing a focused plan.
<lov-tool-use id="toolu_vrtx_018pVXpgnyusYnNy3fPrVmie" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/MerchantPoints.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01YYRBQFXrXHdYPpyZe4VjPy" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/MerchantMarketing.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018rhQgf6ePnK1EN19STFtSW" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/customer/ExploreTab.tsx\"}">
</lov-tool-use>
I have enough context. This is a very large feature request with ~15 distinct items. Let me present a focused, organized plan without over-exploring.

<lov-plan>

## Plan: Major Customer + Merchant Enhancements

This is a large request (~15 items). I'll group into **5 work batches** for clarity. Approving this plan triggers all of it.

---

### Batch 1 — Customer Access Card (`AccessCard.tsx`)

1. **Redeem from Hot Rewards (ExploreTab)** — `Redeem` button on each Hot Rewards carousel card calls existing `redeem_reward` RPC; show same redemption code modal as My Rewards.
2. **Campaign banner click** — currently sets `previewMerchantId` but in AccessCard the campaign banner has no handler. Add a `CampaignDetailDialog` showing title, description, image, merchant info, and a "Visit Store" link.
3. **Stamp card details next to points** — under each merchant's points section in My Card, render active stamp progress (`X / Y stamps`, mini dot row, reward text) from `customer_stamps`.
4. **My Redemptions collapsible** — wrap the existing My Redemptions list in `Collapsible` (closed by default, count badge in header).
5. **My Stores cards with background images** — each merchant card gets an industry-themed background image (Unsplash by `industry_type`) with logo + name overlaid (split layout).
6. **Visit Streaks + Customer Level display** — new "Your Status" card per merchant showing current streak count (compute from recent transactions) and tier badge (Bronze/Silver/Gold/VIP based on `points_balance`). Attractive gradient cards with flame/trophy icons.

---

### Batch 2 — Customer Explore (`ExploreTab.tsx`)

7. **Browse Merchants attractive cards** — industry-themed background image per card, logo overlay, bold name, distance/industry badge. Same Unsplash mapping as My Stores.
8. **Location-based discovery threshold** — only filter by proximity when `merchants.length >= 10`. Below that: show **all** merchants with a small map preview on hover (lazy-loaded OSM tile thumbnail using lat/lng).

---

### Batch 3 — Merchant Points page (`MerchantPoints.tsx`)

9. **Fix CustomerSearch** — current `search_customer_by_phone` RPC only matches phone AND requires existing `customer_merchants` link. Update to a new `search_customer_universal` RPC that matches by phone, email (via `auth.users`), full_name, OR loyalty_card_number — and **does not require** prior merchant relationship (so merchants can find brand-new customers).
10. **Adjustable points-per-dollar** — add `points_per_dollar` (default 0.5) to `merchants` table. New "Points Settings" sub-card on Settings page + the live calc on Add Points uses it. Update `add_points_to_customer` RPC to read from merchant config.
11. **Refund / Cancel** — new "Recent Transactions" panel on Points page with a "Refund" action per row → reverses points (decrement `customer_merchants.points_balance`), marks transaction `refunded`, and decrements the matching stamp if applicable. New `refund_transaction` RPC.
12. **Redemptions tab inside Points page** — add a "Redemptions" tab that mounts the existing `MerchantRedemptions` content (verify codes + recent list).

---

### Batch 4 — Merchant Marketing (`MerchantMarketing.tsx`)

13. **Move AI tab → inside Campaigns tab** — remove standalone "AI" tab; embed an AI chat panel at the top of Campaigns tab. User describes desired campaign in a chatbox (textarea + send button), AI returns 3 tailored campaign suggestions which can be one-click created. Update `ai-merchant-assistant` edge function to accept a `user_brief` string in the prompt.
14. **Reward image generation prompt input** — replace the "Generate AI Image" button with a small inline form (textarea: "Describe your reward image…" + Generate button). Pass the user's text directly to the existing `generate_image` mode.
15. **Validation everywhere** — add `zod` schemas for create/edit forms in: campaigns (title 1–100, desc ≤500), rewards (title 1–80, points 1–10000, image url valid), promotions (trigger 1–100, reward_desc ≤200), monthly offers (dates valid, valid_to > valid_from), birthday settings (days 0–30, value numeric for points type). Show inline field errors via toast.

---

### Batch 5 — Merchant Dashboard

16. **Industry-themed banner** — add a top banner card to `MerchantDashboard` with a soft background image based on `industry_type` (coffee/restaurant/retail/etc.) + store name, store logo, and quick stats overlay.

---

### Database Migrations

- Add `merchants.points_per_dollar numeric default 0.5`.
- Add `transactions.refunded_at timestamptz`, `transactions.refunded_by uuid`.
- New RPC: `search_customer_universal(_merchant_id uuid, _query text)` — searches phone/name/loyalty_card_number on `customers` + email via `auth.users` join (security definer). Returns matches even without prior `customer_merchants` row.
- Update `add_points_to_customer` RPC to read `points_per_dollar` from merchant.
- New RPC: `refund_transaction(_tx_id uuid)` — verifies merchant ownership, reverses points in `customer_merchants` and `customers`, marks transaction refunded, optionally decrements stamps.

### Files Modified
- `src/pages/AccessCard.tsx`, `src/components/customer/ExploreTab.tsx`, `src/components/customer/NearbyMerchants.tsx`, `src/components/merchant/CustomerSearch.tsx`
- `src/pages/MerchantPoints.tsx`, `src/pages/MerchantSettings.tsx`, `src/pages/MerchantMarketing.tsx`, `src/pages/MerchantDashboard.tsx`
- `supabase/functions/ai-merchant-assistant/index.ts`
- 1 SQL migration

### Industry → Image Mapping (reused)
Coffee → coffee shop interior • Restaurant → plated food • Retail → boutique storefront • Beauty/Salon → salon • Bakery → pastries • Default → friendly storefront. All Unsplash URLs.

