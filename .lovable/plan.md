

## Create Missing Brand Assets

### What Exists
- **Logo**: Available at `https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/perkback-logo.png` — this is the PerkBack logo already hosted.
- **Hero image**: Only exists locally as `public/images/video-thumbnail.webp` and the loyalty card mockup. No dedicated hero banner image.
- **Wordmark**: No separate wordmark-only image exists. The logo file contains both the icon and text.

### What to Build

1. **Hero Image** — Use AI image generation (Lovable AI gateway) to create a branded hero banner image showing the PerkBack concept (loyalty cards, rewards, digital wallet). Save as WebP, upload to the `email-assets` storage bucket so it has a public URL.

2. **Wordmark Image** — Use AI image generation to create a clean "PerkBack" text-only wordmark in the brand colors (navy `#0a1f5c`, accent). Save and upload to storage.

3. **Upload all assets** to the existing `email-assets` storage bucket so they have permanent public URLs.

### Final Deliverables

| Asset | Public URL |
|-------|------------|
| Logo | Already available: `.../email-assets/perkback-logo.png` |
| Hero Image | `.../email-assets/perkback-hero.webp` (new) |
| Wordmark | `.../email-assets/perkback-wordmark.png` (new) |

### Technical Details
- Generate images using `google/gemini-2.5-flash-image` via the Lovable AI gateway
- Upload to Supabase storage bucket `email-assets` using the Supabase client or edge function
- Optimize hero image as WebP for performance
- Brand colors: navy `#0a1f5c`, accent gold, white background

