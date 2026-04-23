
Check the loyalty card back as a combined rendering + data issue and fix the parts most likely preventing the QR/barcode from appearing.

### What I found from the current code

The back of the card depends entirely on `customer.loyalty_card_number` being present:

- `LoyaltyCardFlip.tsx` passes `loyaltyCardNumber || ""` into both:
  - `QRCodeDisplay`
  - `Barcode`
- `QRCodeDisplay.tsx` returns `null` if the value is empty
- `Barcode.tsx` clears the SVG if the value is empty

So if the card number is missing at render time, both scan areas become blank.

There is also a second likely issue on mobile:
- the QR and barcode are rendered inside a 3D-flipped card face
- SVGs inside transformed/rotated containers can fail to paint reliably on mobile browsers
- the current barcode sizing logic uses `getBBox()` and then mixes fixed native dimensions with `maxWidth: 100%`, which can create unstable rendering or clipping inside the constrained scan panel

### What I’ll fix

### 1. Verify and harden the card-data path
Update the Access Card flow so the back never silently renders blank.

What I’ll check and fix:
- confirm `customer.loyalty_card_number` is populated before the card is shown
- add a safe fallback UI on the back face if the card number is temporarily unavailable
- avoid passing an empty string into QR/barcode components without a visible state
- keep the existing redirect behavior if a customer truly has no loyalty card

Result:
- if data is missing, the UI will clearly say so instead of showing an empty scan area
- if data exists, the back will always attempt to render both codes

### 2. Rework QR rendering so it paints reliably inside the card back
Update `src/components/QRCodeDisplay.tsx`.

What I’ll change:
- keep a fixed square tile, but simplify the wrapper so it doesn’t depend on flex/stretch behavior
- give the QR tile an explicit foreground color instead of relying on inherited `currentColor`
- keep the QR on a solid white surface with stable width/height
- make the component render a clear fallback state if `value` is missing

Result:
- QR should render consistently on the flipped back face
- no invisible QR caused by inheritance or layout collapse

### 3. Rework barcode rendering to avoid disappearing/clipped SVG output
Update `src/components/Barcode.tsx`.

What I’ll change:
- stop relying on the current `getBBox()` + native-width + `maxWidth: 100%` combination
- render the barcode with explicit, stable dimensions that match the back layout
- keep the barcode inside a fixed-width panel so the browser does not over-compress or clip it
- use a deterministic SVG sizing strategy that is safer inside transformed containers
- add a visible fallback state if the value is empty or generation fails

Result:
- barcode will no longer disappear because of unstable SVG sizing math
- the scan block will be more reliable on mobile

### 4. Stabilize the flipped back face for SVG content
Update `src/components/customer/LoyaltyCardFlip.tsx`.

What I’ll change:
- keep the back face isolated so hidden front-face content cannot interfere
- simplify the back-face layout around the scan row
- ensure the QR tile and barcode panel sit in a dedicated middle zone with enough height
- reduce the risk of SVG paint issues inside the 3D flip by tightening the transform/stacking structure

Result:
- the back face will behave like one stable surface
- QR and barcode will have a protected area to render in

### 5. Add a proper “scan unavailable” state instead of blank areas
If the card number is unavailable or rendering fails, I’ll show a lightweight fallback message in the scan section.

Example behavior:
```text
QR unavailable
Barcode unavailable
Your loyalty card is still loading. Please try again in a moment.
```

Result:
- no more silent blank back face
- easier to distinguish data issues from rendering issues

### Files to update
- `src/components/customer/LoyaltyCardFlip.tsx`
- `src/components/Barcode.tsx`
- `src/components/QRCodeDisplay.tsx`
- `src/pages/AccessCard.tsx`

### Expected result
After this pass:
- the back of the card will display the QR and barcode reliably when a loyalty card number exists
- the scan surfaces will be dimensionally stable and sharper on mobile
- blank scan areas will be replaced with clear fallback messaging if data is missing
- the back face will feel more robust and less fragile inside the flip animation
