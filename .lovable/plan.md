
# White-labelled per-merchant loyalty cards

Move from one global PerkBack card to a **wallet of merchant-branded cards**, one per enrolled merchant, with each merchant controlling its visual identity.

---

## Recommendations on the open questions

### 1. Card identifier — three options explained

**A. Per-merchant unique number** — Generate a fresh 10-digit number per `(customer, merchant)` pair.
- Pros: Most "white-label". Each merchant's POS sees only its own customer IDs. Cleanest data isolation. Mirrors how big chains (Coles Flybuys, Woolworths Everyday Rewards) issue their own card numbers.
- Cons: Customer juggles many numbers. POS systems already integrated against the global number need migration. More numbers to keep unique.

**B. Reuse the global card number** — Same 10-digit number on every card; only branding changes.
- Pros: Zero POS impact. Simplest migration. One barcode works everywhere — already how Square and our existing pos-webhook flow match customers.
- Cons: Less "true" white-label. A merchant scanning the barcode could theoretically derive that the customer also shops elsewhere on PerkBack (though they can't see *where* due to RLS).

**C. Merchant prefix + CRN** — e.g. `CAFE042-37281`.
- Pros: Visually merchant-specific, deterministic, no extra storage.
- Cons: Worst of both worlds for POS — not a clean numeric barcode, and still encodes the global CRN.

**Market reality:** Most modern white-label loyalty platforms (Stamp Me, Loyverse, Square Loyalty, Como, LoyaltyLion) actually use **option B** under the hood — a single customer identifier reused across merchant-branded card faces. The "white-label" promise is about **branding and experience**, not unique numbers. Issuing fresh numbers per merchant (option A) is reserved for closed-loop programs (a single chain), not multi-merchant networks.

> **Recommendation: Option B — reuse the global card number.** It preserves your existing POS integration (Square webhook, `add_points_to_customer` RPC, NFC tap), avoids a painful data migration, and matches industry norm for SaaS loyalty networks. The "white-label" feel is delivered through visual branding, not a different number.

### 2. Wallet passes — explained

**One pass per merchant** — Customer adds Café Luna's pass + Bowery Books' pass + Sushi Co's pass. Each pass shows that merchant's logo, colors, and points balance.
- Pros: Truly white-label. Customer's Apple/Google Wallet looks like a stack of real merchant cards, no PerkBack branding visible.
- Cons: Customers may add 5–20 passes. Each pass = one Apple/Google API object to maintain and update on every points change. More complex push updates. PerkBack brand becomes invisible inside the wallet.

**Single unified pass** — One PerkBack pass; in-app shows per-merchant cards.
- Pros: Simple, one object per customer, consistent push updates. Keeps PerkBack brand top-of-mind.
- Cons: The wallet pass itself is *not* white-labelled — defeats the purpose for merchants who want their card visible when the customer opens their wallet at the counter.

**Defer wallet changes** — Ship in-app per-merchant cards now; revisit wallet passes after observing usage.
- Pros: Faster ship, smaller blast radius, lets you see which merchants actually request wallet branding before paying the engineering cost.
- Cons: Wallet pass remains the unified PerkBack one in the meantime — a visible inconsistency for power users.

> **Recommendation: Defer wallet changes (Phase 2), then move to one pass per merchant as a Pro-tier feature.** PerkBack's vision is a multi-merchant network where customers discover stores via Explore — meaning most customers will start with 1–2 cards and grow over time. Shipping per-merchant wallet passes upfront is heavy (Apple Pass Type ID per merchant is impractical; you'll use one PerkBack Pass Type ID with merchant branding inside the pass JSON). Doing this *after* the in-app experience lands lets you validate demand and gate it behind Growth/Pro plans, keeping Free-tier merchants on the unified pass.

---

## What gets built

### Database changes

**New table `merchant_card_designs`** (1 row per merchant):
- `merchant_id` (FK), `primary_color`, `secondary_color`, `text_color`, `background_image_url`, `card_style` (`gradient` / `solid` / `image`), `show_logo`, `show_points`, `barcode_format` (`code128` / `qr` / `both`), `created_at`, `updated_at`.
- RLS: merchants manage own design; customers can SELECT designs of merchants they're enrolled with (via `customer_merchants` join).

**No changes** to `customers.loyalty_card_number` or `customer_merchants` — keep the global card number and per-merchant points balance as-is (option B).

**New storage path** in existing `profile-images` bucket: `card-backgrounds/{merchant_id}/...` for uploaded card art.

### Merchant Settings — new "Card Design" tab

Add to `MerchantSettings.tsx` as a new tab alongside Profile/Plan/etc:
- Color pickers (primary, secondary, text) with live preview
- Optional background image upload (PNG/JPG, validated)
- Toggle: show logo, show points balance, barcode format
- Live preview of the actual card customers will see
- Plan gating: Free = colors only; Growth/Pro = colors + background image + custom layout

### Customer-side: "Wallet of cards"

Replace the current single-card "My Card" tab with a **stacked/swipeable wallet**:
- New component `MerchantLoyaltyCard.tsx` — renders the existing `LoyaltyCardFlip` design but driven by `merchant_card_designs` (colors/bg/logo replace the navy-blue PerkBack gradient). Falls back to merchant's `logo_url` + auto-derived accent if no design row exists.
- New page section `MerchantCardWallet.tsx` — fetches all `customer_merchants` for the user with joined `merchants_public` + `merchant_card_designs`, renders as a vertical stack (top card peeking, tap to expand) on mobile and a carousel on desktop.
- Each card flips to reveal the same global barcode/QR + merchant-specific points balance.
- Empty state: "Visit a store on Explore to add your first card."
- Update `src/pages/AccessCard.tsx` to use the new wallet view.

### What stays the same

- Global `loyalty_card_number` and CRN (still on `customers`)
- POS integration, Square webhook, `add_points_to_customer`, NFC tap flow
- `customer_merchants.points_balance` per-merchant accounting
- Reward redemption (`redeem_reward` RPC) — already merchant-scoped
- Wallet passes (Apple/Google) — unchanged in this phase

### Phase 2 (not in this plan, deferred)

- Per-merchant Apple/Google Wallet passes (Pro tier)
- Push updates on points balance change per pass

---

## Files to create / edit

**New:**
- `supabase/migrations/<ts>_merchant_card_designs.sql`
- `src/components/customer/MerchantLoyaltyCard.tsx`
- `src/components/customer/MerchantCardWallet.tsx`
- `src/components/merchant/CardDesignTab.tsx`
- `src/components/merchant/CardDesignPreview.tsx`

**Edit:**
- `src/pages/AccessCard.tsx` — swap `LoyaltyCardFlip` for `MerchantCardWallet`
- `src/pages/MerchantSettings.tsx` — add "Card Design" tab
- `src/integrations/supabase/types.ts` — auto-regenerated

**Untouched:** `LoyaltyCardFlip.tsx` (kept for backwards-compat / fallback), all POS / wallet / reward code.

---

## Risks & notes

- **Visual quality control**: Merchants with poor color choices can produce unreadable cards. Include accessibility check (contrast ratio ≥ 4.5:1) on the design tab and warn if failing.
- **No data migration needed**: Existing customers keep their global card number; new wallet view simply renders merchant-branded *faces* over the same identifier.
- **Brand identity**: PerkBack logo will appear small in a corner of each card (e.g., "Powered by PerkBack") to preserve network identity — toggleable for Pro merchants.

Approve this plan and I'll implement Phase 1 (everything above except wallet passes).
