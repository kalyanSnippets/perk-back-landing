

## Plan: Fix All PWA Issues for iOS and Android

### Current Issues

**Issue 1: iOS home screen icon not showing (the uploaded screenshot problem)**
- The `apple-touch-icon` in `index.html` points to `/pwa-icon-192.png` but there is no dedicated Apple touch icon
- Missing `sizes="180x180"` attribute on the apple-touch-icon link
- No `apple-touch-icon-precomposed` fallback
- The 192px icon likely has transparency, which iOS fills with gray/white

**Issue 2: Icon too small on home screen**
- The logo inside the PWA icons has excessive padding, making it appear smaller than other app icons
- No `"purpose": "any maskable"` in manifest, so Android adaptive icons may crop the logo further

**Issue 3: No in-app install prompt**
- The `PWAInstallPrompt` component was planned but never created
- Mobile users have no guidance on how to install the app

---

### Fix 1: Regenerate All Icons with Solid Background + Larger Logo

**Regenerate from `public/favicon.png`:**
- Crop the favicon to just the logo content area (remove surrounding whitespace)
- Place on solid `#0A2463` navy background
- Use ~10% padding so logo fills ~80% of the icon

**Files created/updated:**
- `public/apple-touch-icon.png` — 180x180, solid navy background, no transparency (iOS standard)
- `public/pwa-icon-192.png` — 192x192, solid navy background
- `public/pwa-icon-512.png` — 512x512, solid navy background

### Fix 2: Update HTML Meta Tags for iOS

Update `index.html`:
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon.png">
```

### Fix 3: Update Manifest for Android

Update `public/manifest.json`:
- Add `"purpose": "any maskable"` to each icon entry
- Add 180x180 apple-touch-icon entry for completeness

### Fix 4: Create PWA Install Prompt Banner

**New file: `src/components/PWAInstallPrompt.tsx`**
- Detects Android Chrome `beforeinstallprompt` event and shows an install banner
- Detects iOS Safari (not already in standalone mode) and shows "Tap Share, then Add to Home Screen" instructions
- Dismissal saved to `localStorage` so it does not reappear
- Only shows on mobile viewports (< 768px)
- Styled as a bottom slide-up banner with PerkBack branding
- Auto-hides if already running as installed PWA

**Edit: `src/App.tsx`**
- Import and render `<PWAInstallPrompt />` inside the app tree

---

### Files Changed

| File | Change |
|------|--------|
| `public/apple-touch-icon.png` | New — 180x180 with solid navy background |
| `public/pwa-icon-192.png` | Regenerate — solid navy background, larger logo |
| `public/pwa-icon-512.png` | Regenerate — solid navy background, larger logo |
| `public/manifest.json` | Add `purpose: "any maskable"` to icons |
| `index.html` | Fix apple-touch-icon tags with sizes and precomposed fallback |
| `src/components/PWAInstallPrompt.tsx` | New — mobile install prompt banner |
| `src/App.tsx` | Add `<PWAInstallPrompt />` |

### Important Notes
- After publishing, users need to clear Safari cache or re-add the app to see updated iOS icons
- The install prompt only works on the published site, not in the Lovable editor

