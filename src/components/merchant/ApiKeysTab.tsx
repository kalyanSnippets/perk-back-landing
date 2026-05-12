import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Key, Copy, RefreshCw, Trash2, ShieldAlert, Activity, ShieldCheck, ShieldOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface ApiKeysTabProps {
  merchantId: string;
}

interface KeyInfo {
  api_key_prefix: string | null;
  api_key_created_at: string | null;
  api_key_last_used_at: string | null;
}

interface LogEntry {
  id: string;
  action: string;
  created_at: string;
}

const ApiKeysTab = ({ merchantId }: ApiKeysTabProps) => {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  // Optional MFA
  const [mfaFactors, setMfaFactors] = useState<{ id: string; status: string }[]>([]);
  const [mfaQr, setMfaQr] = useState<{ qr: string; factorId: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: l }] = await Promise.all([
      supabase
        .from("merchants")
        .select("api_key_prefix, api_key_created_at, api_key_last_used_at")
        .eq("id", merchantId)
        .maybeSingle(),
      supabase
        .from("merchant_api_key_log" as any)
        .select("id, action, created_at")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setKeyInfo(m as KeyInfo | null);
    setLog(((l as any) || []) as LogEntry[]);
    setLoading(false);
  }, [merchantId]);

  const refreshMfa = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setMfaFactors((data?.totp || []).map((f) => ({ id: f.id, status: f.status })));
  }, []);

  useEffect(() => { refresh(); refreshMfa(); }, [refresh, refreshMfa]);

  const handleGenerate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("generate_merchant_api_key" as any);
    setGenerating(false);
    if (error) { toast.error(error.message); return; }
    const payload = data as any;
    if (!payload?.success) { toast.error(payload?.error || "Failed to generate key"); return; }
    setShowKey(payload.api_key);
    refresh();
  };

  const handleRevoke = async () => {
    setRevoking(true);
    const { data, error } = await supabase.rpc("revoke_merchant_api_key" as any);
    setRevoking(false);
    if (error) { toast.error(error.message); return; }
    if (!(data as any)?.success) { toast.error((data as any)?.error || "Failed"); return; }
    toast.success("API key revoked");
    refresh();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleEnrollMfa = async () => {
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setMfaLoading(false);
    if (error) { toast.error(error.message); return; }
    setMfaQr({ qr: data.totp.qr_code, factorId: data.id, secret: data.totp.secret });
  };

  const handleVerifyMfa = async () => {
    if (!mfaQr || mfaCode.length !== 6) return;
    setMfaLoading(true);
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: mfaQr.factorId });
    if (chalErr) { setMfaLoading(false); toast.error(chalErr.message); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: mfaQr.factorId, challengeId: chal.id, code: mfaCode,
    });
    setMfaLoading(false);
    if (vErr) { toast.error(vErr.message); return; }
    toast.success("Two-step verification enabled");
    setMfaQr(null);
    setMfaCode("");
    refreshMfa();
  };

  const handleDisableMfa = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { toast.error(error.message); return; }
    toast.success("Two-step verification disabled");
    refreshMfa();
  };

  const verifiedFactor = mfaFactors.find((f) => f.status === "verified");

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading API keys…</div>;
  }

  return (
    <div className="space-y-5">
      {/* API Key card */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Key size={18} className="text-secondary" /> POS API Key
        </h2>
        <p className="text-xs text-muted-foreground">
          Use this key in your Point-of-Sale integration to award loyalty points via{" "}
          <code className="rounded bg-muted px-1">POST /api/loyalty/apply</code>. Keep it secret — anyone with the key can post transactions for your store.
        </p>

        {keyInfo?.api_key_prefix ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Active key</p>
                <p className="font-mono text-sm font-semibold text-foreground">{keyInfo.api_key_prefix}••••••••••</p>
              </div>
              <ShieldCheck size={20} className="text-green-500 shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <span>Created: {keyInfo.api_key_created_at ? new Date(keyInfo.api_key_created_at).toLocaleString() : "—"}</span>
              <span>Last used: {keyInfo.api_key_last_used_at ? new Date(keyInfo.api_key_last_used_at).toLocaleString() : "Never"}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground flex items-center gap-2">
            <ShieldOff size={16} /> No API key generated yet.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="hero" className="gap-2" disabled={generating}>
                <RefreshCw size={14} /> {keyInfo?.api_key_prefix ? "Rotate Key" : "Generate Key"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate a new API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  {keyInfo?.api_key_prefix
                    ? "Your existing key will be revoked immediately and any POS integration using it will stop working until updated."
                    : "You will see the new key once. Store it somewhere safe — it cannot be retrieved later."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGenerate}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {keyInfo?.api_key_prefix && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" disabled={revoking}>
                  <Trash2 size={14} /> Revoke
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
                  <AlertDialogDescription>Any POS integration using this key will stop working immediately.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevoke}>Revoke</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-secondary" /> Recent activity
        </h3>
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-border/40 text-sm">
            {log.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2">
                <span className="capitalize">{entry.action}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Two-step verification */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldAlert size={16} className="text-secondary" /> Two-step verification
        </h3>
        <p className="text-xs text-muted-foreground">
          Add an extra layer of security with a one-time code from your authenticator app (Google Authenticator, 1Password, Authy, etc.).
        </p>

        {verifiedFactor ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 text-sm text-foreground"><ShieldCheck size={16} className="text-green-500" /> Two-step verification is enabled</div>
            <Button variant="outline" size="sm" onClick={() => handleDisableMfa(verifiedFactor.id)}>Disable</Button>
          </div>
        ) : (
          <Button variant="hero" size="sm" onClick={handleEnrollMfa} disabled={mfaLoading}>
            Enable two-step verification
          </Button>
        )}
      </div>

      {/* New key reveal dialog */}
      <Dialog open={!!showKey} onOpenChange={(open) => !open && setShowKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              Copy this key now — you won't be able to see it again. Store it in your POS system's secure settings.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 font-mono text-xs break-all">
            {showKey}
          </div>
          <Button variant="hero" className="w-full gap-2" onClick={() => showKey && copyToClipboard(showKey)}>
            <Copy size={14} /> Copy to clipboard
          </Button>
        </DialogContent>
      </Dialog>

      {/* MFA enrol dialog */}
      <Dialog open={!!mfaQr} onOpenChange={(open) => !open && setMfaQr(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up two-step verification</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code shown.
            </DialogDescription>
          </DialogHeader>
          {mfaQr && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <img src={mfaQr.qr} alt="MFA QR" className="w-48 h-48 rounded-xl border border-border" />
              </div>
              <p className="text-[11px] text-center text-muted-foreground">Or enter this secret manually: <code>{mfaQr.secret}</code></p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg font-mono tracking-widest"
                placeholder="123456"
              />
              <Button variant="hero" className="w-full" onClick={handleVerifyMfa} disabled={mfaCode.length !== 6 || mfaLoading}>
                {mfaLoading ? "Verifying…" : "Verify & enable"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeysTab;
