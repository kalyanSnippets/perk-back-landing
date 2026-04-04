import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Search, CheckCircle, XCircle, Clock, Gift, Shield } from "lucide-react";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";

interface RedemptionRow {
  id: string;
  customer_id: string;
  reward_title: string;
  points_spent: number;
  redemption_code: string;
  status: string;
  redeemed_at: string | null;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <span className="text-[10px] bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Verified</span>;
    case "expired":
      return <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Expired</span>;
    default:
      return <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending</span>;
  }
};

const MerchantRedemptions = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; customer_name?: string; reward_title?: string; points_spent?: number; error?: string } | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/merchant/auth"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/merchant/auth"); return; }
      setMerchantId(m.id);
      await fetchRedemptions(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchRedemptions = useCallback(async (mId: string) => {
    const { data } = await supabase
      .from("redemptions")
      .select("*")
      .eq("merchant_id", mId)
      .order("created_at", { ascending: false })
      .limit(50);
    setRedemptions((data as RedemptionRow[]) || []);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !code.trim()) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const { data, error } = await supabase.rpc("verify_redemption", {
        _redemption_code: code.trim(),
        _merchant_id: merchantId,
      });
      if (error) throw error;
      const result = data as any;
      setVerifyResult(result);
      if (result.success) {
        toast.success(`Verified! ${result.reward_title} for ${result.customer_name}`);
        setCode("");
        await fetchRedemptions(merchantId);
      } else {
        toast.error(result.error || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <BackToDashboard />

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Redemptions</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">Verify Rewards</h1>
          </div>

          {/* Verify Code Form */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield size={16} className="text-secondary" />
              Enter Redemption Code
            </h2>
            <form onSubmit={handleVerify} className="flex gap-3">
              <Input
                placeholder="e.g. A1B2C3D4"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-wider uppercase"
                maxLength={8}
                required
              />
              <Button type="submit" variant="hero" disabled={verifying || !code.trim()} className="gap-2 shrink-0">
                <Search size={16} />
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </form>

            {verifyResult && (
              <div className={`mt-4 rounded-xl p-4 ${verifyResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                {verifyResult.success ? (
                  <div className="text-center space-y-1">
                    <CheckCircle size={32} className="mx-auto text-green-500" />
                    <p className="font-bold text-foreground">{verifyResult.reward_title}</p>
                    <p className="text-sm text-muted-foreground">Customer: {verifyResult.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{verifyResult.points_spent} points redeemed</p>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <XCircle size={32} className="mx-auto text-destructive" />
                    <p className="font-bold text-foreground">{verifyResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Redemptions */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift size={16} className="text-accent" />
              Recent Redemptions
            </h2>
            {redemptions.length === 0 ? (
              <div className="text-center py-8">
                <Gift size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No redemptions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-foreground">{r.reward_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground font-mono">{r.redemption_code}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] text-muted-foreground">{r.points_spent} pts</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className="pl-2">{statusBadge(r.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantRedemptions;
