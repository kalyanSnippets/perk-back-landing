import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Star, Calendar, Hash, User, CreditCard, ShieldCheck, ScanBarcode, Gift, Smartphone } from "lucide-react";
import Barcode from "@/components/Barcode";
import ScrollReveal from "@/components/ScrollReveal";

interface CustomerData {
  id: string;
  full_name: string | null;
  crn: string | null;
  loyalty_card_number: string | null;
  card_issued_at: string | null;
  points_balance: number;
}

interface TransactionData {
  id: string;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
}

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/customer/auth");
      return;
    }

    const { data: customerData, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !customerData) {
      navigate("/customer/auth");
      return;
    }

    if (!customerData.loyalty_card_number) {
      navigate("/customer/confirmation");
      return;
    }

    setCustomer(customerData);

    // Fetch transactions
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customerData.id)
      .order("transaction_date", { ascending: false });

    setTransactions(txData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/customer/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your card...</div>
      </div>
    );
  }

  if (!customer) return null;

  const issuedDate = customer.card_issued_at
    ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10 h-[400px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Perk <span className="text-secondary">Back</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
        {/* Loyalty Card */}
        <ScrollReveal>
          <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-primary-foreground shadow-card-hover relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-primary-foreground/5 translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-primary-foreground/60 text-xs uppercase tracking-widest mb-1">Loyalty Card</p>
                  <h2 className="text-2xl font-bold">Perk Back</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Star className="text-accent-foreground" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-primary-foreground/60 text-xs flex items-center gap-1"><User size={12} /> Full Name</p>
                  <p className="font-semibold">{customer.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-xs flex items-center gap-1"><Hash size={12} /> CRN</p>
                  <p className="font-semibold font-mono">{customer.crn}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-xs flex items-center gap-1"><CreditCard size={12} /> Card Number</p>
                  <p className="font-semibold font-mono text-sm">{customer.loyalty_card_number}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-xs flex items-center gap-1"><Calendar size={12} /> Issued</p>
                  <p className="font-semibold text-sm">{issuedDate}</p>
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-primary-foreground rounded-xl p-4 flex justify-center">
                <Barcode value={customer.loyalty_card_number || ""} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Points Balance */}
        <ScrollReveal delay={100}>
          <div className="mt-8 bg-card rounded-2xl p-8 shadow-card text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Points Balance</p>
            <div className="flex items-center justify-center gap-3">
              <Star className="text-accent fill-accent" size={32} />
              <span className="text-5xl font-bold text-foreground">{customer.points_balance}</span>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Keep earning to unlock rewards!</p>
          </div>
        </ScrollReveal>

        {/* Transactions */}
        <ScrollReveal delay={200}>
          <div className="mt-8 bg-card rounded-2xl p-8 shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-secondary" />
              Points Earned
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                <p>No transactions yet.</p>
                <p className="text-sm mt-1">Visit a partner store to start earning!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-200"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{tx.merchant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${tx.purchase_amount.toFixed(2)} •{" "}
                        {new Date(tx.transaction_date).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-secondary">+{tx.points_awarded}</span>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* How to claim */}
        <ScrollReveal delay={300}>
          <div className="mt-8 bg-card rounded-2xl p-8 shadow-card mb-12">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Gift size={20} className="text-accent" />
              Ways to Claim Points
            </h3>
            <ul className="space-y-4">
              {[
                { icon: ScanBarcode, text: "Show your loyalty barcode or number at checkout" },
                { icon: Smartphone, text: "Merchant scans or enters your number" },
                { icon: Star, text: "Points are added instantly" },
                { icon: Gift, text: "Track your rewards anytime in Perk Back" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-foreground">
                  <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-accent-foreground" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default AccessCard;
