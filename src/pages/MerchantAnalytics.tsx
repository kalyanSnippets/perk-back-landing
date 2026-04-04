import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Repeat, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Transaction {
  customer_id: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
}

const MerchantAnalytics = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      const { data: txData } = await supabase.from("transactions").select("customer_id, purchase_amount, points_awarded, transaction_date").eq("merchant_id", m.id);
      setTransactions(txData || []);
      setLoading(false);
    })();
  }, [navigate]);

  const stats = useMemo(() => {
    if (!transactions.length) return { customers: 0, revenue: 0, avgSpend: 0, repeatRate: 0 };
    const customerIds = [...new Set(transactions.map(t => t.customer_id))];
    const revenue = transactions.reduce((s, t) => s + Number(t.purchase_amount), 0);
    const txByCustomer = new Map<string, number>();
    transactions.forEach(t => txByCustomer.set(t.customer_id, (txByCustomer.get(t.customer_id) || 0) + 1));
    const repeats = [...txByCustomer.values()].filter(c => c > 1).length;
    return {
      customers: customerIds.length,
      revenue,
      avgSpend: transactions.length ? revenue / transactions.length : 0,
      repeatRate: customerIds.length ? (repeats / customerIds.length) * 100 : 0,
    };
  }, [transactions]);

  const dailyData = useMemo(() => {
    const now = new Date();
    const days: { date: string; transactions: number; points: number; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayTx = transactions.filter(t => t.transaction_date.startsWith(key));
      days.push({
        date: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        transactions: dayTx.length,
        points: dayTx.reduce((s, t) => s + t.points_awarded, 0),
        revenue: dayTx.reduce((s, t) => s + Number(t.purchase_amount), 0),
      });
    }
    return days;
  }, [transactions]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { count: number; spend: number }>();
    transactions.forEach(t => {
      const existing = map.get(t.customer_id) || { count: 0, spend: 0 };
      map.set(t.customer_id, { count: existing.count + 1, spend: existing.spend + Number(t.purchase_amount) });
    });
    return [...map.entries()]
      .sort((a, b) => b[1].spend - a[1].spend)
      .slice(0, 5)
      .map(([id, data]) => ({ id: id.slice(0, 8), ...data }));
  }, [transactions]);

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const kpis = [
    { label: "Total Customers", value: stats.customers, icon: Users, color: "text-primary" },
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-500" },
    { label: "Avg Transaction", value: `$${stats.avgSpend.toFixed(2)}`, icon: BarChart3, color: "text-secondary" },
    { label: "Repeat Rate", value: `${stats.repeatRate.toFixed(0)}%`, icon: Repeat, color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("analytics") ? (
            <LockedFeature featureKey="analytics" />
          ) : (
            <>
              <ScrollReveal>
                <h1 className="text-xl font-bold text-foreground mb-4">Analytics</h1>
              </ScrollReveal>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kpis.map(k => (
                  <div key={k.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
                    <k.icon size={18} className={`${k.color} mb-2`} />
                    <p className="text-lg font-bold text-foreground">{k.value}</p>
                    <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Transaction Trend */}
              <ScrollReveal delay={100}>
                <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                  <p className="text-sm font-semibold text-foreground mb-3">Daily Transactions (30 days)</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Line type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ScrollReveal>

              {/* Points Bar Chart */}
              <ScrollReveal delay={200}>
                <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                  <p className="text-sm font-semibold text-foreground mb-3">Points Awarded (30 days)</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="points" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ScrollReveal>

              {/* Top Customers */}
              <ScrollReveal delay={300}>
                <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
                  <p className="text-sm font-semibold text-foreground p-4 pb-2">Top Customers by Spend</p>
                  {topCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-4 pb-4">No transaction data yet</p>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {topCustomers.map((c, i) => (
                        <div key={c.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                            <span className="text-sm text-foreground font-medium">{c.id}...</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">${c.spend.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">{c.count} txns</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantAnalytics;
