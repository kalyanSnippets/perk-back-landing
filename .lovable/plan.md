

## Plan: Add PWA Splash Screens for iOS and Android

### How Splash Screens Work

**Android**: Uses the `background_color`, `theme_color`, icon, and app name from `manifest.json` to auto-generate a splash screen. No extra files needed — just ensure the manifest has the right values (already done).

**iOS**: Does NOT use the manifest for splash screens. iOS requires explicit `apple-touch-startup-image` link tags in `index.html` pointing to pre-rendered splash screen images for every device size. Without these, iOS shows a blank white screen on launch.

### What Gets Done

**1. Generate iOS splash screen images**
Using a Python script, generate splash screen PNGs for all current iOS device sizes. Each image will have:
- White background
- PerkBack logo centered (from `public/favicon.png`)
- Sized for each device resolution

Device sizes to cover (portrait + landscape for each):
- iPhone SE / 8: 750x1334, 1334x750
- iPhone 8 Plus: 1242x2208, 2208x1242
- iPhone X / XS / 11 Pro: 1125x2436, 2436x1125
- iPhone XR / 11: 828x1792, 1792x828
- iPhone XS Max / 11 Pro Max: 1242x2688, 2688x1242
- iPhone 12 / 13 / 14: 1170x2532, 2532x1170
- iPhone 12/13/14 Pro Max: 1284x2778, 2778x1284
- iPhone 14 Pro: 1179x2556, 2556x1179
- iPhone 14 Pro Max: 1290x2796, 2796x1290
- iPhone 15/16 Pro Max: 1320x2868, 2868x1320
- iPad Mini / Air: 1536x2048, 2048x1536
- iPad Pro 11": 1668x2388, 2388x1668
- iPad Pro 12.9": 2048x2732, 2732x2048

Files go to `public/splash/` directory.

**2. Update `index.html`**
Add `<link rel="apple-touch-startup-image">` tags with `media` queries matching each device's screen dimensions and pixel ratio.

**3. Android — already handled**
Android auto-generates splash from the manifest. The current `background_color: "#ffffff"` and 512px icon are sufficient. No changes needed.

### Files Changed

| File | Change |
|------|--------|
| `public/splash/*.png` | New — ~30 splash screen images for iOS devices |
| `index.html` | Add `apple-touch-startup-image` link tags for each device |

### Notes
- Splash images are static PNGs, roughly 50-150KB each
- Only visible when launching the PWA from the home screen on iOS
- Android splash screen works automatically from existing manifest config

