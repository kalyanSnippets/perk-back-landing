import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Gift, Clock,
  ShoppingBag, Footprints, DollarSign, Save, Cake, CalendarHeart,
  Sparkles, Loader2, Target, TrendingUp, Send, Pencil, X,
  Image as ImageIcon
} from "lucide-react";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import LockedFeature from "@/components/merchant/LockedFeature";
import ProductOffersTab from "@/components/merchant/ProductOffersTab";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import {
  campaignSchema, rewardSchema, promotionSchema,
  monthlyOfferSchema, birthdaySchema, firstZodError,
} from "@/lib/validationSchemas";

// ── Types ──
interface Campaign { id: string; title: string; description: string | null; active: boolean; created_at: string; }
interface Reward {
  id: string; title: string; description: string | null; points_required: number;
  reward_type: string; active: boolean; is_limited_time: boolean; expires_at: string | null; image_url: string | null;
}
interface PromotionRule { id: string; rule_type: string; trigger_count: number; reward_description: string; reward_type: string; reward_value: string; active: boolean; }
interface Offer { id: string; title: string; description: string | null; active: boolean; valid_from: string | null; valid_to: string | null; }
interface AiSuggestion { title: string; description: string; target_audience: string; expected_impact: string; confidence: string; }
interface AiRewardSuggestion { title: string; description: string; reward_type: string; points_required: number; image_prompt: string; }

const RULE_TYPES = [
  { value: "visit_x_get_y", label: "Visit X times", icon: Footprints },
  { value: "buy_x_get_y", label: "Buy X items", icon: ShoppingBag },
  { value: "spend_x_get_y", label: "Spend $X", icon: DollarSign },
];
const REWARD_TYPES_PROMO = [
  { value: "free_item", label: "Free Item" },
  { value: "discount_percent", label: "Discount %" },
  { value: "bonus_points", label: "Bonus Points" },
];

const confidenceColor: Record<string, string> = {
  high: "bg-green-500/15 text-green-600",
  medium: "bg-yellow-500/15 text-yellow-600",
  low: "bg-red-500/15 text-red-600",
};

// ── SMS Button (reused for birthday/monthly) ──
const SmsButton = ({ merchantId, type, offerId }: { merchantId: string; type: string; offerId?: string }) => {
  const [sending, setSending] = useState(false);
  const [fromNumber, setFromNumber] = useState("");
  const [showInput, setShowInput] = useState(false);
  const handleSend = async () => {
    if (!fromNumber.trim()) { toast.error("Enter your Twilio phone number"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms-notification", {
        body: { type, merchant_id: merchantId, from_number: fromNumber, offer_id: offerId },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`SMS sent to ${data?.sent || 0} customers`);
      setShowInput(false);
    } catch (err: any) { toast.error(err.message || "SMS failed"); } finally { setSending(false); }
  };
  if (!showInput) return <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInput(true)}><Send size={14} /> SMS</Button>;
  return (
    <div className="flex gap-2 items-center">
      <input type="tel" placeholder="+61..." value={fromNumber} onChange={e => setFromNumber(e.target.value)} className="h-9 px-3 rounded-lg border border-border text-sm bg-background w-32" />
      <Button variant="hero" size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{sending ? "..." : "Send"}</Button>
      <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>Cancel</Button>
    </div>
  );
};

const MerchantMarketing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "campaigns";

  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  // ── Campaigns state ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  // ── Rewards state ──
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rwTitle, setRwTitle] = useState(""); const [rwDesc, setRwDesc] = useState("");
  const [rwPoints, setRwPoints] = useState("100"); const [rwType, setRwType] = useState("discount");
  const [rwLimited, setRwLimited] = useState(false); const [rwExpires, setRwExpires] = useState("");
  const [rwImageUrl, setRwImageUrl] = useState(""); const [savingReward, setSavingReward] = useState(false);
  const [aiRewardLoading, setAiRewardLoading] = useState(false); const [aiRewardSuggestions, setAiRewardSuggestions] = useState<AiRewardSuggestion[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);

  // ── Promotions state ──
  const [promoRules, setPromoRules] = useState<PromotionRule[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [prRuleType, setPrRuleType] = useState("visit_x_get_y"); const [prTrigger, setPrTrigger] = useState("10");
  const [prRewardDesc, setPrRewardDesc] = useState("Free coffee"); const [prRewardType, setPrRewardType] = useState("free_item");
  const [prRewardValue, setPrRewardValue] = useState(""); const [savingPromo, setSavingPromo] = useState(false);

  // ── Monthly Offers state ──
  const [monthlyOffers, setMonthlyOffers] = useState<Offer[]>([]);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [moTitle, setMoTitle] = useState(""); const [moDesc, setMoDesc] = useState("");
  const [moFrom, setMoFrom] = useState(""); const [moTo, setMoTo] = useState(""); const [savingMonthly, setSavingMonthly] = useState(false);

  // ── Birthday state ──
  const [bdEnabled, setBdEnabled] = useState(false); const [bdRewardType, setBdRewardType] = useState("points_bonus");
  const [bdRewardValue, setBdRewardValue] = useState("50"); const [bdMessage, setBdMessage] = useState("Happy Birthday! Enjoy your special reward.");
  const [bdDaysBefore, setBdDaysBefore] = useState("0"); const [bdDaysValid, setBdDaysValid] = useState("7"); const [savingBd, setSavingBd] = useState(false);

  // ── AI Suggestions state (multi-turn chat in Campaigns tab) ──
  type ChatMsg = {
    role: "user" | "assistant";
    content: string;
    suggestions?: AiSuggestion[];
  };
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [aiBrief, setAiBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  // ── Reward image prompt state ──
  const [rwImagePrompt, setRwImagePrompt] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);

      const [campRes, rewRes, promoRes, moRes, bdRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("merchant_id", m.id).order("created_at", { ascending: false }),
        supabase.from("rewards").select("*").eq("merchant_id", m.id).order("created_at", { ascending: false }),
        supabase.from("promotion_rules").select("*").eq("merchant_id", m.id).order("created_at", { ascending: false }),
        supabase.from("monthly_offers").select("*").eq("merchant_id", m.id).order("created_at", { ascending: false }),
        supabase.from("birthday_offer_settings").select("*").eq("merchant_id", m.id).maybeSingle(),
      ]);
      setCampaigns(campRes.data || []);
      setRewards((rewRes.data || []) as Reward[]);
      setPromoRules((promoRes.data || []) as PromotionRule[]);
      setMonthlyOffers(moRes.data || []);
      if (bdRes.data) {
        const s = bdRes.data;
        setBdEnabled(s.enabled); setBdRewardType(s.reward_type); setBdRewardValue(s.reward_value);
        setBdMessage(s.message || ""); setBdDaysBefore(String(s.days_before)); setBdDaysValid(String(s.days_valid));
      }
      setLoading(false);
    })();
  }, [navigate]);

  // ── Fetch helpers ──
  const refetchCampaigns = async () => { if (!merchantId) return; const { data } = await supabase.from("campaigns").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }); setCampaigns(data || []); };
  const refetchRewards = async () => { if (!merchantId) return; const { data } = await supabase.from("rewards").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }); setRewards((data || []) as Reward[]); };
  const refetchPromos = async () => { if (!merchantId) return; const { data } = await supabase.from("promotion_rules").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }); setPromoRules((data || []) as PromotionRule[]); };
  const refetchMonthly = async () => { if (!merchantId) return; const { data } = await supabase.from("monthly_offers").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }); setMonthlyOffers(data || []); };

  // ── Campaign handlers ──
  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault(); if (!merchantId) return;
    const parsed = campaignSchema.safeParse({ title: campaignTitle, description: campaignDesc });
    if (!parsed.success) { toast.error(firstZodError(parsed.error)); return; }
    setSavingCampaign(true);
    const { error } = await supabase.from("campaigns").insert({ merchant_id: merchantId, title: parsed.data.title, description: parsed.data.description || null });
    setSavingCampaign(false); if (error) { toast.error(error.message); return; }
    toast.success("Campaign created"); setCampaignTitle(""); setCampaignDesc(""); setShowCampaignForm(false); await refetchCampaigns();
  };

  // ── Reward handlers ──
  const resetRewardForm = () => { setRwTitle(""); setRwDesc(""); setRwPoints("100"); setRwType("discount"); setRwLimited(false); setRwExpires(""); setRwImageUrl(""); setRwImagePrompt(""); setEditingRewardId(null); setShowRewardForm(false); };
  const startEditReward = (r: Reward) => { setEditingRewardId(r.id); setRwTitle(r.title); setRwDesc(r.description || ""); setRwPoints(String(r.points_required)); setRwType(r.reward_type); setRwLimited(r.is_limited_time); setRwExpires(r.expires_at ? r.expires_at.slice(0, 16) : ""); setRwImageUrl(r.image_url || ""); setRwImagePrompt(""); setShowRewardForm(true); };
  const submitReward = async (e: React.FormEvent) => {
    e.preventDefault(); if (!merchantId) return;
    const parsed = rewardSchema.safeParse({
      title: rwTitle, description: rwDesc,
      points_required: parseInt(rwPoints) || 0,
      reward_type: rwType, image_url: rwImageUrl || "",
    });
    if (!parsed.success) { toast.error(firstZodError(parsed.error)); return; }
    setSavingReward(true);
    const payload = { title: parsed.data.title, description: parsed.data.description || null, points_required: parsed.data.points_required, reward_type: rwType, is_limited_time: rwLimited, expires_at: rwLimited && rwExpires ? new Date(rwExpires).toISOString() : null, image_url: rwImageUrl || null };
    if (editingRewardId) { const { error } = await supabase.from("rewards").update(payload).eq("id", editingRewardId); setSavingReward(false); if (error) { toast.error(error.message); return; } toast.success("Reward updated"); }
    else { const { error } = await supabase.from("rewards").insert({ ...payload, merchant_id: merchantId }); setSavingReward(false); if (error) { toast.error(error.message); return; } toast.success("Reward created"); }
    resetRewardForm(); await refetchRewards();
  };
  const generateRewardImage = async (prompt: string) => {
    if (!merchantId) return;
    const cleanPrompt = (prompt || "").trim();
    if (cleanPrompt.length < 3) { toast.error("Please describe your image (at least 3 characters)"); return; }
    setGeneratingImage(true);
    try { const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", { body: { merchant_id: merchantId, type: "generate_image", prompt: cleanPrompt } }); if (error) throw error; if (data?.image_url) { setRwImageUrl(data.image_url); toast.success("Image generated!"); } } catch (err: any) { toast.error(err.message || "Image generation failed"); } finally { setGeneratingImage(false); }
  };

  // ── Promo handlers ──
  const createPromo = async () => {
    if (!merchantId) return;
    const parsed = promotionSchema.safeParse({
      rule_type: prRuleType,
      trigger_count: parseInt(prTrigger) || 0,
      reward_description: prRewardDesc,
      reward_type: prRewardType,
    });
    if (!parsed.success) { toast.error(firstZodError(parsed.error)); return; }
    setSavingPromo(true);
    const { error } = await supabase.from("promotion_rules").insert({ merchant_id: merchantId, rule_type: prRuleType, trigger_count: parsed.data.trigger_count, reward_description: parsed.data.reward_description, reward_type: prRewardType, reward_value: prRewardValue.trim(), active: true });
    setSavingPromo(false); if (error) { toast.error(error.message); return; }
    toast.success("Promotion rule created!"); setShowPromoForm(false); setPrTrigger("10"); setPrRewardDesc("Free coffee"); setPrRewardValue(""); await refetchPromos();
  };

  // ── Monthly handlers ──
  const createMonthly = async (e: React.FormEvent) => {
    e.preventDefault(); if (!merchantId) return;
    const parsed = monthlyOfferSchema.safeParse({ title: moTitle, description: moDesc, valid_from: moFrom, valid_to: moTo });
    if (!parsed.success) { toast.error(firstZodError(parsed.error)); return; }
    setSavingMonthly(true);
    const { error } = await supabase.from("monthly_offers").insert({ merchant_id: merchantId, title: parsed.data.title, description: parsed.data.description || null, valid_from: moFrom || null, valid_to: moTo || null });
    setSavingMonthly(false); if (error) { toast.error(error.message); return; }
    toast.success("Offer created"); setMoTitle(""); setMoDesc(""); setMoFrom(""); setMoTo(""); setShowMonthlyForm(false); await refetchMonthly();
  };

  // ── Birthday handler ──
  const saveBirthday = async () => {
    if (!merchantId) return;
    const parsed = birthdaySchema.safeParse({
      days_before: parseInt(bdDaysBefore) || 0,
      days_valid: parseInt(bdDaysValid) || 1,
      reward_value: bdRewardValue,
      message: bdMessage,
    });
    if (!parsed.success) { toast.error(firstZodError(parsed.error)); return; }
    setSavingBd(true);
    const { error } = await supabase.from("birthday_offer_settings").upsert({ merchant_id: merchantId, enabled: bdEnabled, reward_type: bdRewardType, reward_value: parsed.data.reward_value, message: parsed.data.message || null, days_before: parsed.data.days_before, days_valid: parsed.data.days_valid }, { onConflict: "merchant_id" });
    setSavingBd(false); if (error) { toast.error(error.message); return; } toast.success("Birthday settings saved");
  };

  // ── AI Suggestion handlers (multi-turn chat) ──
  const sendChat = async () => {
    if (!merchantId) return;
    const text = aiBrief.trim();
    if (!text && chatMessages.length === 0) {
      // First turn allowed without text — produce data-driven suggestions
    } else if (text.length > 0 && text.length < 3) {
      toast.error("Please type a bit more"); return;
    }
    const nextHistory: ChatMsg[] = text
      ? [...chatMessages, { role: "user", content: text }]
      : [...chatMessages, { role: "user", content: "Suggest data-driven campaigns based on my transactions." }];
    setChatMessages(nextHistory);
    setAiBrief("");
    setGenerating(true);
    try {
      const conversation = nextHistory.map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", {
        body: { merchant_id: merchantId, conversation },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const reply: string = data?.reply || "Here are some ideas:";
      const suggestions: AiSuggestion[] = data?.suggestions || [];
      setChatMessages(prev => [...prev, { role: "assistant", content: reply, suggestions }]);
    } catch (err: any) {
      toast.error(err.message || "Failed");
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry — I couldn't generate suggestions. Try again." }]);
    } finally {
      setGenerating(false);
    }
  };
  const resetChat = () => { setChatMessages([]); setAiBrief(""); };
  const createAiCampaign = async (s: AiSuggestion, key: string) => {
    if (!merchantId) return; setCreatingKey(key);
    const { error } = await supabase.from("campaigns").insert({ merchant_id: merchantId, title: s.title, description: s.description, ai_generated: true, expected_impact: s.expected_impact, confidence_score: s.confidence === "high" ? 0.9 : s.confidence === "medium" ? 0.6 : 0.3, target_segment: s.target_audience });
    setCreatingKey(null); if (error) { toast.error(error.message); return; }
    toast.success(`Campaign "${s.title}" created!`); await refetchCampaigns();
  };

  const handleTabChange = (value: string) => setSearchParams({ tab: value });

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const ruleTypeLabel = (type: string) => RULE_TYPES.find(r => r.value === type)?.label || type;
  const rewardTypeLabel = (type: string) => REWARD_TYPES_PROMO.find(r => r.value === type)?.label || type;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchantId} />
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Marketing</h1>

            <Tabs value={defaultTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="product_offers">Product Offers</TabsTrigger>
                <TabsTrigger value="birthday">Birthday</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              {/* ── Campaigns ── */}
              <TabsContent value="campaigns" className="space-y-4">
                {!canAccess("campaigns") ? <LockedFeature featureKey="campaigns" /> : (
                  <>
                    {/* AI Campaign Assistant — multi-turn chat */}
                    {canAccess("ai_suggestions") && (
                      <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-2xl border border-primary/20 shadow-card overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/40">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <Sparkles size={14} className="text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground leading-tight">AI Campaign Assistant</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">Chat to refine ideas based on your data</p>
                            </div>
                          </div>
                          {chatMessages.length > 0 && (
                            <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={resetChat}>
                              <X size={12} /> Reset
                            </Button>
                          )}
                        </div>

                        {/* Chat thread */}
                        <div className="px-5 py-4 space-y-4 max-h-[480px] overflow-y-auto">
                          {chatMessages.length === 0 && (
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Sparkles size={14} className="text-primary" />
                              </div>
                              <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-2.5 border border-border/50 max-w-[85%]">
                                <p className="text-xs text-foreground">
                                  Hi! Tell me what kind of campaign you'd like to run — or just hit Send for data-driven ideas. You can refine over multiple messages (e.g. "make them weekend-focused", "target lapsed customers").
                                </p>
                              </div>
                            </div>
                          )}

                          {chatMessages.map((m, mi) => (
                            <div key={mi} className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                m.role === "user" ? "bg-secondary/15" : "bg-primary/10"
                              }`}>
                                {m.role === "user" ? <Pencil size={12} className="text-secondary" /> : <Sparkles size={14} className="text-primary" />}
                              </div>
                              <div className={`max-w-[85%] space-y-2 ${m.role === "user" ? "items-end" : ""}`}>
                                <div className={`rounded-2xl px-4 py-2.5 border ${
                                  m.role === "user"
                                    ? "bg-primary text-primary-foreground border-primary/40 rounded-tr-sm"
                                    : "bg-card text-foreground border-border/50 rounded-tl-sm"
                                }`}>
                                  <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                                </div>

                                {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                                  <div className="space-y-2">
                                    {m.suggestions.map((s, si) => {
                                      const key = `${mi}-${si}`;
                                      return (
                                        <div key={si} className="bg-card rounded-xl p-3 border border-border/50 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Megaphone size={13} className="text-primary shrink-0" />
                                            <p className="text-sm font-bold text-foreground">{s.title}</p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${confidenceColor[s.confidence] || ""}`}>{s.confidence}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground">{s.description}</p>
                                          <div className="flex flex-wrap gap-3 text-[11px]">
                                            <span className="flex items-center gap-1 text-muted-foreground"><Target size={11} /> {s.target_audience}</span>
                                            <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp size={11} /> {s.expected_impact}</span>
                                          </div>
                                          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => createAiCampaign(s, key)} disabled={creatingKey === key}>
                                            <Plus size={11} /> {creatingKey === key ? "Creating..." : "Create Campaign"}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {generating && (
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Sparkles size={14} className="text-primary" />
                              </div>
                              <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-2.5 border border-border/50">
                                <div className="flex items-center gap-1.5">
                                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Thinking…</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Composer */}
                        <div className="px-5 py-3 border-t border-border/40 bg-card/40 flex items-end gap-2">
                          <Textarea
                            placeholder={chatMessages.length === 0
                              ? "Describe your idea, or just press Send for data-driven suggestions…"
                              : "Refine: e.g. make them weekend-focused, lower the spend threshold…"}
                            value={aiBrief}
                            onChange={e => setAiBrief(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!generating) sendChat(); } }}
                            rows={2}
                            className="bg-background resize-none min-h-[44px]"
                          />
                          <Button variant="hero" size="sm" className="gap-1.5 shrink-0" onClick={sendChat} disabled={generating}>
                            {generating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Your Campaigns</p>
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowCampaignForm(!showCampaignForm)}><Plus size={14} /> New</Button>
                    </div>
                    {showCampaignForm && (
                      <form onSubmit={createCampaign} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                        <Input placeholder="Campaign title" value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} maxLength={100} required />
                        <Textarea placeholder="Description (optional, max 500)" value={campaignDesc} onChange={e => setCampaignDesc(e.target.value)} maxLength={500} rows={3} />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowCampaignForm(false)}>Cancel</Button>
                          <Button type="submit" variant="hero" size="sm" disabled={savingCampaign}>{savingCampaign ? "Creating..." : "Create"}</Button>
                        </div>
                      </form>
                    )}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
                      {campaigns.length === 0 ? (
                        <div className="text-center py-12"><Megaphone size={32} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No campaigns yet</p></div>
                      ) : campaigns.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">{c.title}</p>
                            {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pl-3">
                            <button onClick={async () => { await supabase.from("campaigns").update({ active: !c.active }).eq("id", c.id); await refetchCampaigns(); }} className="text-muted-foreground hover:text-foreground">
                              {c.active ? <ToggleRight size={20} className="text-accent" /> : <ToggleLeft size={20} />}
                            </button>
                            <button onClick={async () => { await supabase.from("campaigns").delete().eq("id", c.id); await refetchCampaigns(); toast.success("Deleted"); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ── Promotions ── */}
              <TabsContent value="promotions" className="space-y-4">
                {!canAccess("promotions") ? <LockedFeature featureKey="promotions" /> : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Smart Promotions</p>
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowPromoForm(!showPromoForm)}><Plus size={14} /> New Rule</Button>
                    </div>
                    {showPromoForm && (
                      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4 animate-fade-up">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">When a customer...</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {RULE_TYPES.map(rt => (
                              <button key={rt.value} onClick={() => setPrRuleType(rt.value)}
                                className={`rounded-xl p-3 text-center border transition-all text-xs font-medium ${prRuleType === rt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"}`}>
                                <rt.icon size={18} className="mx-auto mb-1" />{rt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">{prRuleType === "spend_x_get_y" ? "Amount ($)" : "Count"}</Label><Input type="number" min="1" value={prTrigger} onChange={e => setPrTrigger(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label>
                            <select value={prRewardType} onChange={e => setPrRewardType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                              {REWARD_TYPES_PROMO.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward Description</Label><Input value={prRewardDesc} onChange={e => setPrRewardDesc(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Value (optional)</Label><Input value={prRewardValue} onChange={e => setPrRewardValue(e.target.value)} placeholder="e.g. 10%" /></div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" onClick={() => setShowPromoForm(false)} className="flex-1">Cancel</Button>
                          <Button variant="hero" size="sm" onClick={createPromo} disabled={savingPromo} className="flex-1 gap-1.5"><Save size={14} /> {savingPromo ? "Creating..." : "Create Rule"}</Button>
                        </div>
                      </div>
                    )}
                    {promoRules.map(rule => (
                      <div key={rule.id} className={`bg-card rounded-2xl p-5 border shadow-card transition-all ${rule.active ? "border-border/50" : "border-border/30 opacity-60"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {rule.rule_type === "spend_x_get_y" ? `Spend $${rule.trigger_count}` : `${ruleTypeLabel(rule.rule_type).replace("X", String(rule.trigger_count))}`}
                              {" → "}<span className="text-primary">{rule.reward_description}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{rewardTypeLabel(rule.reward_type)}{rule.reward_value ? ` • ${rule.reward_value}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={async () => { await supabase.from("promotion_rules").update({ active: !rule.active }).eq("id", rule.id); setPromoRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r)); }} className="text-muted-foreground hover:text-foreground">{rule.active ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} />}</button>
                            <button onClick={async () => { await supabase.from("promotion_rules").delete().eq("id", rule.id); setPromoRules(prev => prev.filter(r => r.id !== rule.id)); toast.success("Deleted"); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>

              {/* ── Rewards ── */}
              <TabsContent value="rewards" className="space-y-4">
                {!canAccess("rewards") ? <LockedFeature featureKey="rewards" /> : (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold text-foreground">Rewards</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
                          if (!merchantId) return; setAiRewardLoading(true); setAiRewardSuggestions([]);
                          try { const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", { body: { merchant_id: merchantId, type: "suggest_reward" } }); if (error) throw error; setAiRewardSuggestions(data?.suggestions || []); } catch (err: any) { toast.error(err.message); } finally { setAiRewardLoading(false); }
                        }} disabled={aiRewardLoading}>{aiRewardLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Suggest</Button>
                        <Button variant="hero" size="sm" className="gap-1.5" onClick={() => { resetRewardForm(); setShowRewardForm(!showRewardForm); }}><Plus size={14} /> New</Button>
                      </div>
                    </div>
                    {aiRewardSuggestions.length > 0 && (
                      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/20 space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Sparkles size={14} className="text-accent" /> AI Suggestions</h3>
                        {aiRewardSuggestions.map((s, i) => (
                          <button key={i} onClick={() => { setRwTitle(s.title); setRwDesc(s.description); setRwType(s.reward_type); setRwPoints(String(s.points_required)); setEditingRewardId(null); setShowRewardForm(true); setAiRewardSuggestions([]); if (s.image_prompt) generateRewardImage(s.image_prompt); toast.success("Applied!"); }}
                            className="w-full text-left bg-card rounded-xl p-3 border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                            <div className="flex items-center justify-between"><p className="font-semibold text-sm text-foreground">{s.title}</p><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.points_required} pts</span></div>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                          </button>
                        ))}
                        <button onClick={() => setAiRewardSuggestions([])} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
                      </div>
                    )}
                    {showRewardForm && (
                      <form onSubmit={submitReward} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">{editingRewardId ? "Edit Reward" : "New Reward"}</h3>
                          {editingRewardId && <button type="button" onClick={resetRewardForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>}
                        </div>
                        <Input placeholder="Reward title" value={rwTitle} onChange={e => setRwTitle(e.target.value)} required />
                        <Textarea placeholder="Description" value={rwDesc} onChange={e => setRwDesc(e.target.value)} rows={2} />
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Points Required</Label><Input type="number" min="1" value={rwPoints} onChange={e => setRwPoints(e.target.value)} required /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                            <Select value={rwType} onValueChange={setRwType}><SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="discount">Discount</SelectItem><SelectItem value="freebie">Freebie</SelectItem><SelectItem value="voucher">Voucher</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground block">Reward Image</Label>
                          {rwImageUrl ? (
                            <div className="space-y-2">
                              <div className="relative rounded-xl overflow-hidden border border-border/50">
                                <img src={rwImageUrl} alt="Reward" className="w-full h-32 object-cover" />
                                <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 h-7 text-[10px]" onClick={() => setRwImageUrl("")}>Remove</Button>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Describe a different image..."
                                  value={rwImagePrompt}
                                  onChange={e => setRwImagePrompt(e.target.value)}
                                  maxLength={300}
                                  className="flex-1"
                                />
                                <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={() => generateRewardImage(rwImagePrompt || rwTitle)} disabled={generatingImage}>
                                  {generatingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Regenerate
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Describe your reward image (e.g. 'a steaming cappuccino on a wooden table with morning light')"
                                value={rwImagePrompt}
                                onChange={e => setRwImagePrompt(e.target.value)}
                                rows={2}
                                maxLength={300}
                              />
                              <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => generateRewardImage(rwImagePrompt || rwTitle || rwDesc)} disabled={generatingImage || (!rwImagePrompt.trim() && !rwTitle.trim() && !rwDesc.trim())}>
                                {generatingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                {generatingImage ? "Generating..." : "Generate AI Image"}
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3"><Switch checked={rwLimited} onCheckedChange={setRwLimited} /><Label className="text-xs">Limited time</Label></div>
                        {rwLimited && <Input type="datetime-local" value={rwExpires} onChange={e => setRwExpires(e.target.value)} />}
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={resetRewardForm}>Cancel</Button>
                          <Button type="submit" variant="hero" size="sm" disabled={savingReward}>{savingReward ? "Saving..." : editingRewardId ? "Update" : "Create"}</Button>
                        </div>
                      </form>
                    )}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
                      {rewards.length === 0 ? (
                        <div className="text-center py-12"><Gift size={32} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No rewards yet</p></div>
                      ) : rewards.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {r.image_url && <img src={r.image_url} alt={r.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2"><p className="font-semibold text-sm text-foreground">{r.title}</p><span className="text-[10px] bg-accent/15 text-accent-foreground px-1.5 py-0.5 rounded capitalize">{r.reward_type}</span></div>
                              {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-primary">{r.points_required} pts</span>
                                {r.is_limited_time && r.expires_at && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} /> {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pl-3">
                            <button onClick={() => startEditReward(r)} className="text-muted-foreground hover:text-primary"><Pencil size={15} /></button>
                            <button onClick={async () => { await supabase.from("rewards").update({ active: !r.active }).eq("id", r.id); await refetchRewards(); }} className="text-muted-foreground hover:text-foreground">{r.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}</button>
                            <button onClick={async () => { await supabase.from("rewards").delete().eq("id", r.id); await refetchRewards(); toast.success("Deleted"); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ── Product Offers ── */}
              <TabsContent value="product_offers">
                {merchantId && <ProductOffersTab merchantId={merchantId} />}
              </TabsContent>

              {/* ── Birthday ── */}
              <TabsContent value="birthday" className="space-y-4">
                {!canAccess("birthday_offers") ? <LockedFeature featureKey="birthday_offers" /> : (
                  <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Cake size={20} className="text-primary" /><div><p className="text-sm font-semibold text-foreground">Auto Birthday Rewards</p><p className="text-xs text-muted-foreground">Automatically reward customers on their birthday</p></div></div>
                      <Switch checked={bdEnabled} onCheckedChange={setBdEnabled} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label><Select value={bdRewardType} onValueChange={setBdRewardType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="points_bonus">Points Bonus</SelectItem><SelectItem value="discount_percent">Discount %</SelectItem><SelectItem value="free_item">Free Item</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div>
                      <div><Label className="text-xs text-muted-foreground mb-1 block">Value</Label><Input value={bdRewardValue} onChange={e => setBdRewardValue(e.target.value)} /></div>
                      <div><Label className="text-xs text-muted-foreground mb-1 block">Days Before</Label><Input type="number" min="0" max="30" value={bdDaysBefore} onChange={e => setBdDaysBefore(e.target.value)} /></div>
                      <div><Label className="text-xs text-muted-foreground mb-1 block">Valid For (Days)</Label><Input type="number" min="1" max="90" value={bdDaysValid} onChange={e => setBdDaysValid(e.target.value)} /></div>
                    </div>
                    <div><Label className="text-xs text-muted-foreground mb-1 block">Message</Label><Textarea value={bdMessage} onChange={e => setBdMessage(e.target.value)} rows={2} /></div>
                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={saveBirthday} disabled={savingBd}><Save size={14} /> {savingBd ? "Saving..." : "Save"}</Button>
                      {bdEnabled && merchantId && <SmsButton merchantId={merchantId} type="birthday" />}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Monthly Offers ── */}
              <TabsContent value="monthly" className="space-y-4">
                {!canAccess("monthly_offers") ? <LockedFeature featureKey="monthly_offers" /> : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Monthly Offers</p>
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowMonthlyForm(!showMonthlyForm)}><Plus size={14} /> New</Button>
                    </div>
                    {showMonthlyForm && (
                      <form onSubmit={createMonthly} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                        <Input placeholder="Offer title" value={moTitle} onChange={e => setMoTitle(e.target.value)} required />
                        <Textarea placeholder="Description" value={moDesc} onChange={e => setMoDesc(e.target.value)} rows={2} />
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">From</Label><Input type="date" value={moFrom} onChange={e => setMoFrom(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">To</Label><Input type="date" value={moTo} onChange={e => setMoTo(e.target.value)} /></div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowMonthlyForm(false)}>Cancel</Button>
                          <Button type="submit" variant="hero" size="sm" disabled={savingMonthly}>{savingMonthly ? "Creating..." : "Create"}</Button>
                        </div>
                      </form>
                    )}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
                      {monthlyOffers.length === 0 ? (
                        <div className="text-center py-12"><CalendarHeart size={32} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No monthly offers yet</p></div>
                      ) : monthlyOffers.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">{o.title}</p>
                            {o.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{o.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pl-3">
                            <button onClick={async () => { await supabase.from("monthly_offers").update({ active: !o.active }).eq("id", o.id); await refetchMonthly(); }} className="text-muted-foreground hover:text-foreground">{o.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}</button>
                            <button onClick={async () => { await supabase.from("monthly_offers").delete().eq("id", o.id); await refetchMonthly(); toast.success("Deleted"); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* AI suggestions are now embedded in the Campaigns tab */}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantMarketing;
