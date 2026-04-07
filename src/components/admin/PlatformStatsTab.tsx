import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Store, Receipt, TrendingUp } from "lucide-react";

interface PlatformStats {
  totalMerchants: number;
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
}

const PlatformStatsTab = () => {
  const [stats, setStats] = useState<PlatformStats>({ totalMerchants: 0, totalCustomers: 0, totalTransactions: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [merchantsRes, customersRes, txRes] = await Promise.all([
        supabase.from("merchants").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("purchase_amount"),
      ]);

      const txData = txRes.data || [];
      const totalRevenue = txData.reduce((sum, t) => sum + Number(t.purchase_amount || 0), 0);

      setStats({
        totalMerchants: merchantsRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalTransactions: txData.length,
        totalRevenue,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center animate-pulse">Loading platform stats...</p>;

  const cards = [
    { label: "Total Merchants", value: stats.totalMerchants, icon: Store, color: "text-primary" },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-secondary" },
    { label: "Total Transactions", value: stats.totalTransactions, icon: Receipt, color: "text-accent-foreground" },
    { label: "Platform Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-secondary" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformStatsTab;
