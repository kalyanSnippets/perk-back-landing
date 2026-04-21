

## Visual prototype first — see every screen before we build

You'll get a complete, high-fidelity, **clickable visual prototype** of the customer first-touch journey before any production code is written. Logos, photography, gradients, type, and motion will all be in place so you can approve the look exactly as it will ship.

---

### What you'll be able to see

A new prototype flow added to the existing `/prototype` lab:

```text
/prototype  →  flow: "Customer first-touch (mobile)"
```

It will appear inside the same iPhone device frame the lab already uses, with a screen picker on the left so you can step through every state in order, or jump to any single screen.

### The 8 screens you'll review

```text
1.  QR poster              (what merchant shows at counter)
2.  Splash                 (PerkBack brand moment)
3.  Merchant welcome       (logo + name + photo of the store)
4.  Onboarding slide 1     (Show your card)
5.  Onboarding slide 2     (Earn real rewards)
6.  Onboarding slide 3     (Discover local places)
7.  Quick questions        (name, phone, DOB)
8.  Create wallet          (email + password + Google/Apple)
9.  Card ready             (CRN + loyalty number reveal)
10. Wallet home preview    (where they land)
```

### Visual ingredients you've asked for

- **PerkBack logo** — used on the QR poster, splash screen (animated bloom), and wallet header. Pulled from the existing `perkback-logo-224.webp` asset.
- **Merchant logo** — shown prominently on the welcome screen, sized like an Apple Wallet pass header.
- **Hero photography** — a real lifestyle image on the merchant welcome screen (e.g. café counter, coffee being handed over) so the moment feels human, not corporate. Same for each onboarding slide:
  - Slide 1: a phone showing a QR being scanned at a counter
  - Slide 2: a coffee cup with a "free" tag / reward voucher styling
  - Slide 3: a stylised neighbourhood map with pins
- **Brand gradient** — navy → blue PerkBack hero gradient on splash, welcome, and card-ready celebration.
- **Card-ready animation** — animated loyalty card flipping into place with the customer's CRN and loyalty number revealed.
- **Confetti + glow** on the success state.

All imagery will be generated specifically for this prototype using the project's AI image generation, then optimised and embedded — no stock placeholders, no grey boxes.

### How it will feel

- Premium loyalty wallet language (Apple Wallet × Starbucks × local rewards)
- Big rounded 2xl cards, soft shadows, generous spacing
- One primary action per screen
- Smooth `ease-apple` transitions between screens
- Mobile viewport (375×812) inside the device frame for accurate scale

### Click-through navigation

The prototype will include a "Next →" tap target on each screen so you can walk the flow exactly as a real customer would. A "Restart flow" button returns to the QR poster.

---

### Technical implementation (prototype only — no production code yet)

**New files**

```text
src/components/prototype/CustomerJoinPrototype.tsx
  - Renders all 10 screens based on screenId
  - Uses the existing PhonePage + StatusBar pattern
  - Includes Next/Back tap targets

src/assets/prototype/
  merchant-welcome-hero.webp        (AI-generated café scene)
  onboarding-scan.webp              (AI-generated QR scan moment)
  onboarding-rewards.webp           (AI-generated reward visual)
  onboarding-discover.webp          (AI-generated local map)
  merchant-logo-bean-society.webp   (AI-generated sample logo)
```

**Modified files**

```text
src/lib/prototypeScreens.ts
  - Add new flow: "customer-join"
  - Register the 10 screen ids

src/pages/Prototype.tsx
  - Add "customer-join" to flow router
  - Default screen: "join-qr-poster"
```

**Reused**

- `SplashScreen.tsx` styling language
- `OnboardingCarousel.tsx` slide layout
- Existing brand gradient, shadow, and font tokens
- `perkback-logo-224.webp`
- Existing `MobileCustomerPrototype` `PhonePage` + bottom nav patterns

**Out of scope for this step**

- No new routes in the real app (`/join/:merchantId` comes after approval)
- No database or auth changes
- No changes to the production customer or merchant UI
- No business logic — every screen is presentational

---

### Build order for the prototype

1. Generate the 5 imagery assets via AI image generation, optimise to webp
2. Build `CustomerJoinPrototype.tsx` with all 10 screens
3. Wire the flow into `prototypeScreens.ts` and `Prototype.tsx`
4. Add Next/Back tap targets and "Restart flow" control
5. Visual QA at 375×812 in the device frame

---

### Acceptance criteria

- `/prototype` shows a new "Customer first-touch (mobile)" flow
- All 10 screens render inside the iPhone device frame
- PerkBack logo appears on QR poster, splash, and wallet header
- A sample merchant logo + lifestyle photo appear on the welcome screen
- Each onboarding slide has its own custom illustration/photo
- Brand gradient + premium card styling consistent across screens
- You can click through the entire flow end-to-end and restart it
- No production routes, auth, or database affected

