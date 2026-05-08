import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Palette, Save, Upload, Trash2, AlertTriangle } from "lucide-react";
import MerchantLoyaltyCard, { MerchantCardDesign, DEFAULT_CARD_DESIGN } from "@/components/customer/MerchantLoyaltyCard";

interface Props {
  merchantId: string;
  storeName: string;
  storeLogoUrl?: string | null;
}

// WCAG-style contrast helper
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = luminance(ra);
  const lb = luminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const CardDesignTab = ({ merchantId, storeName, storeLogoUrl }: Props) => {
  const [design, setDesign] = useState<MerchantCardDesign>(DEFAULT_CARD_DESIGN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("merchant_card_designs" as any)
        .select("*")
        .eq("merchant_id", merchantId)
        .maybeSingle();
      if (data) {
        const r = data as any;
        setDesign({
          primary_color: r.primary_color,
          secondary_color: r.secondary_color,
          text_color: r.text_color,
          background_image_url: r.background_image_url,
          card_style: r.card_style,
          show_logo: r.show_logo,
          show_points: r.show_points,
          barcode_format: r.barcode_format,
        });
      }
      setLoading(false);
    })();
  }, [merchantId]);

  const update = <K extends keyof MerchantCardDesign>(key: K, value: MerchantCardDesign[K]) => {
    setDesign((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("merchant_card_designs" as any)
      .upsert(
        { merchant_id: merchantId, ...design },
        { onConflict: "merchant_id" }
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Card design saved. Customers will see it next time they open your card.");
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploading(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setUploading(false);
      toast.error("Not authenticated");
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${userId}/card-bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed");
      return;
    }
    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    update("background_image_url", urlData.publicUrl);
    update("card_style", "image");
    setUploading(false);
    toast.success("Background uploaded");
  };

  const contrast = contrastRatio(design.primary_color, design.text_color);
  const lowContrast = contrast !== null && contrast < 4.5;

  if (loading) {
    return <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Palette size={18} className="text-secondary" /> Card Design
        </h2>
        <p className="text-xs text-muted-foreground">
          Customise the loyalty card customers see for your store. Changes apply instantly across the wallet.
        </p>

        <div className="space-y-2">
          <Label>Card style</Label>
          <Select value={design.card_style} onValueChange={(v) => update("card_style", v as MerchantCardDesign["card_style"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gradient">Gradient (primary → secondary)</SelectItem>
              <SelectItem value="solid">Solid colour</SelectItem>
              <SelectItem value="image">Background image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Primary</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={design.primary_color}
                onChange={(e) => update("primary_color", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={design.primary_color}
                onChange={(e) => update("primary_color", e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Secondary</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={design.secondary_color}
                onChange={(e) => update("secondary_color", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={design.secondary_color}
                onChange={(e) => update("secondary_color", e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Text</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={design.text_color}
                onChange={(e) => update("text_color", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={design.text_color}
                onChange={(e) => update("text_color", e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {lowContrast && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Low contrast ({contrast?.toFixed(1)}:1). Pick a text colour with at least 4.5:1 contrast for readability.
            </span>
          </div>
        )}

        <div className="space-y-2 border-t border-border/50 pt-4">
          <Label>Background image (optional)</Label>
          <p className="text-[10px] text-muted-foreground">
            Recommended: 800×500px, JPG/PNG, under 2MB. Used when card style is "Background image".
          </p>
          <div className="flex items-center gap-3">
            {design.background_image_url ? (
              <img src={design.background_image_url} alt="Background" className="h-16 w-24 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-16 w-24 rounded-lg bg-muted/40 border border-dashed border-border/60" />
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80">
                  <Upload size={14} /> {uploading ? "Uploading…" : "Upload image"}
                </div>
              </label>
              {design.background_image_url && (
                <button
                  type="button"
                  onClick={() => update("background_image_url", null)}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80"
                >
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border/50 pt-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <p className="text-sm font-semibold">Show logo</p>
              <p className="text-[10px] text-muted-foreground">Display your business logo on the card.</p>
            </div>
            <Switch checked={design.show_logo} onCheckedChange={(v) => update("show_logo", v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <p className="text-sm font-semibold">Show points</p>
              <p className="text-[10px] text-muted-foreground">Show customer's points balance on the front.</p>
            </div>
            <Switch checked={design.show_points} onCheckedChange={(v) => update("show_points", v)} />
          </div>
        </div>

        <div className="space-y-2 border-t border-border/50 pt-4">
          <Label>Barcode format on back</Label>
          <Select value={design.barcode_format} onValueChange={(v) => update("barcode_format", v as MerchantCardDesign["barcode_format"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both (QR + Barcode)</SelectItem>
              <SelectItem value="code128">Barcode only (Code 128)</SelectItem>
              <SelectItem value="qr">QR code only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} variant="hero" className="w-full gap-2" disabled={saving}>
          <Save size={16} /> {saving ? "Saving…" : "Save card design"}
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
        <MerchantLoyaltyCard
          storeName={storeName}
          storeLogoUrl={storeLogoUrl}
          fullName="Alex Customer"
          loyaltyCardNumber="1234567890"
          pointsBalance={1250}
          design={design}
        />
        <p className="text-[10px] text-center text-muted-foreground">Tap the preview to flip and see the back.</p>
      </div>
    </div>
  );
};

export default CardDesignTab;
