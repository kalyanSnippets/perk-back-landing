import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Search, Receipt, Clock, User, CreditCard
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

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

const MerchantTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTx, setFilteredTx] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTx(transactions);
      return;
    }
    const q = search.toLowerCase();
    setFilteredTx(
      transactions.filter(
        (tx) =>
          (tx.customer_name || "").toLowerCase().includes(q) ||
          (tx.loyalty_card_number || "").includes(q) ||
          tx.id.toLowerCase().includes(q)
      )
    );
  }, [search, transactions]);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/merchant/auth"); return; }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!merchant) { navigate("/merchant/auth"); return; }

    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("transaction_date", { ascending: false });

    if (!txData || txData.length === 0) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Fetch customer details using security definer function
    const customerIds = [...new Set(txData.map((t) => t.customer_id))];
    const { data: customers } = await supabase.rpc("get_customers_by_ids", {
      _ids: customerIds,
    });

    const customerMap = new Map(
      (customers || []).map((c) => [c.id, c])
    );

    const enriched = txData.map((tx) => {
      const cust = customerMap.get(tx.customer_id);
      return {
        ...tx,
        customer_name: cust?.full_name || "Unknown",
        loyalty_card_number: cust?.loyalty_card_number || "—",
      };
    });

    setTransactions(enriched);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/merchant/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
          <Receipt className="text-primary-foreground" size={24} />
        </div>
        <p className="text-muted-foreground text-sm">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between h-14 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link to="/merchant/dashboard">
                <ArrowLeft size={16} />
              </Link>
            </Button>
            <span className="text-lg font-bold text-foreground">Transactions</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-3xl space-y-4 pb-20">
        {/* Search */}
        <ScrollReveal>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by customer name or card number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
        </ScrollReveal>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filteredTx.length} transaction{filteredTx.length !== 1 ? "s" : ""}
        </p>

        {/* Transactions list */}
        <ScrollReveal delay={100}>
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            {filteredTx.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No matching transactions" : "No transactions yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground flex items-center gap-1.5 truncate">
                        <User size={12} className="text-muted-foreground shrink-0" />
                        {tx.customer_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CreditCard size={10} />
                          {tx.loyalty_card_number}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.transaction_date).toLocaleDateString("en-AU", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <p className="text-sm font-bold text-foreground">${Number(tx.purchase_amount).toFixed(2)}</p>
                      <p className="text-xs font-semibold text-accent-foreground bg-accent/15 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                        +{tx.points_awarded} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default MerchantTransactions;
