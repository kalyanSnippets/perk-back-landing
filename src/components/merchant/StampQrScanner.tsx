import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StampQrScannerProps {
  merchantId: string;
  initialCardNumber?: string;
}

const StampQrScanner = ({ merchantId, initialCardNumber }: StampQrScannerProps) => {
  const [cardNumber, setCardNumber] = useState(initialCardNumber || "");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (initialCardNumber) setCardNumber(initialCardNumber);
  }, [initialCardNumber]);

  const handleAwardStamp = async () => {
    if (!cardNumber.trim()) {
      toast.error("Enter a customer card number");
      return;
    }
    setProcessing(true);

    try {
      // Look up customer by card number
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("loyalty_card_number", cardNumber.trim())
        .maybeSingle();

      if (!customer) {
        toast.error("Customer not found");
        setProcessing(false);
        return;
      }

      // Process stamp via RPC
      const { data, error } = await supabase.rpc("process_stamp", {
        _customer_id: customer.id,
        _merchant_id: merchantId,
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        toast.error(result.error || "Failed to process stamp");
        return;
      }

      if (result.completed) {
        toast.success(`🎉 Stamp card completed! Customer earned ${result.bonus_points} bonus points!`);
      } else {
        toast.success(`Stamp added! ${result.stamps_collected}/${result.stamps_required}`);
      }
      setCardNumber("");
    } catch (err: any) {
      toast.error(err.message || "Failed to award stamp");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
          <ScanLine size={16} className="text-secondary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Award Stamp</p>
          <p className="text-xs text-muted-foreground">Enter a customer's card number to add a stamp</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={cardNumber}
          onChange={e => setCardNumber(e.target.value)}
          placeholder="Enter card number"
          className="flex-1"
        />
        <Button
          variant="hero"
          size="sm"
          onClick={handleAwardStamp}
          disabled={processing}
          className="gap-1.5"
        >
          {processing ? (
            "Processing..."
          ) : (
            <>
              <CheckCircle size={14} />
              Stamp
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StampQrScanner;
