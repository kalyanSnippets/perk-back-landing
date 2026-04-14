

## Recommendation: Option 1 — One Platform-Wide Wallet Card

### Why This Is Best for PerkBack

PerkBack's architecture already uses a **single global customer identity** (CRN + 10-digit loyalty card number) with merchant-specific balances tracked in `customer_merchants`. The wallet pass should mirror this — one card per customer, not one per merchant.

**Reasons:**

1. **Customer experience** — Customers don't want 15 wallet passes cluttering their phone. One PerkBack card is clean and branded.
2. **The card is an identifier, not a dashboard** — The barcode/QR gets scanned at any participating merchant. The app shows merchant-specific balances. The wallet pass just needs to get them in the door.
3. **Scalability** — Creating/managing a separate Google Wallet loyalty class and Apple pass per merchant is operationally complex (each needs its own class ID, updates, push notifications).
4. **Google Wallet limitations** — You can only have one issuer account. Creating hundreds of loyalty classes under one issuer for different merchants gets messy and doesn't scale.
5. **Current implementation already does this** — Your `google-wallet-pass` function creates a single `perkback_loyalty` class with the customer's global `loyalty_card_number` and `points_balance`.

### What the Wallet Card Should Show

| Field | Value |
|-------|-------|
| Program Name | PerkBack Loyalty |
| Member Name | Customer's full name |
| Card Number | 10-digit loyalty card number |
| Points | Global `points_balance` from `customers` table |
| Barcode | Code128 of loyalty card number |
| Logo | PerkBack logo |
| Background | Navy #0A2472 |

### What Changes Are Needed

The current implementation is already Option 1. Minor enhancements to make it more polished:

1. **Add a hero image** to the Google Wallet pass (1032x336px branded banner)
2. **Add `textModulesData`** showing member tier and CRN
3. **Add `linksModuleData`** linking to the PerkBack web app
4. **Update the Apple Wallet pass** (`apple-wallet-pass`) with matching branding — strip image, custom colors, secondary/auxiliary fields
5. **Ensure `update-wallet-pass`** syncs the global `points_balance` whenever it changes (already implemented)

### Merchant-Specific Context

When a customer taps their PerkBack card at a merchant, the merchant's POS/dashboard looks up the `customer_merchants` record for that specific merchant and shows/awards merchant-specific points. The wallet card itself stays generic — it's the **access key**, not the **balance sheet**.

### Technical Details

- No database changes needed — current `wallet_passes` table already supports this model
- Edge functions `google-wallet-pass` and `apple-wallet-pass` need visual enhancements only
- Upload a hero/strip image to the `email-assets` storage bucket for use in passes
- The `update-wallet-pass` function already patches the global points balance on Google Wallet objects

