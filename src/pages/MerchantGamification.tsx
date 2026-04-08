import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Stamp, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import StampQrScanner from "@/components/merchant/StampQrScanner";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const MerchantGamification = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  const [stampEnabled, setStampEnabled] = useState(false);
  const [stampsRequired, setStampsRequired] = useState("10");
  const [stampReward, setStampReward] = useState("Free item");
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [streakThreshold, setStreakThreshold] = useState("5");
  const [streakReward, setStreakReward] = useState("Bonus points");
  const [levelsEnabled, setLevelsEnabled] = useState(false);
  const [stampStats, setStampStats] = useState({ active: 0, completed: 0 });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      const { data: settings } = await supabase.from("gamification_settings").select("*").eq("merchant_id", m.id).maybeSingle();
      if (settings) {
        setStampEnabled(settings.stamp_card_enabled);
        setStampsRequired(String(settings.stamps_required));
        setStampReward(settings.stamp_reward || "Free item");
        setStreakEnabled(settings.visit_streak_enabled);
        setStreakThreshold(String(settings.streak_threshold));
        setStreakReward(settings.streak_reward || "Bonus points");
        setLevelsEnabled(settings.levels_enabled);
      }

      // Fetch stamp stats
      const { data: activeStamps } = await supabase
        .from("customer_stamps")
        .select("id", { count: "exact" })
        .eq("merchant_id", m.id)
        .eq("completed", false);
      const { data: completedStamps } = await supabase
        .from("customer_stamps")
        .select("id", { count: "exact" })
        .eq("merchant_id", m.id)
        .eq("completed", true);
      setStampStats({
        active: activeStamps?.length || 0,
        completed: completedStamps?.length || 0,
      });

      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    const payload = {
      merchant_id: merchantId,
      stamp_card_enabled: stampEnabled,
      stamps_required: parseInt(stampsRequired) || 10,
      stamp_reward: stampReward.trim() || "Free item",
      visit_streak_enabled: streakEnabled,
      streak_threshold: parseInt(streakThreshold) || 5,
      streak_reward: streakReward.trim() || "Bonus points",
      levels_enabled: levelsEnabled,
    };
    const { error } = await supabase.from("gamification_settings").upsert(payload, { onConflict: "merchant_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gamification settings saved");
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const levels = [
    { name: "Bronze", points: "0+", color: "bg-amber-700/20 text-amber-700" },
    { name: "Silver", points: "500+", color: "bg-slate-400/20 text-slate-500" },
    { name: "Gold", points: "1,500+", color: "bg-yellow-500/20 text-yellow-600" },
    { name: "VIP", points: "5,000+", color: "bg-purple-500/20 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("gamification") ? (
            <LockedFeature featureKey="gamification" />
          ) : (
            <>
              <ScrollReveal>
                <h1 className="text-xl font-bold text-foreground mb-4">Gamification</h1>
              </ScrollReveal>

              {/* Stamp Card */}
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Stamp size={20} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Stamp Card</p>
                      <p className="text-xs text-muted-foreground">Reward customers after a number of purchases</p>
                    </div>
                  </div>
                  <Switch checked={stampEnabled} onCheckedChange={setStampEnabled} />
                </div>
                {stampEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Stamps Required</Label>
                      <Input type="number" min="2" max="50" value={stampsRequired} onChange={e => setStampsRequired(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reward</Label>
                      <Input value={stampReward} onChange={e => setStampReward(e.target.value)} placeholder="Free item" />
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Streaks */}
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flame size={20} className="text-orange-500" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Visit Streaks</p>
                      <p className="text-xs text-muted-foreground">Bonus for consecutive visit streaks</p>
                    </div>
                  </div>
                  <Switch checked={streakEnabled} onCheckedChange={setStreakEnabled} />
                </div>
                {streakEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Streak Threshold (visits)</Label>
                      <Input type="number" min="2" max="30" value={streakThreshold} onChange={e => setStreakThreshold(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reward</Label>
                      <Input value={streakReward} onChange={e => setStreakReward(e.target.value)} placeholder="Bonus points" />
                    </div>
                  </div>
                )}
              </div>

              {/* Levels */}
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-yellow-500" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Customer Levels</p>
                      <p className="text-xs text-muted-foreground">Tiered levels based on total points earned</p>
                    </div>
                  </div>
                  <Switch checked={levelsEnabled} onCheckedChange={setLevelsEnabled} />
                </div>
                {levelsEnabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {levels.map(l => (
                      <div key={l.name} className={`rounded-xl p-3 text-center ${l.color}`}>
                        <p className="text-xs font-bold">{l.name}</p>
                        <p className="text-[10px] mt-0.5">{l.points} pts</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="hero" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantGamification;
