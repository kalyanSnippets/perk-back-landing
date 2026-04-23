import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Plus, Trash2, ToggleLeft, ToggleRight, ShoppingBag, Footprints, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import {
  PROMOTION_REWARD_OPTIONS,
  PROMOTION_RULE_OPTIONS,
  formatPromotionReward,
  formatPromotionSummary,
  getRewardTypeLabel,
} from "@/lib/rewardFormatting";

interface PromotionRule {
  id: string;
  rule_type: string;
  trigger_count: number;
  reward_description: string;
  reward_type: string;
  reward_value: string;
  active: boolean;
}

const RULE_TYPES = PROMOTION_RULE_OPTIONS.map((option) => ({
  ...option,
  icon: option.value === "visit_x_get_y" ? Footprints : option.value === "buy_x_get_y" ? ShoppingBag : DollarSign,
}));

const REWARD_TYPES = PROMOTION_REWARD_OPTIONS;

const MerchantPromotions = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<PromotionRule[]>([]);
  const [saving, setSaving] = useState(false);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  // New rule form
  const [showForm, setShowForm] = useState(false);
  const [ruleType, setRuleType] = useState("visit_x_get_y");
  const [triggerCount, setTriggerCount] = useState("10");
  const [rewardDesc, setRewardDesc] = useState("Free coffee");
  const [rewardType, setRewardType] = useState("free_item");
  const [rewardValue, setRewardValue] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);
      await fetchRules(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchRules = async (mid: string) => {
    const { data } = await supabase
      .from("promotion_rules")
      .select("*")
      .eq("merchant_id", mid)
      .order("created_at", { ascending: false });
    setRules((data as PromotionRule[]) || []);
  };

  const handleCreate = async () => {
    if (!merchantId) return;
    setSaving(true);
    const { error } = await supabase.from("promotion_rules").insert({
      merchant_id: merchantId,
      rule_type: ruleType,
      trigger_count: parseInt(triggerCount) || 10,
      reward_description: rewardDesc.trim() || "Free item",
      reward_type: rewardType,
      reward_value: rewardValue.trim(),
      active: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Promotion rule created!");
    setShowForm(false);
    setTriggerCount("10");
    setRewardDesc("Free coffee");
    setRewardValue("");
    await fetchRules(merchantId);
  };

  const toggleRule = async (rule: PromotionRule) => {
    const { error } = await supabase
      .from("promotion_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    if (error) { toast.error(error.message); return; }
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from("promotion_rules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rule deleted");
    setRules(prev => prev.filter(r => r.id !== id));
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const previewSummary = formatPromotionSummary({
    ruleType,
    triggerCount: parseInt(triggerCount) || 0,
    rewardDescription: rewardDesc || "Free item",
    rewardType,
    rewardValue,
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("promotions") ? (
            <LockedFeature featureKey="promotions" />
          ) : (
            <>
              <ScrollReveal>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">Smart Promotions</h1>
                  <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                    <Plus size={14} /> New Rule
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Create "Buy X Get Y" rules to drive repeat visits.</p>
              </ScrollReveal>

              {/* Create Form */}
              {showForm && (
                <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4 animate-fade-up">
                  <h3 className="text-sm font-bold text-foreground">New Promotion Rule</h3>

                  {/* Rule Type */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">When a customer...</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {RULE_TYPES.map(rt => (
                        <button key={rt.value}
                          onClick={() => setRuleType(rt.value)}
                          className={`rounded-xl p-3 text-center border transition-all text-xs font-medium ${
                            ruleType === rt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <rt.icon size={18} className="mx-auto mb-1" />
                          {rt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {ruleType === "spend_x_get_y" ? "Amount ($)" : "Count"}
                      </Label>
                      <Input type="number" min="1" value={triggerCount} onChange={e => setTriggerCount(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label>
                      <select
                        value={rewardType}
                        onChange={e => setRewardType(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {REWARD_TYPES.map(rt => (
                          <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reward Description</Label>
                      <Input value={rewardDesc} onChange={e => setRewardDesc(e.target.value)} placeholder="Free coffee" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Value (optional)</Label>
                      <Input value={rewardValue} onChange={e => setRewardValue(e.target.value)} placeholder="e.g. 10% or 50 pts" />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Preview</p>
                      <p className="text-sm font-semibold text-foreground mt-1">{previewSummary}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                    <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving} className="flex-1 gap-1.5">
                      <Save size={14} /> {saving ? "Creating..." : "Create Rule"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rules List */}
              {rules.length === 0 && !showForm && (
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card text-center">
                  <ShoppingBag size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No promotion rules yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first "Buy X Get Y" rule to drive repeat visits.</p>
                </div>
              )}

              {rules.map(rule => (
                <div key={rule.id} className={`bg-card rounded-2xl p-5 border shadow-card transition-all ${rule.active ? "border-border/50" : "border-border/30 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {rule.rule_type === "spend_x_get_y"
                          ? `Spend $${rule.trigger_count}`
                          : `${ruleTypeLabel(rule.rule_type).replace("X", String(rule.trigger_count))}`}
                        {" → "}
                        <span className="text-primary">{rule.reward_description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRewardTypeLabel(rule.reward_type)}
                        {" • "}
                        {formatPromotionReward(rule.reward_type, rule.reward_description, rule.reward_value)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRule(rule)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {rule.active ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} />}
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantPromotions;
