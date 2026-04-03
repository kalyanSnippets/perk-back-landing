import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Receipt, Star, DollarSign,
  Plus, List, BarChart3, Settings, CreditCard,
  CheckCircle, X, TrendingUp, Megaphone, Gamepad2, Wifi
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import PlanBadge from "@/components/merchant/PlanBadge";
import UpgradeBanner from "@/components/merchant/UpgradeBanner";
import CustomerLimitBanner from "@/components/merchant/CustomerLimitBanner";
import LockedWidget from "@/components/merchant/LockedWidget";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface MerchantData {
  id: string;
  store_name: string;
}

interface KPIs {
  totalCustomers: number;
  transactionsToday: number;
  totalPointsAwarded: number;
  revenueToday: number;
}

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [kpis, setKpis] = useState<KPIs>({ totalCustomers: 0, transactionsToday: 0, totalPointsAwarded: 0, revenueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { plan, status, canAccess, customerLimit, loading: subLoading } = useMerchantSubscription(merchant?.id);

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/merchant/auth"); return null; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id, store_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!m) { navigate("/merchant/auth"); return null; }
    setMerchant(m);
    return m;
  }, [navigate]);

  const fetchKPIs = useCallback(async (merchantId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const { data: allTx } = await supabase
      .from("transactions")
      .select("customer_id, points_awarded, purchase_amount, transaction_date")
      .eq("merchant_id", merchantId);

    const txList = allTx || [];
    const uniqueCustomers = new Set(txList.map(t => t.customer_id));
    const totalPoints = txList.reduce((s, t) => s + (t.points_awarded || 0), 0);

    const todayTx = txList.filter(t => t.transaction_date >= todayISO);
    const revenueToday = todayTx.reduce((s, t) => s + Number(t.purchase_amount || 0), 0);

    setKpis({
      totalCustomers: uniqueCustomers.size,
      transactionsToday: todayTx.length,
      totalPointsAwarded: totalPoints,
      revenueToday,
    });
  }, []);

  useEffect(() => {
    let merchantRef: MerchantData | null = null;
    (async () => {
      const m = await fetchMerchant();
      merchantRef = m;
      if (m) await fetchKPIs(m.id);
      setLoading(false);
    })();

    const channel = supabase
      .channel('merchant-transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          if (merchantRef && payload.new.merchant_id === merchantRef.id) {
            fetchKPIs(merchantRef.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMerchant, fetchKPIs]);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("add_points_to_customer", {
        _loyalty_card_number: cardNumber.trim(),
        _purchase_amount: parseFloat(purchaseAmount),
        _merchant_id: merchant.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; customer_name?: string; points_awarded?: number };

      if (!result.success) {
        toast.error(result.error || "Failed to add points");
        return;
      }

      toast.success(`Awarded ${result.points_awarded} points to ${result.customer_name}`);
      setCardNumber("");
      setPurchaseAmount("");
      setShowAddPoints(false);
      await fetchKPIs(merchant.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to add points");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
          <BarChart3 className="text-primary-foreground" size={24} />
        </div>
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (!merchant) return null;

  const kpiCards = [
    { label: "Total Customers", value: kpis.totalCustomers, icon: Users, color: "text-secondary" },
    { label: "Transactions Today", value: kpis.transactionsToday, icon: Receipt, color: "text-secondary" },
    { label: "Total Points Awarded", value: kpis.totalPointsAwarded, icon: Star, color: "text-accent-foreground" },
    { label: "Revenue Today", value: `$${kpis.revenueToday.toFixed(2)}`, icon: DollarSign, color: "text-secondary" },
  ];

  const quickActions = [
    { label: "Add Points", icon: Plus, onClick: () => setShowAddPoints(true), primary: true },
    { label: "Transactions", icon: List, onClick: () => navigate("/merchant/transactions"), primary: false },
    { label: "Reports", icon: BarChart3, onClick: () => canAccess("advanced_reports") ? toast.info("Reports coming soon") : toast.info("Upgrade to Pro for Advanced Reports"), primary: false },
    { label: "Settings", icon: Settings, onClick: () => navigate("/merchant/settings"), primary: false },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchant.id} />
          <div className="flex-1 max-w-3xl space-y-6">
        {/* Store Title + Plan Badge */}
        <ScrollReveal>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Merchant Dashboard</p>
              <h1 className="text-2xl font-bold text-foreground mt-1">{merchant.store_name}</h1>
            </div>
            {!subLoading && <PlanBadge plan={plan} status={status} />}
          </div>
        </ScrollReveal>

        {/* Upgrade Banner */}
        {!subLoading && (plan === "free" || plan === "growth") && (
          <ScrollReveal delay={50}>
            <UpgradeBanner currentPlan={plan} />
          </ScrollReveal>
        )}

        {/* Customer Limit Banner */}
        {!subLoading && plan === "free" && (
          <CustomerLimitBanner currentCount={kpis.totalCustomers} limit={customerLimit} />
        )}

        {/* KPI Cards */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-2 gap-3">
            {kpiCards.map((kpi, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-5 shadow-card border border-border/50 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                    <kpi.icon size={16} className={kpi.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Growth-tier Locked Widgets (for Free users) */}
        {!subLoading && !canAccess("campaigns") && (
          <ScrollReveal delay={120}>
            <div className="grid grid-cols-2 gap-3">
              <LockedWidget featureKey="campaigns" label="Campaign Performance" icon={Megaphone} />
              <LockedWidget featureKey="analytics" label="Customer Analytics" icon={TrendingUp} />
            </div>
          </ScrollReveal>
        )}

        {/* Pro-tier Locked Widgets (for Free/Growth users) */}
        {!subLoading && !canAccess("gamification") && (
          <ScrollReveal delay={140}>
            <div className="grid grid-cols-2 gap-3">
              <LockedWidget featureKey="gamification" label="Gamification" icon={Gamepad2} />
              <LockedWidget featureKey="pos_integration" label="POS Integration" icon={Wifi} />
            </div>
          </ScrollReveal>
        )}

        {/* Quick Actions */}
        <ScrollReveal delay={150}>
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h2 className="text-sm font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card text-left ${
                    action.primary
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-transparent"
                      : "bg-muted/30 border-border/30 text-foreground hover:bg-muted/50"
                  }`}
                >
                  <action.icon size={20} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Add Points Modal/Card */}
        {showAddPoints && (
          <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-card rounded-2xl p-6 shadow-card-hover w-full max-w-md animate-fade-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Plus size={20} className="text-secondary" />
                  Add Points
                </h2>
                <button onClick={() => setShowAddPoints(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPoints} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Loyalty Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="cardNumber"
                      placeholder="Enter 10-digit card number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseAmount">Purchase Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="purchaseAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                  <div className="bg-accent/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Points to award</p>
                    <p className="text-2xl font-bold text-accent-foreground">
                      {Math.floor(parseFloat(purchaseAmount) / 2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">1 point per $2 spent</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddPoints(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1 gap-2" disabled={submitting}>
                    <CheckCircle size={16} />
                    {submitting ? "Processing..." : "Award Points"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    </div>
};

export default MerchantDashboard;
