import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Plus, ToggleLeft, ToggleRight, Trash2, Clock, Sparkles, Loader2, Image as ImageIcon, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  active: boolean;
  is_limited_time: boolean;
  expires_at: string | null;
  image_url: string | null;
}

interface AiSuggestion {
  title: string;
  description: string;
  reward_type: string;
  points_required: number;
  image_prompt: string;
}

const MerchantRewards = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState("100");
  const [rewardType, setRewardType] = useState("discount");
  const [isLimitedTime, setIsLimitedTime] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);
      await fetchRewards(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchRewards = async (mId: string) => {
    const { data } = await supabase.from("rewards").select("*").eq("merchant_id", mId).order("created_at", { ascending: false });
    setRewards((data || []) as Reward[]);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPointsRequired("100"); setRewardType("discount");
    setIsLimitedTime(false); setExpiresAt(""); setImageUrl("");
    setEditingRewardId(null); setShowForm(false);
  };

  const startEdit = (r: Reward) => {
    setEditingRewardId(r.id);
    setTitle(r.title);
    setDescription(r.description || "");
    setPointsRequired(String(r.points_required));
    setRewardType(r.reward_type);
    setIsLimitedTime(r.is_limited_time);
    setExpiresAt(r.expires_at ? r.expires_at.slice(0, 16) : "");
    setImageUrl(r.image_url || "");
    setShowForm(true);
  };

  const handleAiSuggest = async () => {
    if (!merchantId) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", {
        body: { merchant_id: merchantId, type: "suggest_reward" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setAiSuggestions(data?.suggestions || []);
      if (!data?.suggestions?.length) toast.info("No suggestions generated. Try again.");
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = (suggestion: AiSuggestion) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    setRewardType(suggestion.reward_type);
    setPointsRequired(String(suggestion.points_required));
    setEditingRewardId(null);
    setShowForm(true);
    setAiSuggestions([]);
    toast.success("Suggestion applied! You can edit before creating.");
    if (suggestion.image_prompt) {
      generateImage(suggestion.image_prompt);
    }
  };

  const generateImage = async (prompt: string) => {
    if (!merchantId) return;
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", {
        body: { merchant_id: merchantId, type: "generate_image", prompt },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.image_url) {
        setImageUrl(data.image_url);
        toast.success("Image generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !title.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      points_required: parseInt(pointsRequired) || 100,
      reward_type: rewardType,
      is_limited_time: isLimitedTime,
      expires_at: isLimitedTime && expiresAt ? new Date(expiresAt).toISOString() : null,
      image_url: imageUrl || null,
    };

    if (editingRewardId) {
      const { error } = await supabase.from("rewards").update(payload).eq("id", editingRewardId);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Reward updated");
    } else {
      const { error } = await supabase.from("rewards").insert({ ...payload, merchant_id: merchantId });
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Reward created");
    }

    resetForm();
    await fetchRewards(merchantId);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("rewards").update({ active: !current }).eq("id", id);
    if (merchantId) await fetchRewards(merchantId);
  };

  const deleteReward = async (id: string) => {
    await supabase.from("rewards").delete().eq("id", id);
    if (merchantId) await fetchRewards(merchantId);
    toast.success("Reward deleted");
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("rewards") ? (
            <LockedFeature featureKey="rewards" />
          ) : (
            <>
              <ScrollReveal>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h1 className="text-xl font-bold text-foreground">Rewards</h1>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAiSuggest} disabled={aiLoading}>
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      AI Suggest
                    </Button>
                    <Button variant="hero" size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                      <Plus size={14} /> New Reward
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/20 space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" /> AI Suggestions
                  </h3>
                  <div className="grid gap-2">
                    {aiSuggestions.map((s, i) => (
                      <button key={i} onClick={() => applyAiSuggestion(s)}
                        className="text-left bg-card rounded-xl p-3 border border-border/50 hover:border-primary/30 hover:-translate-y-0.5 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-foreground">{s.title}</p>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.points_required} pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 capitalize">{s.reward_type}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAiSuggestions([])} className="text-xs text-muted-foreground hover:text-foreground">
                    Dismiss suggestions
                  </button>
                </div>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{editingRewardId ? "Edit Reward" : "New Reward"}</h3>
                    {editingRewardId && (
                      <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <Input placeholder="Reward title" value={title} onChange={e => setTitle(e.target.value)} required />
                  <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Points Required</Label>
                      <Input type="number" min="1" value={pointsRequired} onChange={e => setPointsRequired(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label>
                      <Select value={rewardType} onValueChange={setRewardType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="freebie">Freebie</SelectItem>
                          <SelectItem value="voucher">Voucher</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* AI Image */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground block">Reward Image</Label>
                    {imageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border/50">
                        <img src={imageUrl} alt="Reward" className="w-full h-32 object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button type="button" variant="secondary" size="sm" className="h-7 text-[10px] gap-1" onClick={() => generateImage(title || "loyalty reward")} disabled={generatingImage}>
                            {generatingImage ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Regenerate
                          </Button>
                          <Button type="button" variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => setImageUrl("")}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => generateImage(title || description || "loyalty reward")} disabled={generatingImage || (!title && !description)}>
                        {generatingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        {generatingImage ? "Generating..." : "Generate AI Image"}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={isLimitedTime} onCheckedChange={setIsLimitedTime} />
                    <Label className="text-xs">Limited time offer</Label>
                  </div>
                  {isLimitedTime && (
                    <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" variant="hero" size="sm" disabled={saving}>
                      {saving ? "Saving..." : editingRewardId ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No rewards yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create rewards your customers can redeem with points.</p>
                  </div>
                ) : (
                  rewards.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {r.image_url && (
                          <img src={r.image_url} alt={r.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground">{r.title}</p>
                            <span className="text-[10px] bg-accent/15 text-accent-foreground px-1.5 py-0.5 rounded capitalize">{r.reward_type}</span>
                          </div>
                          {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-primary">{r.points_required} pts</span>
                            {r.is_limited_time && r.expires_at && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock size={9} /> Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-3">
                        <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-primary" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => toggleActive(r.id, r.active)} className="text-muted-foreground hover:text-foreground">
                          {r.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => deleteReward(r.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantRewards;
