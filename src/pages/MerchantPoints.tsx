import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CreditCard, DollarSign, CheckCircle, Save,
  Stamp, Flame, Trophy, Coins
} from "lucide-react";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import StampQrScanner from "@/components/merchant/StampQrScanner";
import LockedFeature from "@/components/merchant/LockedFeature";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const MerchantPoints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "add-points";

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add points state
  const [cardNumber, setCardNumber] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Gamification state
  const [stampEnabled, setStampEnabled] = useState(false);
  const [stampsRequired, setStampsRequired] = useState("10");
  const [stampReward, setStampReward] = useState("Free item");
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [streakThreshold, setStreakThreshold] = useState("5");
  const [streakReward, setStreakReward] = useState("Bonus points");
  const [levelsEnabled, setLevelsEnabled] = useState(false);
  const [savingGamification, setSavingGamification] = useState(false);
  const [stampStats, setStampStats] = useState({ active: 0, completed: 0 });

  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId || undefined);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/get-started"); return; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!m) { navigate("/get-started"); return; }
    setMerchantId(m.id);

    const [gamRes, activeRes, completedRes] = await Promise.all([
      supabase.from("gamification_settings").select("*").eq("merchant_id", m.id).maybeSingle(),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", m.id).eq("completed", false),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", m.id).eq("completed", true),
    ]);

    if (gamRes.data) {
      const s = gamRes.data;
      setStampEnabled(s.stamp_card_enabled);
      setStampsRequired(String(s.stamps_required));
      setStampReward(s.stamp_reward || "Free item");
      setStreakEnabled(s.visit_streak_enabled);
      setStreakThreshold(String(s.streak_threshold));
      setStreakReward(s.streak_reward || "Bonus points");
      setLevelsEnabled(s.levels_enabled);
    }
    setStampStats({ active: activeRes.data?.length || 0, completed: completedRes.data?.length || 0 });
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("add_points_to_customer", {
        _loyalty_card_number: cardNumber.trim(),
        _purchase_amount: parseFloat(purchaseAmount),
        _merchant_id: merchantId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; customer_name?: string; points_awarded?: number };
      if (!result.success) { toast.error(result.error || "Failed to add points"); return; }
      toast.success(`Awarded ${result.points_awarded} points to ${result.customer_name}`);
      setCardNumber("");
      setPurchaseAmount("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add points");
    } finally {
      setSubmitting(false);
    }
  };

  const saveGamification = async () => {
    if (!merchantId) return;
    setSavingGamification(true);
    const { error } = await supabase.from("gamification_settings").upsert({
      merchant_id: merchantId,
      stamp_card_enabled: stampEnabled,
      stamps_required: parseInt(stampsRequired) || 10,
      stamp_reward: stampReward.trim() || "Free item",
      visit_streak_enabled: streakEnabled,
      streak_threshold: parseInt(streakThreshold) || 5,
      streak_reward: streakReward.trim() || "Bonus points",
      levels_enabled: levelsEnabled,
    }, { onConflict: "merchant_id" });
    setSavingGamification(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
  };

  const handleTabChange = (value: string) => setSearchParams({ tab: value });

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }
  if (!merchantId) return null;

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
        <div className="flex gap-6">
          <MerchantNav merchantId={merchantId} />
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Coins size={22} className="text-secondary" /> Points & Stamps
            </h1>

            <Tabs value={defaultTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="add-points">Add Points</TabsTrigger>
                <TabsTrigger value="stamps">Stamp Cards</TabsTrigger>
                <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
              </TabsList>

              {/* Add Points */}
              <TabsContent value="add-points">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CreditCard size={18} className="text-secondary" /> Award Loyalty Points
                  </h2>
                  <form onSubmit={handleAddPoints} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Loyalty Card Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input id="cardNumber" placeholder="Enter 10-digit card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseAmount">Purchase Amount ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input id="purchaseAmount" type="number" step="0.01" min="0.01" placeholder="0.00" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                      <div className="bg-accent/10 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Points to award</p>
                        <p className="text-2xl font-bold text-accent-foreground">{Math.floor(parseFloat(purchaseAmount) / 2)}</p>
                        <p className="text-[10px] text-muted-foreground">1 point per $2 spent</p>
                      </div>
                    )}
                    <Button type="submit" variant="hero" className="w-full gap-2" disabled={submitting}>
                      <CheckCircle size={16} />
                      {submitting ? "Processing..." : "Award Points"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* Stamp Cards / Gamification */}
              <TabsContent value="stamps" className="space-y-4">
                {!canAccess("gamification") ? <LockedFeature featureKey="gamification" /> : (
                  <>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Stamp size={20} className="text-primary" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Stamp Card</p>
                            <p className="text-xs text-muted-foreground">Reward customers after purchases</p>
                          </div>
                        </div>
                        <Switch checked={stampEnabled} onCheckedChange={setStampEnabled} />
                      </div>
                      {stampEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Stamps Required</Label><Input type="number" min="2" max="50" value={stampsRequired} onChange={e => setStampsRequired(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward</Label><Input value={stampReward} onChange={e => setStampReward(e.target.value)} /></div>
                        </div>
                      )}
                    </div>

                    {stampEnabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card text-center">
                          <p className="text-2xl font-bold text-foreground">{stampStats.active}</p>
                          <p className="text-[11px] text-muted-foreground">Active Cards</p>
                        </div>
                        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card text-center">
                          <p className="text-2xl font-bold text-foreground">{stampStats.completed}</p>
                          <p className="text-[11px] text-muted-foreground">Completed Cards</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Flame size={20} className="text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Visit Streaks</p>
                            <p className="text-xs text-muted-foreground">Bonus for consecutive visits</p>
                          </div>
                        </div>
                        <Switch checked={streakEnabled} onCheckedChange={setStreakEnabled} />
                      </div>
                      {streakEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Threshold</Label><Input type="number" min="2" max="30" value={streakThreshold} onChange={e => setStreakThreshold(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward</Label><Input value={streakReward} onChange={e => setStreakReward(e.target.value)} /></div>
                        </div>
                      )}
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy size={20} className="text-yellow-500" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Customer Levels</p>
                            <p className="text-xs text-muted-foreground">Tiered levels based on points</p>
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

                    <Button variant="hero" size="sm" className="gap-1.5" onClick={saveGamification} disabled={savingGamification}>
                      <Save size={14} /> {savingGamification ? "Saving..." : "Save Settings"}
                    </Button>
                  </>
                )}
              </TabsContent>

              {/* QR Scanner */}
              <TabsContent value="scanner">
                <StampQrScanner merchantId={merchantId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPoints;
