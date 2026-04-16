import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Receipt, Undo2, Loader2, AlertCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TxRow {
  id: string;
  customer_id: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
  refunded_at: string | null;
  customer_name?: string;
}

interface RefundableTransactionsProps {
  merchantId: string;
}

const RefundableTransactions = ({ merchantId }: RefundableTransactionsProps) => {
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    const { data: txData } = await supabase
      .from("transactions")
      .select("id, customer_id, purchase_amount, points_awarded, transaction_date, refunded_at" as any)
      .eq("merchant_id", merchantId)
      .order("transaction_date", { ascending: false })
      .limit(20);

    const list = (txData || []) as any[];
    if (list.length > 0) {
      const ids = [...new Set(list.map(t => t.customer_id))];
      const { data: custs } = await supabase.rpc("get_customers_by_ids", { _ids: ids });
      const nameMap = new Map((custs || []).map((c: any) => [c.id, c.full_name]));
      setTxs(list.map(t => ({ ...t, customer_name: nameMap.get(t.customer_id) || "Customer" })));
    } else {
      setTxs([]);
    }
    setLoading(false);
  }, [merchantId]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  const handleRefund = async (txId: string) => {
    setRefunding(txId);
    try {
      const { data, error } = await supabase.rpc("refund_transaction" as any, { _tx_id: txId });
      if (error) throw error;
      const result = data as any;
      if (!result.success) { toast.error(result.error || "Refund failed"); return; }
      toast.success(`Refunded ${result.points_reversed} pts ($${Number(result.amount_reversed).toFixed(2)})`);
      await fetchTxs();
    } catch (err: any) {
      toast.error(err.message || "Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  if (loading) return <p className="text-xs text-muted-foreground animate-pulse text-center py-4">Loading transactions...</p>;
  if (txs.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>;

  return (
    <div className="space-y-2">
      {txs.map((t) => (
        <div key={t.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${t.refunded_at ? 'bg-muted/40 border-border/20 opacity-70' : 'bg-card border-border/30'}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Receipt size={14} className="text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${t.refunded_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {t.customer_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">${Number(t.purchase_amount).toFixed(2)}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[10px] text-accent-foreground font-semibold">+{t.points_awarded} pts</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(t.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
          {t.refunded_at ? (
            <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-1 rounded-full font-semibold shrink-0">Refunded</span>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0 h-8" disabled={refunding === t.id}>
                  {refunding === t.id ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                  Refund
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2"><AlertCircle size={18} className="text-destructive" /> Refund this transaction?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reverse <strong>{t.points_awarded} points</strong> and <strong>${Number(t.purchase_amount).toFixed(2)}</strong> for {t.customer_name}.
                    If a stamp was awarded for this purchase, it will also be removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRefund(t.id)} className="bg-destructive hover:bg-destructive/90">
                    Refund
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
};

export default RefundableTransactions;
