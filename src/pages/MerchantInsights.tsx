import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, Receipt, Clock, User, CreditCard, Users, DollarSign, Star,
  Repeat, BarChart3, Download, CheckCircle, XCircle, Shield, Gift
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import LockedFeature from "@/components/merchant/LockedFeature";

import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Transaction {
  id: string;
  customer_id: string;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
  source: string | null;
  customer_name?: string;
  loyalty_card_number?: string;
}

interface RedemptionRow {
  id: string;
  customer_id: string;
  reward_title: string;
  points_spent: number;
  redemption_code: string;
  status: string;
  redeemed_at: string | null;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <span className="text-[10px] bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Verified</span>;
    case "expired":
      return <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Expired</span>;
    default:
      return <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending</span>;
  }
};

const MerchantInsights = () => {
  const navigate = useNavigate();
  const { activeTab, setTab } = usePersistedTab("merchant.insights.tab", "transactions");

  const [merchantId, setMerchantId] = useState<string>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  // Reports date range
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  // Redemption verify
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      // Parallel fetch
      const [txRes, redRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("merchant_id", m.id).order("transaction_date", { ascending: false }),
        supabase.from("redemptions").select("*").eq("merchant_id", m.id).order("created_at", { ascending: false }).limit(50),
      ]);

      const txData = txRes.data || [];
      if (txData.length > 0) {
        const customerIds = [...new Set(txData.map((t) => t.customer_id))];
        const { data: customers } = await supabase.rpc("get_customers_by_ids", { _ids: customerIds });
        const customerMap = new Map((customers || []).map((c) => [c.id, c]));
        const enriched = txData.map((tx) => {
          const cust = customerMap.get(tx.customer_id);
          return { ...tx, customer_name: cust?.full_name || "Unknown", loyalty_card_number: cust?.loyalty_card_number || "—" };
        });
        setTransactions(enriched);
      }

      setRedemptions((redRes.data as RedemptionRow[]) || []);
      setLoading(false);
    })();
  }, [navigate]);

  const filteredTx = useMemo(() => {
    if (!txSearch.trim()) return transactions;
    const q = txSearch.toLowerCase();
    return transactions.filter(
      (tx) =>
        (tx.customer_name || "").toLowerCase().includes(q) ||
        (tx.loyalty_card_number || "").includes(q)
    );
  }, [txSearch, transactions]);

  // Analytics computations
  const analyticsStats = useMemo(() => {
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

  // Reports filtering
  const reportFiltered = useMemo(() => {
    return transactions.filter(t => {
      const d = t.transaction_date.split("T")[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [transactions, dateFrom, dateTo]);

  const reportStats = useMemo(() => {
    const revenue = reportFiltered.reduce((s, t) => s + Number(t.purchase_amount), 0);
    const points = reportFiltered.reduce((s, t) => s + t.points_awarded, 0);
    const uniqueCustomers = new Set(reportFiltered.map(t => t.customer_id)).size;
    return { count: reportFiltered.length, revenue, points, uniqueCustomers };
  }, [reportFiltered]);

  const exportCSV = () => {
    const headers = ["Date", "Amount", "Points", "Source"];
    const rows = reportFiltered.map(t => [
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !code.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.rpc("verify_redemption", {
        _redemption_code: code.trim(),
        _merchant_id: merchantId,
      });
      if (error) throw error;
      const result = data as any;
      setVerifyResult(result);
      if (result.success) {
        toast.success(`Verified! ${result.reward_title} for ${result.customer_name}`);
        setCode("");
        const { data: redData } = await supabase.from("redemptions").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }).limit(50);
        setRedemptions((redData as RedemptionRow[]) || []);
      } else {
        toast.error(result.error || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };


  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const analyticsKpis = [
    { label: "Total Customers", value: analyticsStats.customers, icon: Users, color: "text-primary" },
    { label: "Total Revenue", value: `$${analyticsStats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-500" },
    { label: "Avg Transaction", value: `$${analyticsStats.avgSpend.toFixed(2)}`, icon: BarChart3, color: "text-secondary" },
    { label: "Repeat Rate", value: `${analyticsStats.repeatRate.toFixed(0)}%`, icon: Repeat, color: "text-orange-500" },
  ];

  const reportCards = [
    { label: "Transactions", value: reportStats.count, icon: Receipt },
    { label: "Revenue", value: `$${reportStats.revenue.toFixed(2)}`, icon: DollarSign },
    { label: "Points Awarded", value: reportStats.points.toLocaleString(), icon: Star },
    { label: "Unique Customers", value: reportStats.uniqueCustomers, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchantId} />
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Insights</h1>

            <Tabs value={activeTab} onValueChange={setTab}>
              <div className="-mx-4 lg:mx-0 px-4 lg:px-0 sticky top-16 lg:top-20 z-30 bg-muted/20 backdrop-blur-md py-2">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-hide h-auto p-1 bg-card border border-border/50 shadow-sm">
                  <TabsTrigger value="transactions" className="shrink-0">Transactions</TabsTrigger>
                  <TabsTrigger value="analytics" className="shrink-0">Analytics</TabsTrigger>
                  <TabsTrigger value="reports" className="shrink-0">Reports</TabsTrigger>
                  <TabsTrigger value="redemptions" className="shrink-0">Redemptions</TabsTrigger>
                </TabsList>
              </div>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input placeholder="Search by customer name or card number..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="pl-10 bg-card border-border/50" />
                </div>
                <p className="text-xs text-muted-foreground">{filteredTx.length} transaction{filteredTx.length !== 1 ? "s" : ""}</p>
                <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
                  {filteredTx.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">{txSearch ? "No matching transactions" : "No transactions yet"}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {filteredTx.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors duration-200">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground flex items-center gap-1.5 truncate">
                              <User size={12} className="text-muted-foreground shrink-0" />
                              {tx.customer_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><CreditCard size={10} />{tx.loyalty_card_number}</span>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(tx.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right pl-3 shrink-0">
                            <p className="text-sm font-bold text-foreground">${Number(tx.purchase_amount).toFixed(2)}</p>
                            <p className="text-xs font-semibold text-accent-foreground bg-accent/15 px-2 py-0.5 rounded-md mt-0.5 inline-block">+{tx.points_awarded} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                {!canAccess("analytics") ? (
                  <LockedFeature featureKey="analytics" />
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analyticsKpis.map(k => (
                        <div key={k.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
                          <k.icon size={18} className={`${k.color} mb-2`} />
                          <p className="text-lg font-bold text-foreground">{k.value}</p>
                          <p className="text-[11px] text-muted-foreground">{k.label}</p>
                        </div>
                      ))}
                    </div>
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
                  </>
                )}
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-4">
                {!canAccess("advanced_reports") ? (
                  <LockedFeature featureKey="advanced_reports" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-foreground">Reports</h2>
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={exportCSV} disabled={reportFiltered.length === 0}>
                        <Download size={14} /> Export CSV
                      </Button>
                    </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {reportCards.map(c => (
                        <div key={c.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
                          <c.icon size={18} className="text-primary mb-2" />
                          <p className="text-lg font-bold text-foreground">{c.value}</p>
                          <p className="text-[11px] text-muted-foreground">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Redemptions Tab */}
              <TabsContent value="redemptions" className="space-y-4">
                <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
                  <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-secondary" />
                    Enter Redemption Code
                  </h2>
                  <form onSubmit={handleVerify} className="flex gap-3">
                    <Input
                      placeholder="e.g. A1B2C3D4"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="font-mono text-lg tracking-wider uppercase"
                      maxLength={8}
                      required
                    />
                    <Button type="submit" variant="hero" disabled={verifying || !code.trim()} className="gap-2 shrink-0">
                      <Search size={16} />
                      {verifying ? "Verifying..." : "Verify"}
                    </Button>
                  </form>
                  {verifyResult && (
                    <div className={`mt-4 rounded-xl p-4 ${verifyResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                      {verifyResult.success ? (
                        <div className="text-center space-y-1">
                          <CheckCircle size={32} className="mx-auto text-green-500" />
                          <p className="font-bold text-foreground">{verifyResult.reward_title}</p>
                          <p className="text-sm text-muted-foreground">Customer: {verifyResult.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{verifyResult.points_spent} points redeemed</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <XCircle size={32} className="mx-auto text-destructive" />
                          <p className="font-bold text-foreground">{verifyResult.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
                  <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Gift size={16} className="text-accent" />
                    Recent Redemptions
                  </h2>
                  {redemptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No redemptions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {redemptions.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-foreground">{r.reward_title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground font-mono">{r.redemption_code}</span>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[11px] text-muted-foreground">{r.points_spent} pts</span>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                          <div className="pl-2">{statusBadge(r.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantInsights;
