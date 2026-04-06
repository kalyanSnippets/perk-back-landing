

## Plan: Make PerkBack an Installable PWA

### Overview
Add a web app manifest and PWA icons so PerkBack can be installed to a phone's home screen directly from the browser. No app store needed. No service workers or offline caching — just installability.

### What Gets Added

**1. `public/manifest.json`** — PWA manifest
- App name: "PerkBack", short name: "PerkBack"
- Theme color: `#0A2463` (PerkBack navy), background: `#ffffff`
- Display: `standalone`, start URL: `/`
- Icons: 192x192 and 512x512

**2. PWA Icons** — generated from existing `public/favicon.png`
- `public/pwa-icon-192.png` (192x192)
- `public/pwa-icon-512.png` (512x512)

**3. `index.html`** — add manifest link and Apple meta tags
- `<link rel="manifest" href="/manifest.json">`
- `<meta name="theme-color" content="#0A2463">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<link rel="apple-touch-icon" href="/pwa-icon-192.png">`

**4. `src/main.tsx`** — add iframe/preview guard
- Detect if running inside Lovable preview (iframe or preview hostname)
- Unregister any stale service workers in that context
- Prevents any caching issues in the editor

### Important Notes
- The install prompt only works on the **published site** (perkback.com.au), not in the Lovable editor
- On iOS: users tap Share → Add to Home Screen
- On Android: Chrome shows an automatic install banner
- No `vite-plugin-pwa` or service workers — keeps things simple and avoids caching issues with live database data

### Files Changed
| File | Change |
|------|--------|
| `public/manifest.json` | New — PWA manifest config |
| `public/pwa-icon-192.png` | New — 192px app icon |
| `public/pwa-icon-512.png` | New — 512px app icon |
| `index.html` | Add manifest link + Apple meta tags |
| `src/main.tsx` | Add preview/iframe service worker guard |

