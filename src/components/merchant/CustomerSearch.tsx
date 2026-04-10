import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Phone, User, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerResult {
  customer_id: string;
  full_name: string | null;
  loyalty_card_number: string | null;
}

interface CustomerSearchProps {
  merchantId: string;
  onSelect: (cardNumber: string) => void;
}

const CustomerSearch = ({ merchantId, onSelect }: CustomerSearchProps) => {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setPhone(value);
    if (value.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase.rpc("search_customer_by_phone", {
      _merchant_id: merchantId,
      _phone: value.trim(),
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
        <p className="text-xs font-semibold text-foreground">Find Customer by Phone</p>
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
        <Input
          placeholder="Enter phone number..."
          value={phone}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>
      {searching && <p className="text-[10px] text-muted-foreground animate-pulse">Searching...</p>}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.customer_id}
              onClick={() => {
                if (r.loyalty_card_number) {
                  onSelect(r.loyalty_card_number);
                  setPhone("");
                  setResults([]);
                }
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{r.full_name || "Customer"}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <CreditCard size={9} /> {r.loyalty_card_number}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {phone.length >= 3 && !searching && results.length === 0 && (
        <p className="text-[10px] text-muted-foreground">No customers found with this phone number</p>
      )}
    </div>
  );
};

export default CustomerSearch;
