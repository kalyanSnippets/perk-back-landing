import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Receipt, Star, DollarSign,
  Plus, Settings, CreditCard,
  CheckCircle, X, TrendingUp, Megaphone, Gamepad2, Wifi,
  Gift, Sparkles, FileBarChart, Cake, CalendarHeart, BarChart3, ShoppingBag
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Header from "@/components/Header";
import PlanBadge from "@/components/merchant/PlanBadge";
import UpgradeBanner from "@/components/merchant/UpgradeBanner";
import CustomerLimitBanner from "@/components/merchant/CustomerLimitBanner";
import DashboardFeatureCard from "@/components/merchant/DashboardFeatureCard";
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

  const featureCards = [
    { icon: Users, label: "Customers", description: "View and manage your loyalty customers.", route: "/merchant/customers", featureKey: "customers" },
    { icon: Receipt, label: "Transactions", description: "Browse all transaction history.", route: "/merchant/transactions", featureKey: "transactions" },
    { icon: Plus, label: "Add Points", description: "Award loyalty points to customers.", featureKey: "add_points", onClick: () => setShowAddPoints(true) },
    { icon: Megaphone, label: "Campaigns", description: "Create targeted campaigns to boost retention.", route: "/merchant/campaigns", featureKey: "campaigns" },
    { icon: Gift, label: "Rewards", description: "Design custom rewards for your customers.", route: "/merchant/rewards", featureKey: "rewards" },
    { icon: TrendingUp, label: "Analytics", description: "Insights into customer behaviour and spending.", route: "/merchant/analytics", featureKey: "analytics" },
    { icon: Sparkles, label: "AI Suggestions", description: "AI-powered campaign ideas from your data.", route: "/merchant/ai-suggestions", featureKey: "ai_suggestions" },
    { icon: Gamepad2, label: "Gamification", description: "Stamp cards, streaks, and challenges.", route: "/merchant/gamification", featureKey: "gamification" },
    { icon: ShoppingBag, label: "Promotions", description: "Smart 'Buy X Get Y' promotion rules.", route: "/merchant/promotions", featureKey: "promotions" },
    { icon: Cake, label: "Birthday Offers", description: "Automatic birthday rewards for customers.", route: "/merchant/birthday-offers", featureKey: "birthday_offers" },
    { icon: CalendarHeart, label: "Monthly Offers", description: "Recurring monthly promotions.", route: "/merchant/monthly-offers", featureKey: "monthly_offers" },
    { icon: Wifi, label: "POS Integration", description: "Connect Square POS to auto-sync transactions.", route: "/merchant/pos", featureKey: "pos_integration" },
    { icon: FileBarChart, label: "Reports", description: "Export detailed reports and analytics.", route: "/merchant/reports", featureKey: "advanced_reports" },
    { icon: CheckCircle, label: "Redemptions", description: "Verify customer reward redemption codes.", route: "/merchant/redemptions", featureKey: "rewards" },
    { icon: Settings, label: "Settings", description: "Manage your business profile and account.", route: "/merchant/settings", featureKey: "settings" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* Feature Cards Grid */}
          <ScrollReveal delay={150}>
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featureCards.map((card) => (
                  <DashboardFeatureCard
                    key={card.featureKey}
                    icon={card.icon}
                    label={card.label}
                    description={card.description}
                    route={card.route}
                    featureKey={card.featureKey}
                    isLocked={!canAccess(card.featureKey)}
                    onClick={card.onClick}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Add Points Modal */}
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
  );
};

export default MerchantDashboard;
