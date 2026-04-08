import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stamp, CheckCircle, PartyPopper } from "lucide-react";

interface StampCardProgressProps {
  customerId: string;
  merchantId: string;
  merchantName: string;
}

interface StampData {
  stamps_collected: number;
  stamps_required: number;
  reward_text: string;
  completed: boolean;
}

const StampCardProgress = ({ customerId, merchantId, merchantName }: StampCardProgressProps) => {
  const [stamp, setStamp] = useState<StampData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Check if merchant has stamp cards enabled
      const { data: settings } = await supabase
        .from("gamification_settings")
        .select("stamp_card_enabled, stamps_required, stamp_reward")
        .eq("merchant_id", merchantId)
        .maybeSingle();

      if (!settings?.stamp_card_enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }
      setEnabled(true);

      // Get active stamp card
      const { data: stampData } = await supabase
        .from("customer_stamps")
        .select("stamps_collected, stamps_required, reward_text, completed")
        .eq("customer_id", customerId)
        .eq("merchant_id", merchantId)
        .eq("completed", false)
        .maybeSingle();

      if (stampData) {
        setStamp(stampData);
      } else {
        // No active card yet - show empty one based on settings
        setStamp({
          stamps_collected: 0,
          stamps_required: settings.stamps_required,
          reward_text: settings.stamp_reward || "Free item",
          completed: false,
        });
      }
      setLoading(false);
    })();
  }, [customerId, merchantId]);

  // Listen for realtime updates
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`stamps-${customerId}-${merchantId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "customer_stamps",
        filter: `customer_id=eq.${customerId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (row && row.merchant_id === merchantId && !row.completed) {
          setStamp({
            stamps_collected: row.stamps_collected,
            stamps_required: row.stamps_required,
            reward_text: row.reward_text,
            completed: row.completed,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customerId, merchantId, enabled]);

  if (loading || !enabled || !stamp) return null;

  const remaining = stamp.stamps_required - stamp.stamps_collected;
  const filledStamps = Array.from({ length: stamp.stamps_required }, (_, i) => i < stamp.stamps_collected);

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stamp size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Stamp Card</p>
            <p className="text-[10px] text-muted-foreground">{merchantName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">
            {remaining > 0 ? `${remaining} more to go!` : "Complete!"}
          </p>
        </div>
      </div>

      {/* Stamp Grid */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {filledStamps.map((filled, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              filled
                ? "bg-primary text-primary-foreground scale-100"
                : "bg-muted/50 text-muted-foreground/30 border border-dashed border-muted-foreground/20"
            }`}
          >
            {filled ? (
              <CheckCircle size={16} />
            ) : (
              <span className="text-[10px] font-bold">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Reward */}
      <div className="bg-muted/30 rounded-xl p-2.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <PartyPopper size={12} className="text-accent-foreground" />
          <p className="text-[11px] font-semibold text-foreground">Reward: {stamp.reward_text}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {stamp.stamps_collected}/{stamp.stamps_required} stamps collected
        </p>
      </div>
    </div>
  );
};

export default StampCardProgress;
