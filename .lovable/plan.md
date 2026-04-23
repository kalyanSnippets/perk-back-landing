
Refine the loyalty card so it matches the uploaded reference more closely: cleaner alignment on the front, a more realistic premium card feel, and a properly laid-out back with crisp QR/barcode rendering.

### What to change

### 1. Rebuild the front of the loyalty card around the reference layout
Update `src/components/customer/LoyaltyCardFlip.tsx` so the front side looks like a real digital loyalty card instead of an information panel.

Target front-side structure:
```text
DIGITAL LOYALTY
PerkBack

POINTS BALANCE
1,284

MEMBER
Customer Name

Card number aligned bottom-right
```

Implementation details:
- use a cleaner blue gradient with softer decorative rings, closer to the reference
- remove the current crowded CRN / issued split layout from the front
- keep the front focused on:
  - brand
  - points balance
  - member name
  - card number
- align content in larger blocks with more negative space
- place the card number at the bottom-right like the reference
- reduce icon clutter on the front and replace the current generic card icon treatment with a more premium chip/orb accent

### 2. Rebuild the back of the card into a horizontal scan layout
The current back stacks barcode and QR vertically, which is why it does not resemble the reference and feels misaligned.

New back layout:
```text
SCAN AT CHECKOUT           CRN 48123

[ QR ]   [ Barcode ]

Issued 14 Mar 2026 · Tap card to flip back
```

Implementation details:
- place QR and barcode side-by-side on mobile, matching the reference
- make QR left-aligned and barcode take the wider right section
- move CRN into the top-right corner
- keep only one footer line with issued date + flip hint
- remove duplicated helper wording and oversized heading block
- use a white card face with restrained grey labels, similar to the uploaded screenshot

### 3. Make barcode rendering crisp and dimensionally stable
Update `src/components/Barcode.tsx` so the barcode renders at a fixed native size without soft scaling blur.

What to adjust:
- stop forcing `width="100%"` on the barcode SVG
- generate the barcode with explicit dimensions appropriate for the card back layout
- wrap the barcode in a fixed-size container so the browser does not stretch it
- tune:
  - bar width
  - bar height
  - display value spacing
  - margin
  - font size
- ensure white background is preserved and that the barcode remains readable on high-DPR mobile screens

Recommended result:
- barcode sits cleanly in the right half of the card
- number label is centered beneath the bars
- no fuzzy edges caused by container scaling

### 4. Make QR rendering crisp and visually balanced
Update `src/components/QRCodeDisplay.tsx` to behave like a fixed-size code tile rather than a responsive block.

What to adjust:
- render QR at an explicit size suited to the left column of the back layout
- add a solid white background tile with controlled padding
- avoid extra scaling from parent flex/stretch behavior
- keep margins consistent with the barcode block

Recommended result:
- QR is square, sharp, and vertically aligned with the barcode block
- both scan surfaces look like part of one designed card face

### 5. Clean up the data hierarchy on both sides
The current details feel scattered.

Recommended information split:
- Front:
  - PerkBack branding
  - points balance
  - member name
  - loyalty card number
- Back:
  - scan instruction
  - CRN
  - QR
  - barcode
  - issued date

Do not show:
- duplicate “scan your loyalty ID” style copy
- too many labels at once
- front-side issued date if it makes the design busier

### 6. Make the card proportions feel closer to a real wallet card
Refine the flip container and spacing in `LoyaltyCardFlip.tsx`:
- use a more card-like aspect ratio
- slightly wider and less tall feel
- tighten corner radius and surface shadows
- use subtle depth instead of heavy panel styling
- keep the tap-to-flip interaction, but make the transition calmer and more premium

### 7. Simplify the surrounding Card tab content so the card stands out
In `src/pages/AccessCard.tsx`, reduce visual competition around the loyalty card.

Recommended cleanup:
- keep wallet buttons and copy/share buttons below the card
- reduce or remove the extra “Card Details” panel if it duplicates what the card already communicates
- preserve actions, but visually prioritize the card itself first

### 8. Files to update
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/components/Barcode.tsx`
- `src/components/QRCodeDisplay.tsx`
- `src/pages/AccessCard.tsx`

### 9. Reference alignment
Use the uploaded screenshots as the design reference:
- `IMG_6426.jpeg` for the front-side composition
- `IMG_6427.png` for the back-side composition

Key visual traits to mirror:
- larger, simpler typography blocks
- more whitespace
- card number anchored bottom-right
- QR + barcode on one row
- understated grey helper text on the back
- premium blue front with soft highlights

### 10. Expected result
After this update:
- the loyalty card front will look closer to the reference design
- details will be aligned cleanly and feel intentional
- the back will display QR and barcode properly in a premium horizontal scan layout
- the card will feel like an actual digital loyalty card rather than a generic info panel
