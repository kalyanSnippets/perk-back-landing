import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Save, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const MerchantBirthdayOffers = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  const [enabled, setEnabled] = useState(false);
  const [rewardType, setRewardType] = useState("points_bonus");
  const [rewardValue, setRewardValue] = useState("50");
  const [message, setMessage] = useState("Happy Birthday! Enjoy your special reward.");
  const [daysBefore, setDaysBefore] = useState("0");
  const [daysValid, setDaysValid] = useState("7");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      const { data: settings } = await supabase.from("birthday_offer_settings").select("*").eq("merchant_id", m.id).maybeSingle();
      if (settings) {
        setEnabled(settings.enabled);
        setRewardType(settings.reward_type);
        setRewardValue(settings.reward_value);
        setMessage(settings.message || "");
        setDaysBefore(String(settings.days_before));
        setDaysValid(String(settings.days_valid));
      }
      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    const payload = {
      merchant_id: merchantId,
      enabled,
      reward_type: rewardType,
      reward_value: rewardValue,
      message: message.trim() || null,
      days_before: parseInt(daysBefore) || 0,
      days_valid: parseInt(daysValid) || 7,
    };
    const { error } = await supabase.from("birthday_offer_settings").upsert(payload, { onConflict: "merchant_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Birthday offer settings saved");
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("birthday_offers") ? (
            <LockedFeature featureKey="birthday_offers" />
          ) : (
            <>
              <ScrollReveal>
                <h1 className="text-xl font-bold text-foreground mb-4">Birthday Offers</h1>
              </ScrollReveal>

              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cake size={20} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Auto Birthday Rewards</p>
                      <p className="text-xs text-muted-foreground">Automatically reward customers on their birthday</p>
                    </div>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label>
                    <Select value={rewardType} onValueChange={setRewardType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points_bonus">Points Bonus</SelectItem>
                        <SelectItem value="discount_percent">Discount %</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Reward Value</Label>
                    <Input value={rewardValue} onChange={e => setRewardValue(e.target.value)} placeholder="e.g. 50 points or 10%" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Days Before Birthday</Label>
                    <Input type="number" min="0" max="30" value={daysBefore} onChange={e => setDaysBefore(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Valid For (Days)</Label>
                    <Input type="number" min="1" max="90" value={daysValid} onChange={e => setDaysValid(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Birthday Message</Label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Happy Birthday! Enjoy your special reward." />
                </div>

                <Button variant="hero" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>

              {enabled && (
                <ScrollReveal delay={100}>
                  <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-5 border border-border/30">
                    <p className="text-xs font-semibold text-foreground mb-1">Preview</p>
                    <div className="bg-card rounded-xl p-4 border border-border/50">
                      <Cake size={24} className="text-primary mb-2" />
                      <p className="text-sm font-bold text-foreground">🎂 {message || "Happy Birthday!"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reward: {rewardValue} ({rewardType.replace("_", " ")}) · Valid for {daysValid} days
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantBirthdayOffers;
