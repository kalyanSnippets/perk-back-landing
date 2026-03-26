

## Replace Perk Back Logo

Replace the current text+icon logo with the uploaded logo image across all components.

### Steps

1. **Copy the uploaded logo** to `src/assets/perkback-logo.png`

2. **Update `src/components/Header.tsx`** (lines 23-28)
   - Remove the gradient square div and "Perk Back" text
   - Replace with `<img>` using the imported logo, sized ~h-8 to h-10

3. **Update `src/components/Footer.tsx`** (lines 10-14)
   - Remove the accent square div and "Perk Back" text
   - Replace with `<img>` using the logo, with a brightness/invert filter for dark background visibility

4. **Keep text references** like "Perk Back" in body copy (hero description, testimonials, copyright) — those are content, not branding elements

### Technical Details
- Import as ES6 module: `import perkbackLogo from "@/assets/perkback-logo.png"`
- Logo has transparent background, works well on light backgrounds
- For the dark footer, apply a CSS filter or use a white-background wrapper
- Logo aspect ratio is roughly 3:1, so constrain by height (~32-40px in header)

