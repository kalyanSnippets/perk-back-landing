

## Making PerkBack a Mobile App (iOS & Android)

You have two paths to get PerkBack on phones as an installable app:

---

### Option 1: Installable Web App (PWA) — Already Set Up

PerkBack is **already configured** as an installable web app (PWA). This means:

- Users can install it from the browser to their home screen (looks and feels like a real app)
- Works on both iPhone and Android
- No app store submission needed
- Already has icons, splash screens, and standalone display mode configured
- **Limitation**: Some advanced phone features (like push notifications on iOS, advanced camera access) may be limited

**To install right now**: Visit your published app on a phone, tap Share (iOS) or the browser menu (Android), then "Add to Home Screen."

---

### Option 2: True Native Mobile App (Capacitor)

This wraps your existing React app into a real native app you can publish to the **Apple App Store** and **Google Play Store**.

- Full access to all phone features (camera, push notifications, sensors)
- Best performance and most professional feel
- **Requires**: A Mac with Xcode (for iOS), Android Studio (for Android), and developer accounts ($99/year Apple, $25 one-time Google)

#### Implementation Steps

**What I would do in the codebase:**
1. Install Capacitor dependencies (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`)
2. Initialize Capacitor with:
   - App ID: `app.lovable.384dac2da9e24e039b954119dc0b766f`
   - App Name: `perk-back-landing`
   - Live-reload server URL pointing to the sandbox preview
3. Create `capacitor.config.ts` in the project root

**What you would do on your machine:**
1. Export the project to GitHub via the "Export to GitHub" button in Lovable
2. Clone/pull the repo locally
3. Run `npm install`
4. Add platforms: `npx cap add ios` and/or `npx cap add android`
5. Run `npx cap update ios` or `npx cap update android`
6. Build: `npm run build`
7. Sync: `npx cap sync`
8. Run on device/emulator: `npx cap run ios` or `npx cap run android`

After any code changes in Lovable, just `git pull` and run `npx cap sync` again.

For more details, see the [Lovable mobile development guide](https://docs.lovable.dev/tips-tricks/native-mobile-apps).

---

### Recommendation

Since PerkBack already has a full PWA setup with icons, splash screens, and install prompts, **Option 1 is already working**. Option 2 (Capacitor) is worth pursuing if you want app store presence or need native features like push notifications.

### Files to Create/Modify (Option 2 only)

| File | Change |
|------|--------|
| `package.json` | Add Capacitor dependencies |
| `capacitor.config.ts` | **New** — Capacitor configuration with app ID, name, and live-reload server |

