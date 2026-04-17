import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Trash2, Heart, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "merchant" | "customer";
}

const REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using it enough" },
  { value: "found_alternative", label: "Found an alternative" },
  { value: "other", label: "Other" },
];

const DeleteAccountDialog = ({ open, onOpenChange, accountType }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reset = () => {
    setStep(1);
    setReason("");
    setConfirmText("");
    setAcknowledged(false);
    setDeleting(false);
  };

  const handleClose = () => {
    if (deleting) return;
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const canDelete = step === 3 && confirmText.trim() === "DELETE" && acknowledged;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        navigate("/get-started");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        body: { reason },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || (data && (data as any).error)) {
        const msg = (data as any)?.error || error?.message || "Failed to delete account";
        toast.error(msg);
        setDeleting(false);
        return;
      }

      // Force local session cleanup — server logout will 403 since user no longer exists
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
      try { sessionStorage.removeItem("perkback_role"); } catch {}
      // Clear any cached supabase auth tokens from localStorage as a safety net
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("sb-") && k.includes("-auth-token")) localStorage.removeItem(k);
        });
      } catch {}
      toast.success("Your account has been permanently deleted.");
      navigate("/", { replace: true });
      // Hard reload to flush any in-memory auth context
      setTimeout(() => { window.location.reload(); }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      toast.error(msg);
      setDeleting(false);
    }
  };

  const dataLossList = accountType === "merchant"
    ? [
        "Your business profile, logo, and store details",
        "All campaigns, rewards, offers, and promotions",
        "All customer relationships and transaction history",
        "Your active subscription (cancelled immediately)",
        "POS integrations and NFC tap settings",
      ]
    : [
        "Your loyalty card, CRN, and points across every store",
        "All available rewards and pending redemptions",
        "Your transaction and stamp card history",
        "Wallet passes (Apple/Google Wallet)",
        "Your profile and personal information",
      ];

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                n === step
                  ? "w-8 bg-destructive"
                  : n < step
                  ? "w-6 bg-destructive/60"
                  : "w-6 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* STEP 1 — Warning */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-destructive" /> Delete your account?
              </DialogTitle>
              <DialogDescription>
                This is permanent. Once you confirm, the following will be removed and cannot be recovered:
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm">
              {dataLossList.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/90">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 2 — Reason */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart size={20} className="text-primary" /> We're sorry to see you go
              </DialogTitle>
              <DialogDescription>
                Before you go, could you tell us why you're leaving? Your feedback helps us improve.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REASONS.map((r) => (
                <Label
                  key={r.value}
                  htmlFor={`reason-${r.value}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <RadioGroupItem id={`reason-${r.value}`} value={r.value} />
                  <span className="text-sm font-medium">{r.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground text-center">
              Are you sure? You'll lose all your{" "}
              {accountType === "merchant" ? "business data and customers" : "rewards and points"}.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!reason}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 3 — Final confirmation */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-destructive" /> Final confirmation
              </DialogTitle>
              <DialogDescription>
                To confirm permanent deletion, type <span className="font-mono font-bold text-destructive">DELETE</span> below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
              <Label
                htmlFor="acknowledge"
                className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 cursor-pointer"
              >
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(c) => setAcknowledged(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground/90">
                  I understand this action is <strong>permanent</strong> and cannot be undone.
                </span>
              </Label>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={deleting}>
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-1.5"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                {deleting ? "Deleting..." : "Delete forever"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
