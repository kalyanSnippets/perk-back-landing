import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Receipt, Star, DollarSign,
  BarChart3, Megaphone, Settings, Coins, Store, MapPin, Building2
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import PlanBadge from "@/components/merchant/PlanBadge";
import UpgradeBanner from "@/components/merchant/UpgradeBanner";
import CustomerLimitBanner from "@/components/merchant/CustomerLimitBanner";
import DashboardFeatureCard from "@/components/merchant/DashboardFeatureCard";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { getIndustryImage } from "@/lib/industryImages";

interface MerchantData {
  id: string;
  store_name: string;
  logo_url: string | null;
  industry_type: string | null;
  address: string | null;
  profile_image_url: string | null;
}

interface KPIs {
  totalCustomers: number;
  transactionsToday: number;
  totalPointsAwarded: number;
  revenueToday: number;
}

const KPI_STYLES = [
  { iconBg: "bg-secondary/15", iconColor: "text-secondary" },
  { iconBg: "bg-coral/15", iconColor: "text-coral" },
  { iconBg: "bg-accent/20", iconColor: "text-accent-foreground" },
  { iconBg: "bg-emerald-accent/15", iconColor: "text-emerald-accent" },
];

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [kpis, setKpis] = useState<KPIs>({ totalCustomers: 0, transactionsToday: 0, totalPointsAwarded: 0, revenueToday: 0 });
  const [loading, setLoading] = useState(true);

  const { plan, status, canAccess, customerLimit, loading: subLoading } = useMerchantSubscription(merchant?.id);

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/merchant/auth"); return null; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id, store_name, logo_url, industry_type, address, profile_image_url")
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

    return () => { supabase.removeChannel(channel); };
  }, [fetchMerchant, fetchKPIs]);

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
    { label: "Total Customers", value: kpis.totalCustomers, icon: Users },
    { label: "Transactions Today", value: kpis.transactionsToday, icon: Receipt },
    { label: "Total Points Awarded", value: kpis.totalPointsAwarded, icon: Star },
    { label: "Revenue Today", value: `$${kpis.revenueToday.toFixed(2)}`, icon: DollarSign },
  ];

  const featureCards = [
    { icon: Users, label: "Customers", description: "View and manage your loyalty customers.", route: "/merchant/customers", featureKey: "customers" },
    { icon: Coins, label: "Points & Stamps", description: "Add points, manage stamp cards.", route: "/merchant/points", featureKey: "add_points" },
    { icon: Receipt, label: "Insights", description: "Transactions, analytics & reports.", route: "/merchant/insights", featureKey: "transactions" },
    { icon: Megaphone, label: "Marketing", description: "Campaigns, rewards & promotions.", route: "/merchant/marketing", featureKey: "campaigns" },
    { icon: Settings, label: "Settings", description: "Business profile, POS & plan.", route: "/merchant/settings", featureKey: "settings" },
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
          <div className="flex-1 min-w-0 space-y-6">

            {/* Branded Banner */}
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-5 sm:p-6 shadow-card-hover">
                {/* Floating decorative shapes */}
                <div className="floating-circle w-20 h-20 border border-primary-foreground/10 -top-6 -right-6" style={{ animationDelay: "0s" }} />
                <div className="floating-circle w-14 h-14 border border-primary-foreground/8 -bottom-4 -left-4" style={{ animationDelay: "1s" }} />
                <div className="floating-dot w-4 h-4 bg-accent/30 top-4 right-[30%]" style={{ animationDelay: "2s" }} />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-primary-foreground/20 shrink-0">
                    {merchant.logo_url ? (
                      <img src={merchant.logo_url} alt={merchant.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <Store size={28} className="text-primary-foreground/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-primary-foreground/50 text-[10px] uppercase tracking-[0.15em]">Merchant Dashboard</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground truncate">{merchant.store_name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {merchant.industry_type && (
                        <span className="text-[10px] bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Building2 size={9} /> {merchant.industry_type}
                        </span>
                      )}
                      {merchant.address && (
                        <span className="text-[10px] text-primary-foreground/60 flex items-center gap-1 truncate">
                          <MapPin size={9} /> {merchant.address}
                        </span>
                      )}
                    </div>
                  </div>
                  {!subLoading && <PlanBadge plan={plan} status={status} variant="banner" />}
                </div>
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
                      <div className={`w-10 h-10 rounded-full ${KPI_STYLES[i].iconBg} flex items-center justify-center`}>
                        <kpi.icon size={18} className={KPI_STYLES[i].iconColor} />
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
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
