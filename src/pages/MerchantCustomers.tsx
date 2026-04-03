import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import ScrollReveal from "@/components/ScrollReveal";

interface Customer {
  id: string;
  full_name: string;
  loyalty_card_number: string;
  points_balance: number;
}

const MerchantCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }

      const { data: txData } = await supabase.from("transactions").select("customer_id").eq("merchant_id", m.id);
      const customerIds = [...new Set((txData || []).map(t => t.customer_id))];
      if (customerIds.length > 0) {
        const { data: custs } = await supabase.rpc("get_customers_by_ids", { _ids: customerIds });
        setCustomers((custs || []).map((c: any) => ({
          id: c.id, full_name: c.full_name || "Unknown", loyalty_card_number: c.loyalty_card_number || "—", points_balance: 0,
        })));
      }
      setLoading(false);
    })();
  }, [navigate]);

  const filtered = search.trim()
    ? customers.filter(c => c.full_name.toLowerCase().includes(search.toLowerCase()) || c.loyalty_card_number.includes(search))
    : customers;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading customers...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          <ScrollReveal>
            <h1 className="text-xl font-bold text-foreground">Customers</h1>
            <p className="text-xs text-muted-foreground">{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
          </ScrollReveal>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search by name or card number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border/50" />
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{search ? "No matching customers" : "No customers yet"}</p>
              </div>
            ) : (
              filtered.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{c.full_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><CreditCard size={10} /> {c.loyalty_card_number}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantCustomers;
