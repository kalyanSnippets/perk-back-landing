import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Star, Calendar, Hash, User, CreditCard,
  ScanBarcode, Gift, Smartphone, Coffee, Sparkles,
  Clock, Tag, ArrowRight, Shield, Copy, Share2,
  Megaphone, CalendarDays, ChevronRight,
  CheckCircle, XCircle, Ticket, Info, Store, ArrowLeft, MapPin
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import ScrollReveal from "@/components/ScrollReveal";
import ExploreTab from "@/components/customer/ExploreTab";
import StampCardProgress from "@/components/customer/StampCardProgress";
import NfcTapButton from "@/components/customer/NfcTapButton";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { getDeviceType } from "@/lib/deviceDetection";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface CustomerData { id: string; full_name: string | null; crn: string | null; loyalty_card_number: string | null; card_issued_at: string | null; points_balance: number; }
interface CustomerMerchantData { merchant_id: string; store_name: string; points_balance: number; total_spend: number; visit_count: number; last_visit_at: string | null; logo_url?: string | null; industry_type?: string | null; address?: string | null; }
interface TransactionData { id: string; merchant_name: string; merchant_id: string | null; purchase_amount: number; points_awarded: number; transaction_date: string; }
interface RewardData { id: string; title: string; description: string | null; points_required: number; reward_type: string; is_limited_time: boolean; expires_at: string | null; merchant_id: string; store_name?: string; image_url?: string | null; }
interface CampaignData { id: string; title: string; description: string | null; ai_generated: boolean | null; image_url: string | null; target_segment: string | null; merchant_id: string; store_name?: string; }
interface MonthlyOfferData { id: string; title: string; description: string | null; valid_from: string | null; valid_to: string | null; merchant_id: string; store_name?: string; }
interface RedemptionData { id: string; reward_title: string; points_spent: number; redemption_code: string; status: string; expires_at: string; created_at: string; merchant_id: string; store_name?: string; }

const CAROUSEL_GRADIENTS = [
  "from-primary via-primary/90 to-secondary",
  "from-secondary via-secondary/90 to-primary",
  "from-accent/90 via-accent/80 to-primary/80",
];

const REWARD_GRADIENTS = [
  "from-primary/20 via-primary/10 to-secondary/10",
  "from-secondary/20 via-secondary/10 to-accent/10",
  "from-accent/20 via-accent/10 to-primary/10",
  "from-purple-500/20 via-purple-400/10 to-primary/10",
];

const INDUSTRY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Coffee Shop": { bg: "from-amber-500/20 via-orange-400/10 to-yellow-300/10", border: "border-amber-400/40", text: "text-amber-600" },
  "Retail": { bg: "from-blue-500/20 via-indigo-400/10 to-cyan-300/10", border: "border-blue-400/40", text: "text-blue-600" },
  "Restaurant": { bg: "from-emerald-500/20 via-teal-400/10 to-green-300/10", border: "border-emerald-400/40", text: "text-emerald-600" },
};

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; };
const daysUntil = (dateStr: string) => { const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); return diff > 0 ? diff : 0; };
const rewardTypeIcon = (type: string) => { switch (type) { case "freebie": return Coffee; case "voucher": return Tag; case "discount": return Sparkles; default: return Gift; } };

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerMerchants, setCustomerMerchants] = useState<CustomerMerchantData[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferData[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(false);
  const { isAdmin } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState<{ code: string; title: string; points: number; expires: string } | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardData | null>(null);
  const [showClaimInfo, setShowClaimInfo] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"my-rewards" | "my-card" | "explore">("my-rewards");

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
    const interval = setInterval(() => carouselApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!customer) return;
    const channel = supabase
      .channel('customer-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new.customer_id === customer.id) fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.new.id === customer.id) setCustomer((prev) => prev ? { ...prev, points_balance: (payload.new as any).points_balance } : prev);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_offers' }, () => fetchOffersData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);

  const fetchOffersData = useCallback(async () => {
    if (!customer) return;
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name");
    const merchantMap = new Map((merchantsData || []).map(m => [m.id, m.store_name]));
    const [rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
    ]);
    setRewards((rewardsRes.data || []).map(r => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map(c => ({ ...c, store_name: merchantMap.get(c.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map(o => ({ ...o, store_name: merchantMap.get(o.merchant_id) || "Store" })));
  }, [customer]);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/get-started"); return; }
    const { data: customerData, error } = await supabase.from("customers").select("*").eq("user_id", authUser.id).maybeSingle();
    if (error || !customerData) { navigate("/get-started"); return; }
    if (!customerData.loyalty_card_number) { navigate("/customer/confirmation"); return; }
    setCustomer(customerData);

    const { data: cmData } = await supabase
      .from("customer_merchants")
      .select("merchant_id, points_balance, total_spend, visit_count, last_visit_at")
      .eq("customer_id", customerData.id);

    const { data: txData } = await supabase.from("transactions").select("*").eq("customer_id", customerData.id).order("transaction_date", { ascending: false });
    setTransactions(txData || []);
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name, logo_url, industry_type, address");
    const merchantMap = new Map((merchantsData || []).map(m => [m.id, m.store_name]));
    const merchantLogoMap = new Map((merchantsData || []).map(m => [m.id, m.logo_url]));
    const merchantIndustryMap = new Map((merchantsData || []).map(m => [m.id, m.industry_type]));
    const merchantAddressMap = new Map((merchantsData || []).map(m => [m.id, m.address]));

    const cmList: CustomerMerchantData[] = (cmData || []).map(cm => ({
      merchant_id: cm.merchant_id,
      store_name: merchantMap.get(cm.merchant_id) || "Store",
      points_balance: cm.points_balance,
      total_spend: Number(cm.total_spend),
      visit_count: cm.visit_count,
      last_visit_at: cm.last_visit_at,
      logo_url: merchantLogoMap.get(cm.merchant_id),
      industry_type: merchantIndustryMap.get(cm.merchant_id),
      address: merchantAddressMap.get(cm.merchant_id),
    }));
    setCustomerMerchants(cmList);

    const [rewardsRes, campaignsRes, offersRes, redemptionsRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
      supabase.from("redemptions").select("*").eq("customer_id", customerData.id).order("created_at", { ascending: false }),
    ]);
    setRewards((rewardsRes.data || []).map(r => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map(c => ({ ...c, store_name: merchantMap.get(c.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map(o => ({ ...o, store_name: merchantMap.get(o.merchant_id) || "Store" })));
    setRedemptions((redemptionsRes.data || []).map((r: any) => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setLoading(false);
    setTimeout(() => setPointsVisible(true), 300);
  };

  const handleRedeem = async (rewardId: string) => {
    if (!customer) return;
    setRedeeming(rewardId);
    try {
      const { data, error } = await supabase.rpc("redeem_reward", { _customer_id: customer.id, _reward_id: rewardId });
      if (error) throw error;
      const result = data as any;
      if (!result.success) { toast.error(result.error || "Redemption failed"); return; }
      setSelectedReward(null);
      setShowRedemptionModal({ code: result.redemption_code, title: result.reward_title, points: result.points_spent, expires: result.expires_at });
      await fetchData();
    } catch (err: any) { toast.error(err.message || "Redemption failed"); }
    finally { setRedeeming(null); }
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied to clipboard`)).catch(() => toast.error("Failed to copy"));
  };

  const handleShare = async () => {
    if (!customer) return;
    const shareData = { title: "Perk Back Loyalty Card", text: `My Perk Back loyalty card: ${customer.loyalty_card_number}\nName: ${customer.full_name}\nCRN: ${customer.crn}` };
    if (navigator.share) { try { await navigator.share(shareData); } catch {} }
    else { navigator.clipboard.writeText(shareData.text || ""); toast.success("Card details copied to clipboard"); }
  };

  const [walletLoading, setWalletLoading] = useState<string | null>(null);
  const deviceType = getDeviceType();

  const handleAddToGoogleWallet = async () => {
    setWalletLoading("google");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first"); return; }
      const { data, error } = await supabase.functions.invoke("google-wallet-pass", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.ok === false) {
        toast.error(data.error === "Google Wallet not configured"
          ? "Google Wallet integration is being set up. Please try again later."
          : data.error);
        return;
      }
      if (data?.saveUrl) {
        window.open(data.saveUrl, "_blank");
        toast.success("Opening Google Wallet...");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add to Google Wallet");
    } finally {
      setWalletLoading(null);
    }
  };

  const handleAddToAppleWallet = async () => {
    setWalletLoading("apple");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first"); return; }
      const { data, error } = await supabase.functions.invoke("apple-wallet-pass", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error === "Apple Wallet not configured") {
          toast.info("Apple Wallet integration is being set up. Please try again later.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      // data is the .pkpass binary - trigger download
      const blob = new Blob([data], { type: "application/vnd.apple.pkpass" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "perkback-loyalty.pkpass";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloading your Apple Wallet pass...");
    } catch (err: any) {
      toast.error(err.message || "Failed to add to Apple Wallet");
    } finally {
      setWalletLoading(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
          <Star className="text-primary-foreground" size={24} />
        </div>
        <p className="text-muted-foreground text-sm">Loading your rewards...</p>
      </div>
    );
  }

  if (!customer) return null;

  const selectedMerchant = selectedMerchantId ? customerMerchants.find(cm => cm.merchant_id === selectedMerchantId) : null;
  const displayPoints = selectedMerchant ? selectedMerchant.points_balance : customer.points_balance;

  const filteredRewards = selectedMerchantId ? rewards.filter(r => r.merchant_id === selectedMerchantId) : rewards;
  const filteredCampaigns = selectedMerchantId ? campaigns.filter(c => c.merchant_id === selectedMerchantId) : campaigns;
  const filteredOffers = selectedMerchantId ? monthlyOffers.filter(o => o.merchant_id === selectedMerchantId) : monthlyOffers;
  const filteredTransactions = selectedMerchantId ? transactions.filter(t => t.merchant_id === selectedMerchantId) : transactions;
  const filteredRedemptions = selectedMerchantId ? redemptions.filter(r => r.merchant_id === selectedMerchantId) : redemptions;

  const issuedDate = customer.card_issued_at ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const carouselSlides = [
    ...filteredCampaigns.map(c => ({ type: "campaign" as const, title: c.title, description: c.description, store: c.store_name, endsIn: null, image_url: c.image_url, merchant_id: c.merchant_id })),
    ...filteredOffers.map(o => ({ type: "offer" as const, title: o.title, description: o.description, store: o.store_name, endsIn: o.valid_to ? daysUntil(o.valid_to) : null, image_url: null as string | null, merchant_id: o.merchant_id })),
  ];
  const nearestReward = filteredRewards.length > 0
    ? filteredRewards.reduce((closest, r) => {
        const diff = r.points_required - displayPoints;
        const closestDiff = closest.points_required - displayPoints;
        if (diff > 0 && (closestDiff <= 0 || diff < closestDiff)) return r;
        return closest;
      }, filteredRewards[0])
    : null;
  const nearestProgress = nearestReward ? Math.min((displayPoints / nearestReward.points_required) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5 pb-20 pt-20 sm:pt-24">

        {/* ─── Greeting ─── */}
        <ScrollReveal>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {getGreeting()}, {customer.full_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </ScrollReveal>

        {/* ─── Main Tab Switcher — Pill Segmented Control ─── */}
        <div className="flex gap-1 bg-card rounded-full p-1 border border-border/50 shadow-card">
          {[
            { key: "my-rewards" as const, label: "🎁 My Rewards" },
            { key: "my-card" as const, label: "💳 My Card" },
            { key: "explore" as const, label: "🔍 Explore" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeMainTab === tab.key
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-button"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeMainTab === "explore" ? (
          <ExploreTab customerMerchantIds={customerMerchants.map(cm => cm.merchant_id)} />
        ) : activeMainTab === "my-card" ? (
          /* ─── My Card Tab ─── */
          <>
            {/* Loyalty Card */}
            <ScrollReveal>
              <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-foreground/5 to-transparent" />
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-primary-foreground/10" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full border border-primary-foreground/8" />
                <div className="relative z-10 p-5 sm:p-6 pb-4 sm:pb-5">
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div>
                      <p className="text-primary-foreground/50 text-[10px] uppercase tracking-[0.2em] mb-0.5">Digital Loyalty Card</p>
                      <img src={perkbackLogo} alt="Perk Back" className="h-6 sm:h-7 w-auto brightness-0 invert" />
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/90 flex items-center justify-center shadow-lg">
                      <Star className="text-accent-foreground" size={16} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 mb-4 sm:mb-5">
                    <div>
                      <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><User size={10} /> Name</p>
                      <p className="text-primary-foreground font-semibold text-xs sm:text-sm truncate">{customer.full_name || "—"}</p>
                    </div>
                    <div className="group cursor-pointer" onClick={() => handleCopy("CRN", customer.crn || "")}>
                      <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><Hash size={10} /> CRN <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-primary-foreground font-semibold font-mono text-xs sm:text-sm">{customer.crn}</p>
                    </div>
                    <div className="group cursor-pointer" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
                      <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> Card No. <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-primary-foreground font-semibold font-mono text-[11px] sm:text-xs tracking-wide">{customer.loyalty_card_number}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> Issued</p>
                      <p className="text-primary-foreground font-semibold text-xs sm:text-sm">{issuedDate}</p>
                    </div>
                  </div>
                  <div className="bg-primary-foreground rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-center gap-3 overflow-hidden">
                    <Barcode value={customer.loyalty_card_number || ""} height={55} />
                    <QRCodeDisplay value={customer.loyalty_card_number || ""} size={80} />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Card Actions */}
            <ScrollReveal delay={50}>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-9 border-border/50" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
                  <Copy size={13} /> Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-9 border-border/50" onClick={handleShare}>
                  <Share2 size={13} /> Share
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                {(deviceType === "ios" || deviceType === "desktop") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-10 border-border/50 bg-black text-white hover:bg-black/90 hover:text-white"
                    onClick={handleAddToAppleWallet}
                    disabled={walletLoading === "apple"}
                  >
                    🍎 {walletLoading === "apple" ? "Adding..." : "Add to Apple Wallet"}
                  </Button>
                )}
                {(deviceType === "android" || deviceType === "desktop") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-10 border-border/50"
                    onClick={handleAddToGoogleWallet}
                    disabled={walletLoading === "google"}
                  >
                    📱 {walletLoading === "google" ? "Adding..." : "Add to Google Wallet"}
                  </Button>
                )}
              </div>
            </ScrollReveal>

            {/* Card Details */}
            <ScrollReveal delay={75}>
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard size={16} className="text-secondary" /> Card Details
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Full Name", value: customer.full_name || "—", icon: User },
                    { label: "CRN", value: customer.crn || "—", icon: Hash },
                    { label: "Card Number", value: customer.loyalty_card_number || "—", icon: CreditCard },
                    { label: "Issued Date", value: issuedDate, icon: Calendar },
                    { label: "Total Points", value: String(customer.points_balance), icon: Star },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><item.icon size={12} /> {item.label}</span>
                      <span className="text-xs font-semibold text-foreground font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </>
        ) : (
        <>
        {/* ─── MY REWARDS TAB ─── */}

        {/* My Stores */}
        {customerMerchants.length > 0 && (
          <ScrollReveal delay={15}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Store size={16} className="text-secondary" /> My Stores
                </h3>
                {selectedMerchantId && (
                  <button onClick={() => setSelectedMerchantId(null)} className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                    <ArrowLeft size={12} /> All Stores
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {customerMerchants.map(cm => {
                  const isSelected = selectedMerchantId === cm.merchant_id;
                  const colors = INDUSTRY_COLORS[cm.industry_type || ""] || { bg: "from-secondary/15 via-primary/10 to-accent/10", border: "border-secondary/30", text: "text-secondary" };
                  return (
                    <button
                      key={cm.merchant_id}
                      onClick={() => setSelectedMerchantId(isSelected ? null : cm.merchant_id)}
                      className={`min-w-[200px] snap-start flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        isSelected
                          ? `${colors.border} border-2 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]`
                          : 'border border-border/30 hover:shadow-card'
                      }`}
                    >
                      {/* Gradient header with optional logo background */}
                      <div className={`relative bg-gradient-to-br ${colors.bg} p-4 pb-3 min-h-[80px]`}>
                        {cm.logo_url && (
                          <div className="absolute inset-0 opacity-10">
                            <img src={cm.logo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                            {cm.logo_url ? (
                              <img src={cm.logo_url} alt={cm.store_name} className="w-full h-full object-cover" />
                            ) : (
                              <Store size={20} className={colors.text} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-foreground truncate">{cm.store_name}</p>
                            {cm.industry_type && (
                              <span className={`text-[9px] font-semibold ${colors.text} bg-background/50 backdrop-blur-sm px-2 py-0.5 rounded-full`}>{cm.industry_type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="bg-card p-3.5 space-y-1.5">
                        {cm.address && (
                          <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 truncate">
                            <MapPin size={8} /> {cm.address}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-primary tabular-nums">{cm.points_balance} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{cm.visit_count} visits</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>${cm.total_spend.toFixed(0)} spent</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Points Balance — Vibrant */}
        <ScrollReveal delay={25}>
          <div className="relative overflow-hidden bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 text-center">
            {/* Decorative floating shapes */}
            <div className="floating-dot w-6 h-6 bg-accent/15 -top-1 right-[15%]" style={{ animationDelay: "0s" }} />
            <div className="floating-dot w-4 h-4 bg-coral/10 bottom-2 left-[10%]" style={{ animationDelay: "1.5s" }} />
            
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-3 relative z-10">
              {selectedMerchant ? `${selectedMerchant.store_name} Points` : "Total Points Balance"}
            </p>
            <div className={`flex items-center justify-center gap-3 transition-all duration-700 relative z-10 ${pointsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                <Star className="text-accent fill-accent" size={24} />
              </div>
              <span className="text-5xl sm:text-6xl font-bold text-foreground tabular-nums">{displayPoints}</span>
            </div>
            {nearestReward && nearestReward.points_required > displayPoints ? (
              <div className="mt-4 space-y-2 relative z-10">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Next: <span className="font-semibold text-foreground">{nearestReward.title}</span></span>
                  <span>{nearestReward.points_required - displayPoints} pts to go</span>
                </div>
                <Progress value={nearestProgress} className="h-2" />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs mt-3 relative z-10">Keep earning to unlock exclusive rewards!</p>
            )}
            <button onClick={() => setShowClaimInfo(true)} className="mt-3 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 mx-auto transition-colors relative z-10">
              <Info size={10} /> How to earn points
            </button>
          </div>
        </ScrollReveal>

        {/* Promo Carousel */}
        {carouselSlides.length > 0 && (
          <ScrollReveal delay={50}>
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {carouselSlides.map((slide, i) => (
                  <CarouselItem key={`${slide.type}-${i}`}>
                    <button
                      onClick={() => {
                        const cm = customerMerchants.find(c => c.merchant_id === slide.merchant_id);
                        if (cm) setSelectedMerchantId(slide.merchant_id);
                      }}
                      className="w-full text-left"
                    >
                      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${CAROUSEL_GRADIENTS[i % CAROUSEL_GRADIENTS.length]} p-5 sm:p-6 min-h-[160px] flex flex-col justify-between`}>
                        {slide.image_url && (
                          <div className="absolute inset-0">
                            <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                          </div>
                        )}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/10" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-primary-foreground/8" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            {slide.type === "campaign" ? <Megaphone size={14} className="text-primary-foreground/70" /> : <CalendarDays size={14} className="text-primary-foreground/70" />}
                            <span className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">{slide.store}</span>
                          </div>
                          <h3 className="text-primary-foreground font-bold text-lg sm:text-xl leading-tight">{slide.title}</h3>
                          {slide.description && <p className="text-primary-foreground/70 text-xs mt-1 line-clamp-2">{slide.description}</p>}
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-3">
                          <span className="text-[10px] uppercase tracking-wider text-primary-foreground/50">
                            {slide.type === "campaign" ? "Campaign" : "Monthly Offer"}
                          </span>
                          <div className="flex items-center gap-2">
                            {slide.endsIn !== null && (
                              <span className="text-[10px] bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock size={9} /> {slide.endsIn}d left
                              </span>
                            )}
                            <span className="text-[10px] bg-primary-foreground/20 text-primary-foreground px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              View Details <ArrowRight size={9} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {slideCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button key={i} onClick={() => carouselApi?.scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-primary w-5' : 'bg-border'}`} />
                  ))}
                </div>
              )}
            </Carousel>
          </ScrollReveal>
        )}

        {/* Available Rewards - Enhanced */}
        <ScrollReveal delay={75}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift size={16} className="text-accent" /> Available Rewards
              {selectedMerchant && <span className="text-xs font-normal text-muted-foreground">at {selectedMerchant.store_name}</span>}
            </h3>
            {filteredRewards.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mx-auto mb-3"><Gift size={24} className="text-accent" /></div>
                <p className="text-sm font-medium text-foreground">No rewards available yet</p>
                <p className="text-xs text-muted-foreground mt-1">Shop at partner stores to unlock exclusive rewards!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRewards.map((r, idx) => {
                  const merchantCm = customerMerchants.find(cm => cm.merchant_id === r.merchant_id);
                  const pointsForThisMerchant = merchantCm ? merchantCm.points_balance : 0;
                  const progress = Math.min((pointsForThisMerchant / r.points_required) * 100, 100);
                  const readyToRedeem = progress >= 100;
                  const almostThere = progress >= 80 && progress < 100;
                  const IconComp = rewardTypeIcon(r.reward_type);
                  const gradient = REWARD_GRADIENTS[idx % REWARD_GRADIENTS.length];
                  return (
                    <div key={r.id} onClick={() => setSelectedReward(r)}
                      className={`w-full rounded-2xl overflow-hidden relative min-h-[200px] flex flex-col justify-end transition-all duration-300 hover:shadow-lg cursor-pointer border ${
                        readyToRedeem
                          ? 'border-accent/40 shadow-[0_0_25px_-4px_hsl(var(--accent)/0.4)]'
                          : 'border-border/20 shadow-card'
                      }`}
                    >
                      {/* Full background: image or gradient */}
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                          <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-background/10 border border-background/20" />
                          <div className="absolute bottom-12 left-4 w-8 h-8 rounded-full bg-background/10 border border-background/20" />
                        </div>
                      )}
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

                      {/* Top badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        {readyToRedeem && (
                          <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">✨ Ready!</span>
                        )}
                        <span className="text-[9px] uppercase tracking-wider font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/80">{r.reward_type}</span>
                      </div>
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm ${readyToRedeem ? 'bg-accent/30' : 'bg-white/20'}`}>
                          <IconComp size={18} className="text-white" />
                        </div>
                      </div>

                      {/* Content overlay */}
                      <div className="relative z-10 p-4 space-y-2">
                        <p className="font-bold text-base text-white leading-tight">{r.title}</p>
                        <p className="text-[11px] text-white/70 flex items-center gap-1"><Store size={10} /> {r.store_name}</p>
                        {r.description && <p className="text-[10px] text-white/60 line-clamp-2">{r.description}</p>}
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-white/70">{pointsForThisMerchant}/{r.points_required} pts</span>
                            {readyToRedeem && <span className="text-accent font-bold">✨ Ready!</span>}
                            {almostThere && <span className="text-secondary font-semibold">Almost there!</span>}
                          </div>
                          <Progress value={progress} className="h-1.5 bg-white/20" />
                        </div>
                        {readyToRedeem ? (
                          <Button variant="hero" size="sm" className="w-full gap-1.5 text-xs mt-1">
                            <Ticket size={12} /> Claim Reward
                          </Button>
                        ) : (
                          <p className="text-[10px] text-center text-white/60 mt-1">
                            {r.points_required - pointsForThisMerchant} pts to go
                          </p>
                        )}
                        {r.is_limited_time && r.expires_at && (
                          <p className="text-[9px] text-white/50 flex items-center gap-0.5"><Clock size={8} /> Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Stamp Card & NFC */}
        {selectedMerchantId && customer && (
          <ScrollReveal delay={100}>
            <div className="space-y-3">
              <StampCardProgress
                customerId={customer.id}
                merchantId={selectedMerchantId}
                merchantName={selectedMerchant?.store_name || "Store"}
              />
              <NfcTapButton
                customerId={customer.id}
                customerCardNumber={customer.loyalty_card_number || ""}
              />
            </div>
          </ScrollReveal>
        )}

        {/* Monthly Offers */}
        {filteredOffers.length > 0 && (
          <ScrollReveal delay={125}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <CalendarDays size={16} className="text-accent" /> Monthly Offers
              </h3>
              <div className="space-y-3">
                {filteredOffers.map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays size={16} className="text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{o.title}</p>
                      {o.description && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{o.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/60">{o.store_name}</span>
                        {o.valid_to && (
                          <span className="text-[10px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock size={8} /> Ends in {daysUntil(o.valid_to)} days
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Points History (collapsed) */}
        <ScrollReveal delay={150}>
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            <button onClick={() => setShowTransactions(!showTransactions)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield size={16} className="text-secondary" /> Points Earned
                <span className="text-xs font-normal text-muted-foreground">({filteredTransactions.length})</span>
              </h3>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${showTransactions ? 'rotate-90' : ''}`} />
            </button>
            {showTransactions && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-6">
                    <Gift size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{tx.merchant_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">${tx.purchase_amount.toFixed(2)}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} /> {new Date(tx.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-accent-foreground bg-accent/15 px-2 py-1 rounded-lg">+{tx.points_awarded}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Redemption History */}
        {filteredRedemptions.length > 0 && (
          <ScrollReveal delay={175}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Ticket size={16} className="text-secondary" /> My Redemptions
              </h3>
              <div className="space-y-2">
                {filteredRedemptions.map((r) => {
                  const isExpired = r.status === 'expired' || (r.status === 'pending' && new Date(r.expires_at) < new Date());
                  const isVerified = r.status === 'verified';
                  const isPending = r.status === 'pending' && !isExpired;
                  return (
                    <div key={r.id} className={`p-3 rounded-xl border ${isPending ? 'border-accent/30 bg-accent/5' : 'border-border/30 bg-muted/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground">{r.reward_title}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{r.store_name}</p>
                        </div>
                        <div className="pl-2">
                          {isVerified && <span className="text-[10px] bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Used</span>}
                          {isPending && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending</span>}
                          {isExpired && <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Expired</span>}
                        </div>
                      </div>
                      {isPending && (
                        <div className="mt-2 bg-card rounded-lg p-2 border border-border/30 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">Show this code to merchant</p>
                          <p className="font-mono text-lg font-bold text-foreground tracking-[0.3em]">{r.redemption_code}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span>{r.points_spent} pts</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <ScrollReveal>
            <Link to="/admin" className="block">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-5 sm:p-6 border border-accent/20 flex items-center justify-between hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center"><Shield size={20} className="text-accent" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Admin Panel</p>
                    <p className="text-xs text-muted-foreground">Manage blogs, testimonials & messages</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-accent" />
              </div>
            </Link>
          </ScrollReveal>
        )}
        </>
        )}
      </div>

      {/* Reward Detail Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-sm">
          {selectedReward && (() => {
            const merchantCm = customerMerchants.find(cm => cm.merchant_id === selectedReward.merchant_id);
            const pointsForThisMerchant = merchantCm ? merchantCm.points_balance : 0;
            const progress = Math.min((pointsForThisMerchant / selectedReward.points_required) * 100, 100);
            const readyToRedeem = progress >= 100;
            const IconComp = rewardTypeIcon(selectedReward.reward_type);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <IconComp size={18} className="text-accent" /> {selectedReward.title}
                  </DialogTitle>
                  <DialogDescription>{selectedReward.store_name} · {selectedReward.reward_type}</DialogDescription>
                </DialogHeader>
                {selectedReward.description && <p className="text-sm text-muted-foreground">{selectedReward.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your points at {selectedReward.store_name}</span>
                    <span className="font-bold text-foreground">{pointsForThisMerchant}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Required</span>
                    <span className="font-bold text-foreground">{selectedReward.points_required}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {!readyToRedeem && (
                    <p className="text-xs text-muted-foreground text-center">You need {selectedReward.points_required - pointsForThisMerchant} more points at {selectedReward.store_name}</p>
                  )}
                </div>
                {readyToRedeem && (
                  <Button variant="hero" className="w-full gap-2" disabled={redeeming === selectedReward.id} onClick={() => handleRedeem(selectedReward.id)}>
                    <Ticket size={16} /> {redeeming === selectedReward.id ? "Redeeming..." : "Redeem Now"}
                  </Button>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Ways to Claim Points */}
      <Dialog open={showClaimInfo} onOpenChange={setShowClaimInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift size={18} className="text-secondary" /> Ways to Earn Points</DialogTitle>
            <DialogDescription>Here's how you can earn points at partner stores</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { icon: ScanBarcode, text: "Show your loyalty barcode or number at checkout" },
              { icon: Smartphone, text: "Merchant scans or enters your number" },
              { icon: Star, text: "Points are added instantly" },
              { icon: Gift, text: "Track your rewards anytime in Perk Back" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <item.icon size={14} className="text-secondary" />
                </div>
                <span className="text-sm text-foreground/80">{item.text}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption Success Modal */}
      {showRedemptionModal && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setShowRedemptionModal(null)}>
          <div className="bg-card rounded-2xl p-6 shadow-card-hover w-full max-w-sm animate-fade-up text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Reward Redeemed! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-4">{showRedemptionModal.title}</p>
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Your Redemption Code</p>
              <p className="font-mono text-3xl font-bold text-foreground tracking-[0.3em]">{showRedemptionModal.code}</p>
              <p className="text-xs text-muted-foreground mt-2">Show this code to the merchant</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>{showRedemptionModal.points} pts spent</span>
              <span>Valid for 48 hours</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { navigator.clipboard.writeText(showRedemptionModal.code); toast.success("Code copied!"); }}>
                <Copy size={14} /> Copy Code
              </Button>
              <Button variant="hero" size="sm" className="flex-1" onClick={() => setShowRedemptionModal(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCard;
