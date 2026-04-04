import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileBarChart, Download, Users, DollarSign, Star, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Transaction {
  id: string;
  customer_id: string;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
  source: string | null;
}

const MerchantReports = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      const { data: txData } = await supabase.from("transactions").select("*").eq("merchant_id", m.id).order("transaction_date", { ascending: false });
      setTransactions(txData || []);
      setLoading(false);
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = t.transaction_date.split("T")[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [transactions, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const revenue = filtered.reduce((s, t) => s + Number(t.purchase_amount), 0);
    const points = filtered.reduce((s, t) => s + t.points_awarded, 0);
    const uniqueCustomers = new Set(filtered.map(t => t.customer_id)).size;
    return { count: filtered.length, revenue, points, uniqueCustomers };
  }, [filtered]);

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => {
      const d = t.transaction_date.split("T")[0];
      map.set(d, (map.get(d) || 0) + Number(t.purchase_amount));
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      revenue,
    }));
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date", "Amount", "Points", "Source"];
    const rows = filtered.map(t => [
      new Date(t.transaction_date).toLocaleDateString("en-AU"),
      Number(t.purchase_amount).toFixed(2),
      t.points_awarded,
      t.source || "dashboard",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perkback-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const summaryCards = [
    { label: "Transactions", value: stats.count, icon: Receipt },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign },
    { label: "Points Awarded", value: stats.points.toLocaleString(), icon: Star },
    { label: "Unique Customers", value: stats.uniqueCustomers, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("advanced_reports") ? (
            <LockedFeature featureKey="advanced_reports" />
          ) : (
            <>
              <ScrollReveal>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">Reports</h1>
                  <Button variant="hero" size="sm" className="gap-1.5" onClick={exportCSV} disabled={filtered.length === 0}>
                    <Download size={14} /> Export CSV
                  </Button>
                </div>
              </ScrollReveal>

              {/* Date Range */}
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card flex flex-wrap gap-3 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryCards.map(c => (
                  <div key={c.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
                    <c.icon size={18} className="text-primary mb-2" />
                    <p className="text-lg font-bold text-foreground">{c.value}</p>
                    <p className="text-[11px] text-muted-foreground">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Trend */}
              {dailyRevenue.length > 0 && (
                <ScrollReveal delay={100}>
                  <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                    <p className="text-sm font-semibold text-foreground mb-3">Revenue Trend</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(dailyRevenue.length / 7))} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* Transaction List */}
              <ScrollReveal delay={200}>
                <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
                  <p className="text-sm font-semibold text-foreground p-4 pb-2">Transactions ({filtered.length})</p>
                  {filtered.length === 0 ? (
                    <div className="text-center py-8">
                      <FileBarChart size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">No transactions in this date range</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                      {filtered.slice(0, 50).map(t => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">${Number(t.purchase_amount).toFixed(2)}</p>
                            <p className="text-[10px] text-accent-foreground">+{t.points_awarded} pts</p>
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

export default MerchantReports;
