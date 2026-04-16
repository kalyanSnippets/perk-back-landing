import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, CreditCard, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerResult {
  customer_id: string;
  full_name: string | null;
  loyalty_card_number: string | null;
  crn: string | null;
  phone: string | null;
  email: string | null;
  is_linked: boolean;
}

interface CustomerSearchProps {
  merchantId: string;
  onSelect: (cardNumber: string) => void;
}

const CustomerSearch = ({ merchantId, onSelect }: CustomerSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase.rpc("search_customer_universal" as any, {
      _merchant_id: merchantId,
      _query: value.trim(),
    });
    setSearching(false);
    if (!error && data) {
      setResults(data as CustomerResult[]);
    }
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border/30 space-y-3">
      <div className="flex items-center gap-2">
        <Search size={14} className="text-secondary" />
        <p className="text-xs font-semibold text-foreground">Find Customer</p>
        <span className="text-[10px] text-muted-foreground">— by name, phone, email, card # or CRN</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
        <Input
          placeholder="Search customers..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>
      {searching && <p className="text-[10px] text-muted-foreground animate-pulse">Searching...</p>}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.customer_id}
              onClick={() => {
                if (r.loyalty_card_number) {
                  onSelect(r.loyalty_card_number);
                  setQuery("");
                  setResults([]);
                }
              }}
              disabled={!r.loyalty_card_number}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{r.full_name || "Customer"}</p>
                  {r.is_linked && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 size={8} /> Yours
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {r.loyalty_card_number && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CreditCard size={9} /> {r.loyalty_card_number}
                    </span>
                  )}
                  {r.phone && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Phone size={9} /> {r.phone}
                    </span>
                  )}
                  {r.email && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                      <Mail size={9} /> {r.email}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-[10px] text-muted-foreground">No customers found matching "{query}"</p>
      )}
    </div>
  );
};

export default CustomerSearch;
