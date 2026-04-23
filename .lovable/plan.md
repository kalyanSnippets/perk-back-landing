
Remove the back-face text overlay issue and tighten the loyalty card layout so it matches the reference more closely on mobile.

### What I’ll fix

### 1. Remove the floating chip/accent from the front
Update `src/components/customer/LoyaltyCardFlip.tsx` to delete the decorative chip block entirely.

Result:
- cleaner digital-card look
- less visual clutter between the logo and balance section
- more space to align the front content properly

### 2. Rebuild the front with stricter alignment
The current front uses decorative layers plus loose spacing, which is causing alignment issues and text crowding.

What I’ll change:
- use a clearer vertical content grid:
  - eyebrow
  - logo
  - points block
  - member block
  - card number anchored bottom-right
- add safer inner padding so text never pushes into the curved edges
- reduce the size/opacity of the decorative circles and move them farther off-canvas
- constrain long member names so they wrap or truncate cleanly without breaking the card

Result:
- no text collision
- cleaner hierarchy
- front closer to the uploaded reference

### 3. Remove overlay text on the back of the card
The back currently shows unwanted text bleed/overlay during the flip.

What I’ll change in `src/components/customer/LoyaltyCardFlip.tsx`:
- strengthen the front/back face isolation during the 3D flip
- ensure each face has its own clean stacking context
- prevent hidden face text from visually leaking through on mobile
- simplify the back so only intentional back-side content is present

Result:
- no mirrored or overlapping text behind the barcode/QR area
- cleaner flip animation
- back face reads as one stable surface

### 4. Rebuild the back using the approved horizontal layout
The back needs to look like the reference instead of a stacked info panel.

New structure:
```text
SCAN AT CHECKOUT         CRN 48123

[ QR ]   [ Barcode ]

Issued 14 Mar 2026 · Tap card to flip back
```

What I’ll change:
- move CRN to the top-right
- place QR on the left in a fixed square tile
- place barcode on the right in a wider fixed panel
- remove extra helper wording that makes the back feel crowded
- keep only one footer line

Result:
- cleaner composition
- proper scan layout
- back side feels like a real loyalty card

### 5. Make QR and barcode render sharply without distortion
Update `src/components/Barcode.tsx` and `src/components/QRCodeDisplay.tsx`.

What I’ll fix:
- stop any layout-driven stretching that softens the scan surfaces
- use explicit native dimensions for both barcode and QR
- keep them inside fixed white panels
- preserve crisp edges and readable scan output on high-DPR mobile screens

Result:
- barcode and QR appear sharp
- no fuzzy scaling
- better visual balance between the two scan elements

### 6. Lightly simplify the Card tab around the card
Update the card section in `src/pages/AccessCard.tsx` so the card remains the main focus.

What I’ll do:
- keep actions below the card
- reduce surrounding visual competition if needed
- preserve existing copy/share functionality

### Files to update
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/components/Barcode.tsx`
- `src/components/QRCodeDisplay.tsx`
- `src/pages/AccessCard.tsx`

### Expected result
After this pass:
- the chip/accent will be removed
- front-side details will align properly
- decorative circles will stop interfering with content
- back-side overlay text will be removed
- QR and barcode will display properly in a clean side-by-side layout
- the overall card will feel more premium and closer to the provided design reference
