import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, ChevronDown, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import PlanBadge from "@/components/merchant/PlanBadge";
import type { PlanTier } from "@/lib/features";

interface MerchantRow {
  merchant_id: string;
  store_name: string;
  email: string;
  current_plan: string;
  plan_status: string;
  customer_count: number;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface OverrideRow {
  allow_campaigns: boolean;
  allow_rewards: boolean;
  allow_analytics: boolean;
  allow_ai_suggestions: boolean;
  allow_pos_integration: boolean;
  allow_advanced_reports: boolean;
  allow_gamification: boolean;
  allow_birthday_offers: boolean;
  allow_monthly_offers: boolean;
  allow_priority_support: boolean;
}

const OVERRIDE_LABELS: Record<keyof OverrideRow, string> = {
  allow_campaigns: "Campaigns",
  allow_rewards: "Rewards",
  allow_analytics: "Analytics",
  allow_ai_suggestions: "AI Suggestions",
  allow_pos_integration: "POS Integration",
  allow_advanced_reports: "Advanced Reports",
  allow_gamification: "Gamification",
  allow_birthday_offers: "Birthday Offers",
  allow_monthly_offers: "Monthly Offers",
  allow_priority_support: "Priority Support",
};

const SubscriptionsTab = () => {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Override dialog
  const [overrideMerchant, setOverrideMerchant] = useState<MerchantRow | null>(null);
  const [overrides, setOverrides] = useState<OverrideRow | null>(null);
  const [savingOverrides, setSavingOverrides] = useState(false);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_get_all_merchants_with_plans");
    if (error) {
      toast.error("Failed to load merchants");
      setLoading(false);
      return;
    }
    setMerchants((data as MerchantRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const changePlan = async (merchantId: string, newPlan: string) => {
    const { error } = await supabase
      .from("merchant_subscriptions")
      .update({ current_plan: newPlan })
      .eq("merchant_id", merchantId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Plan changed to ${newPlan}`);
    fetchMerchants();
  };

  const toggleTrial = async (merchantId: string, currentStatus: string) => {
    const isTrial = currentStatus === "trial";
    const updates = isTrial
      ? { status: "active", trial_start_date: null, trial_end_date: null }
      : {
          status: "trial",
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 14 * 86400000).toISOString(),
        };

    const { error } = await supabase
      .from("merchant_subscriptions")
      .update(updates)
      .eq("merchant_id", merchantId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isTrial ? "Trial ended" : "14-day trial activated");
    fetchMerchants();
  };

  const toggleCancel = async (merchantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "cancelled" ? "active" : "cancelled";
    const { error } = await supabase
      .from("merchant_subscriptions")
      .update({ status: newStatus })
      .eq("merchant_id", merchantId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(newStatus === "cancelled" ? "Subscription cancelled" : "Subscription reactivated");
    fetchMerchants();
  };

  const openOverrides = async (m: MerchantRow) => {
    setOverrideMerchant(m);
    const { data } = await supabase
      .from("merchant_feature_overrides")
      .select("*")
      .eq("merchant_id", m.merchant_id)
      .maybeSingle();

    const defaults: OverrideRow = {
      allow_campaigns: false, allow_rewards: false, allow_analytics: false,
      allow_ai_suggestions: false, allow_pos_integration: false, allow_advanced_reports: false,
      allow_gamification: false, allow_birthday_offers: false, allow_monthly_offers: false,
      allow_priority_support: false,
    };
    setOverrides(data ? { ...defaults, ...data } : defaults);
  };

  const saveOverrides = async () => {
    if (!overrideMerchant || !overrides) return;
    setSavingOverrides(true);

    const { error } = await supabase
      .from("merchant_feature_overrides")
      .upsert({
        merchant_id: overrideMerchant.merchant_id,
        ...overrides,
      }, { onConflict: "merchant_id" });

    setSavingOverrides(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Feature overrides saved");
    setOverrideMerchant(null);
  };

  const filtered = merchants.filter((m) => {
    const matchesSearch =
      m.store_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === "all" || m.current_plan === filterPlan;
    const matchesStatus = filterStatus === "all" || m.plan_status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading merchants...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merchant Cards */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No merchants found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.merchant_id} className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{m.store_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {m.customer_count} customers · Since {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <PlanBadge plan={m.current_plan as PlanTier} status={m.plan_status} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={m.current_plan}
                  onValueChange={(val) => changePlan(m.merchant_id, val)}
                >
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => toggleTrial(m.merchant_id, m.plan_status)}
                >
                  {m.plan_status === "trial" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {m.plan_status === "trial" ? "End Trial" : "Start Trial"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => toggleCancel(m.merchant_id, m.plan_status)}
                >
                  {m.plan_status === "cancelled" ? "Reactivate" : "Cancel"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => openOverrides(m)}
                >
                  <Settings2 size={14} />
                  Overrides
                </Button>
              </div>

              {m.plan_status === "trial" && m.trial_end_date && (
                <p className="text-[10px] text-muted-foreground">
                  Trial ends: {new Date(m.trial_end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overrides Dialog */}
      <Dialog open={!!overrideMerchant} onOpenChange={(open) => !open && setOverrideMerchant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feature Overrides</DialogTitle>
            <DialogDescription>
              {overrideMerchant?.store_name} — Override plan restrictions for specific features.
            </DialogDescription>
          </DialogHeader>

          {overrides && (
            <div className="space-y-3 py-2">
              {(Object.keys(OVERRIDE_LABELS) as (keyof OverrideRow)[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{OVERRIDE_LABELS[key]}</Label>
                  <Switch
                    checked={overrides[key]}
                    onCheckedChange={(val) =>
                      setOverrides((prev) => prev ? { ...prev, [key]: val } : prev)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOverrideMerchant(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveOverrides} disabled={savingOverrides}>
              {savingOverrides ? "Saving..." : "Save Overrides"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsTab;
