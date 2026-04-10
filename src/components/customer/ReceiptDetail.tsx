import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Receipt, Package } from "lucide-react";

interface ReceiptItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string | null;
  category: string | null;
}

interface ReceiptDetailProps {
  transactionId: string;
  merchantName: string;
  purchaseAmount: number;
  transactionDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReceiptDetail = ({ transactionId, merchantName, purchaseAmount, transactionDate, open, onOpenChange }: ReceiptDetailProps) => {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("receipt_items")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("created_at", { ascending: true });
      setItems((data || []) as ReceiptItem[]);
      setLoading(false);
    })();
  }, [transactionId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            Receipt
          </DialogTitle>
          <DialogDescription>
            {merchantName} · {new Date(transactionDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6 animate-pulse">Loading receipt...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <Package size={28} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No itemised receipt available</p>
            <p className="text-xs text-muted-foreground mt-1">Total: ${Number(purchaseAmount).toFixed(2)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="divide-y divide-border/40">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                      {item.sku && ` · SKU: ${item.sku}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground pl-3">${Number(item.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Total</p>
              <p className="text-sm font-bold text-foreground">${Number(purchaseAmount).toFixed(2)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDetail;
