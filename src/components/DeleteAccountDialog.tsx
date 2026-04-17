import { useEffect, useState } from "react";
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
import { AlertTriangle, Trash2, Heart, ShieldAlert, Store, User } from "lucide-react";
import { toast } from "sonner";

export type DeletionScope = "customer_only" | "merchant_only" | "all";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which dashboard the user opened the dialog from. Drives default scope + copy. */
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
  const [step, setStep] = useState(0); // 0 = scope selector (only when both exist)
  const [hasMerchant, setHasMerchant] = useState(false);
  const [hasCustomer, setHasCustomer] = useState(false);
  const [scope, setScope] = useState<DeletionScope>(
    accountType === "merchant" ? "merchant_only" : "customer_only",
  );
  const [reason, setReason] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const reset = () => {
    setStep(0);
    setScope(accountType === "merchant" ? "merchant_only" : "customer_only");
    setReason("");
    setConfirmText("");
    setAcknowledged(false);
    setDeleting(false);
  };

  // When opened, look up which profiles this user actually has so we can
  // skip the scope step if there's nothing to choose between.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingProfiles(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [{ data: m }, { data: c }] = await Promise.all([
          supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        const merchantExists = !!m;
        const customerExists = !!c;
        setHasMerchant(merchantExists);
        setHasCustomer(customerExists);

        // Decide the starting step + default scope
        if (merchantExists && customerExists) {
          setStep(0); // scope selector
          setScope(accountType === "merchant" ? "merchant_only" : "customer_only");
        } else if (merchantExists) {
          setScope("merchant_only");
          setStep(1);
        } else if (customerExists) {
          setScope("customer_only");
          setStep(1);
        } else {
          setScope("all");
          setStep(1);
        }
      } finally {
        if (!cancelled) setLoadingProfiles(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, accountType]);

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
        body: { reason, scope },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || (data && (data as any).error)) {
        const msg = (data as any)?.error || error?.message || "Failed to delete account";
        toast.error(msg);
        setDeleting(false);
        return;
      }

      const authDeleted = (data as any)?.authDeleted === true;

      if (scope === "all" || authDeleted) {
        // Full account closure — sign out locally and redirect home
        try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
        try { sessionStorage.removeItem("perkback_role"); } catch {}
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("sb-") && k.includes("-auth-token")) localStorage.removeItem(k);
          });
        } catch {}
        toast.success("Your account has been permanently deleted.");
        navigate("/", { replace: true });
        setTimeout(() => { window.location.reload(); }, 100);
      } else {
        // Partial: keep the session, send them to the side they kept.
        const keptSide = scope === "merchant_only" ? "customer" : "merchant";
        try { sessionStorage.setItem("perkback_role", keptSide); } catch {}
        toast.success(
          scope === "merchant_only"
            ? "Your merchant store has been deleted. Your customer profile is still active."
            : "Your customer profile has been deleted. Your merchant store is still active.",
        );
        const target = keptSide === "merchant" ? "/merchant/dashboard" : "/customer/access-card";
        navigate(target, { replace: true });
        setTimeout(() => { window.location.reload(); }, 100);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      toast.error(msg);
      setDeleting(false);
    }
  };

  const merchantLossList = [
    "Your business profile, logo, and store details",
    "All campaigns, rewards, offers, and promotions",
    "All customer relationships and transaction history",
    "Your active subscription (cancelled immediately)",
    "POS integrations and NFC tap settings",
  ];
  const customerLossList = [
    "Your loyalty card, CRN, and points across every store",
    "All available rewards and pending redemptions",
    "Your transaction and stamp card history",
    "Wallet passes (Apple/Google Wallet)",
    "Your saved profile and personal information",
  ];
  const allLossList = [
    ...(hasMerchant ? merchantLossList : []),
    ...(hasCustomer ? customerLossList : []),
    "Your login — this email will be permanently removed",
  ];

  const dataLossList =
    scope === "merchant_only" ? merchantLossList
    : scope === "customer_only" ? customerLossList
    : allLossList;

  const scopeTitle =
    scope === "merchant_only" ? "Delete your merchant store?"
    : scope === "customer_only" ? "Delete your customer profile?"
    : "Close your entire account?";

  const reasonLossText =
    scope === "merchant_only" ? "your business data and customers"
    : scope === "customer_only" ? "your rewards and points"
    : "everything tied to this login";

  const showScopeStep = step === 0 && hasMerchant && hasCustomer;
  const totalSteps = showScopeStep || (hasMerchant && hasCustomer) ? 4 : 3;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const n = totalSteps === 4 ? i : i + 1; // when 3 steps, render steps 1..3
            const active = n === step;
            const past = n < step;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  active ? "w-8 bg-destructive"
                  : past ? "w-6 bg-destructive/60"
                  : "w-6 bg-muted"
                }`}
              />
            );
          })}
        </div>

        {loadingProfiles && (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        )}

        {/* STEP 0 — Scope selector (dual-role users only) */}
        {!loadingProfiles && showScopeStep && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-destructive" /> What would you like to delete?
              </DialogTitle>
              <DialogDescription>
                You have both a customer profile and a merchant store under this login. Choose what to remove.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as DeletionScope)}
              className="space-y-2"
            >
              <Label
                htmlFor="scope-customer"
                className="flex items-start gap-3 rounded-xl border border-border/50 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <RadioGroupItem id="scope-customer" value="customer_only" className="mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <User size={14} /> Just my customer profile
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Keep my merchant store and login.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="scope-merchant"
                className="flex items-start gap-3 rounded-xl border border-border/50 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <RadioGroupItem id="scope-merchant" value="merchant_only" className="mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Store size={14} /> Just my merchant store
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Keep my customer profile and login.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="scope-all"
                className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 cursor-pointer hover:bg-destructive/10 transition-colors"
              >
                <RadioGroupItem id="scope-all" value="all" className="mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <Trash2 size={14} /> Delete everything and close my account
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Removes both profiles and your login permanently.
                  </p>
                </div>
              </Label>
            </RadioGroup>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => setStep(1)}>Continue</Button>
            </div>
          </>
        )}

        {/* STEP 1 — Warning */}
        {!loadingProfiles && step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-destructive" /> {scopeTitle}
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => (hasMerchant && hasCustomer ? setStep(0) : handleClose())}
              >
                {hasMerchant && hasCustomer ? "Back" : "Cancel"}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 2 — Reason */}
        {!loadingProfiles && step === 2 && (
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
              Are you sure? You'll lose {reasonLossText}.
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
        {!loadingProfiles && step === 3 && (
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
