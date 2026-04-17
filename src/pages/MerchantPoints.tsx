import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CreditCard, DollarSign, CheckCircle, Save,
  Stamp, Flame, Trophy, Coins, Receipt, Gift, Settings as SettingsIcon
} from "lucide-react";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import StampQrScanner from "@/components/merchant/StampQrScanner";
import CustomerSearch from "@/components/merchant/CustomerSearch";
import LockedFeature from "@/components/merchant/LockedFeature";
import RefundableTransactions from "@/components/merchant/RefundableTransactions";
import MerchantRedemptions from "@/pages/MerchantRedemptions";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const MerchantPoints = () => {
  const navigate = useNavigate();
  const { activeTab, setTab } = usePersistedTab("merchant.points.tab", "add-points");

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsPerDollar, setPointsPerDollar] = useState<number>(0.5);
  const [savingPpd, setSavingPpd] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    const { data: m } = await supabase.from("merchants").select("id, points_per_dollar" as any).eq("user_id", user.id).maybeSingle();
    if (!m) { navigate("/get-started"); return; }
    setMerchantId((m as any).id);
    setPointsPerDollar(Number((m as any).points_per_dollar ?? 0.5));

    const [gamRes, activeRes, completedRes] = await Promise.all([
      supabase.from("gamification_settings").select("*").eq("merchant_id", (m as any).id).maybeSingle(),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", (m as any).id).eq("completed", false),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", (m as any).id).eq("completed", true),
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
    if (!cardNumber.trim()) { toast.error("Card number is required"); return; }
    const amt = parseFloat(purchaseAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid purchase amount"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("add_points_to_customer", {
        _loyalty_card_number: cardNumber.trim(),
        _purchase_amount: amt,
        _merchant_id: merchantId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; customer_name?: string; points_awarded?: number };
      if (!result.success) { toast.error(result.error || "Failed to add points"); return; }
      toast.success(`Awarded ${result.points_awarded} points to ${result.customer_name}`);
      setCardNumber(""); setPurchaseAmount("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add points");
    } finally { setSubmitting(false); }
  };

  const savePointsPerDollar = async () => {
    if (!merchantId) return;
    if (pointsPerDollar < 0 || pointsPerDollar > 100) { toast.error("Must be between 0 and 100"); return; }
    setSavingPpd(true);
    const { error } = await supabase.from("merchants").update({ points_per_dollar: pointsPerDollar } as any).eq("id", merchantId);
    setSavingPpd(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Points rate saved");
  };

  const saveGamification = async () => {
    if (!merchantId) return;
    setSavingGamification(true);
    const { error } = await supabase.from("gamification_settings").upsert({
      merchant_id: merchantId, stamp_card_enabled: stampEnabled,
      stamps_required: parseInt(stampsRequired) || 10, stamp_reward: stampReward.trim() || "Free item",
      visit_streak_enabled: streakEnabled, streak_threshold: parseInt(streakThreshold) || 5,
      streak_reward: streakReward.trim() || "Bonus points", levels_enabled: levelsEnabled,
    }, { onConflict: "merchant_id" });
    setSavingGamification(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
  };

  const handleTabChange = setTab;

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

  const previewPoints = purchaseAmount && parseFloat(purchaseAmount) > 0
    ? Math.floor(parseFloat(purchaseAmount) * pointsPerDollar)
    : 0;

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

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <div className="-mx-4 lg:mx-0 px-4 lg:px-0 sticky top-16 lg:top-20 z-30 bg-muted/20 backdrop-blur-md py-2">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-hide h-auto p-1 bg-card border border-border/50 shadow-sm">
                  <TabsTrigger value="add-points" className="shrink-0">Add Points</TabsTrigger>
                  <TabsTrigger value="transactions" className="shrink-0">Transactions</TabsTrigger>
                  <TabsTrigger value="redemptions" className="shrink-0">Redemptions</TabsTrigger>
                  <TabsTrigger value="stamps" className="shrink-0">Stamp Cards</TabsTrigger>
                  <TabsTrigger value="scanner" className="shrink-0">QR Scanner</TabsTrigger>
                  <TabsTrigger value="settings" className="shrink-0">Settings</TabsTrigger>
                </TabsList>
              </div>

              {/* Add Points */}
              <TabsContent value="add-points">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <CreditCard size={18} className="text-secondary" /> Award Loyalty Points
                    </h2>
                    <span className="text-[11px] bg-secondary/10 text-secondary px-2 py-1 rounded-full font-semibold">
                      {pointsPerDollar} pts per $1
                    </span>
                  </div>

                  {/* Customer Search */}
                  <CustomerSearch merchantId={merchantId} onSelect={(num) => setCardNumber(num)} />

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
                    {previewPoints > 0 && (
                      <div className="bg-accent/10 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Points to award</p>
                        <p className="text-2xl font-bold text-accent-foreground">{previewPoints}</p>
                        <p className="text-[10px] text-muted-foreground">{pointsPerDollar} point{pointsPerDollar !== 1 ? "s" : ""} per $1 spent</p>
                      </div>
                    )}
                    <Button type="submit" variant="hero" className="w-full gap-2" disabled={submitting}>
                      <CheckCircle size={16} /> {submitting ? "Processing..." : "Award Points"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* Transactions (with refund) */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Receipt size={18} className="text-secondary" /> Recent Transactions
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Refund a transaction to reverse its points and stamps.</p>
                  </div>
                  <RefundableTransactions merchantId={merchantId} />
                </div>
              </TabsContent>

              {/* Redemptions (embedded) */}
              <TabsContent value="redemptions" className="space-y-4">
                <div className="bg-card rounded-2xl p-2 shadow-card border border-border/50">
                  <div className="-mt-20 sm:-mt-24 -mx-2 -mb-2 [&>div>div]:p-0 [&_header]:hidden">
                    <MerchantRedemptions />
                  </div>
                </div>
              </TabsContent>

              {/* Stamp Cards */}
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
              <TabsContent value="scanner" className="space-y-4">
                <CustomerSearch merchantId={merchantId} onSelect={(num) => setCardNumber(num)} />
                <StampQrScanner merchantId={merchantId} initialCardNumber={cardNumber} />
              </TabsContent>

              {/* Settings: Points-per-dollar */}
              <TabsContent value="settings" className="space-y-4">
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <SettingsIcon size={18} className="text-secondary" /> Points Earning Rate
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Customers will earn this many points for every $1 they spend at your store.
                    Defaults to 0.5 (1 point per $2). Common values: 1 = 1 pt/$1, 2 = 2 pts/$1, 0.1 = 1 pt/$10.
                  </p>
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="ppd">Points per $1</Label>
                    <Input
                      id="ppd"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={pointsPerDollar}
                      onChange={(e) => setPointsPerDollar(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bg-accent/10 rounded-xl p-3 text-sm">
                    Example: $20 purchase → <strong>{Math.floor(20 * pointsPerDollar)} points</strong>
                  </div>
                  <Button variant="hero" size="sm" className="gap-1.5" onClick={savePointsPerDollar} disabled={savingPpd}>
                    <Save size={14} /> {savingPpd ? "Saving..." : "Save Rate"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPoints;
