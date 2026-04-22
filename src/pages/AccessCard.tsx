import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Star, Calendar, Hash, User, CreditCard,
  ScanBarcode, Gift, Smartphone, Coffee, Sparkles,
  Tag, ArrowRight, Shield, Copy, Share2,
  CheckCircle, XCircle, Ticket, Store, MapPin, LogOut,
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import ScrollReveal from "@/components/ScrollReveal";
import ExploreTab from "@/components/customer/ExploreTab";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { getDeviceType } from "@/lib/deviceDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getIndustryImage } from "@/lib/industryImages";
import MyStoreCard from "@/components/customer/MyStoreCard";
import StoreDetailView from "@/components/customer/StoreDetailView";
import StoreRewardActionDialog from "@/components/customer/StoreRewardActionDialog";

interface CustomerData { id: string; full_name: string | null; crn: string | null; loyalty_card_number: string | null; card_issued_at: string | null; points_balance: number; }
interface CustomerMerchantData { merchant_id: string; store_name: string; points_balance: number; total_spend: number; visit_count: number; last_visit_at: string | null; logo_url?: string | null; industry_type?: string | null; address?: string | null; }
interface TransactionData { id: string; merchant_name: string; merchant_id: string | null; purchase_amount: number; points_awarded: number; transaction_date: string; }
interface RewardData { id: string; title: string; description: string | null; points_required: number; reward_type: string; is_limited_time: boolean; expires_at: string | null; merchant_id: string; store_name?: string; image_url?: string | null; }
interface CampaignData { id: string; title: string; description: string | null; ai_generated: boolean | null; image_url: string | null; target_segment: string | null; merchant_id: string; store_name?: string; }
interface MonthlyOfferData { id: string; title: string; description: string | null; valid_from: string | null; valid_to: string | null; merchant_id: string; store_name?: string; }
interface RedemptionData { id: string; reward_title: string; points_spent: number; redemption_code: string; status: string; expires_at: string; created_at: string; merchant_id: string; store_name?: string; }
interface MerchantCardData extends CustomerMerchantData { rewardCount: number; offerCount: number; bannerImage: string; }

const CAROUSEL_GRADIENTS = [
  "from-primary via-primary/90 to-secondary",
  "from-secondary via-secondary/90 to-primary",
  "from-accent/90 via-accent/80 to-primary/80",
];

const REWARD_GRADIENTS = [
  "from-primary/20 via-primary/10 to-secondary/10",
  "from-secondary/20 via-secondary/10 to-accent/10",
  "from-accent/20 via-accent/10 to-primary/10",
  "from-primary/15 via-secondary/15 to-accent/15",
];

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; };
const daysUntil = (dateStr: string) => { const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); return diff > 0 ? diff : 0; };
const rewardTypeIcon = (type: string) => { switch (type) { case "freebie": return Coffee; case "voucher": return Tag; case "discount": return Sparkles; default: return Gift; } };
const getDirectionsUrl = (address?: string | null) => address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : null;

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerMerchants, setCustomerMerchants] = useState<CustomerMerchantData[]>([]);
  const [activeStoreViewMerchantId, setActiveStoreViewMerchantId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferData[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(false);
  const { isAdmin, isMerchant, logout } = useAuth();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState<{ code: string; title: string; points: number; expires: string } | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardData | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<"my-rewards" | "my-card" | "explore" | "profile">("my-rewards");
  const [gamificationByMerchant, setGamificationByMerchant] = useState<Record<string, { stamp: boolean; streak: boolean; levels: boolean }>>({});
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const pointsSectionRef = useRef<HTMLDivElement | null>(null);

  const trackStoreSwitcherEvent = useCallback((eventName: string, merchant?: CustomerMerchantData | null) => {
    if (typeof window === "undefined") return;

    const detail = {
      event: eventName,
      merchantId: merchant?.merchant_id ?? null,
      merchantName: merchant?.store_name ?? null,
      source: "customer_my_store_switcher",
      timestamp: new Date().toISOString(),
    };

    window.dispatchEvent(new CustomEvent("perkback:analytics", { detail }));

    if ("dataLayer" in window && Array.isArray((window as Window & { dataLayer?: unknown[] }).dataLayer)) {
      (window as Window & { dataLayer: unknown[] }).dataLayer.push(detail);
    }
  }, []);

  const openStoreView = useCallback((merchantId: string) => {
    const merchant = customerMerchants.find((item) => item.merchant_id === merchantId) ?? null;
    setActiveStoreViewMerchantId(merchantId);
    trackStoreSwitcherEvent("customer_store_selected", merchant);
  }, [customerMerchants, trackStoreSwitcherEvent]);

  const closeStoreView = useCallback(() => {
    const merchant = activeStoreViewMerchantId
      ? customerMerchants.find((item) => item.merchant_id === activeStoreViewMerchantId) ?? null
      : null;
    setActiveStoreViewMerchantId(null);
    trackStoreSwitcherEvent("customer_store_cleared", merchant);
  }, [activeStoreViewMerchantId, customerMerchants, trackStoreSwitcherEvent]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!customer) return;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (pendingTimer) return;
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        fetchData();
      }, 1200);
    };
    let offersTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleOffersRefetch = () => {
      if (offersTimer) return;
      offersTimer = setTimeout(() => {
        offersTimer = null;
        fetchOffersData();
      }, 1200);
    };

    const channel = supabase
      .channel("customer-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (payload) => {
        if (payload.new.customer_id === customer.id) scheduleRefetch();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "customers" }, (payload) => {
        if (payload.new.id === customer.id) {
          setCustomer((prev) => prev ? { ...prev, points_balance: (payload.new as CustomerData).points_balance } : prev);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rewards" }, scheduleOffersRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, scheduleOffersRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "monthly_offers" }, scheduleOffersRefetch)
      .subscribe();
    return () => {
      if (pendingTimer) clearTimeout(pendingTimer);
      if (offersTimer) clearTimeout(offersTimer);
      supabase.removeChannel(channel);
    };
  }, [customer?.id]);

  const fetchOffersData = useCallback(async () => {
    if (!customer) return;
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name");
    const merchantMap = new Map((merchantsData || []).map((merchant) => [merchant.id, merchant.store_name]));
    const [rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
    ]);
    setRewards((rewardsRes.data || []).map((reward) => ({ ...reward, store_name: merchantMap.get(reward.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map((campaign) => ({ ...campaign, store_name: merchantMap.get(campaign.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map((offer) => ({ ...offer, store_name: merchantMap.get(offer.merchant_id) || "Store" })));
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
    const merchantMap = new Map((merchantsData || []).map((merchant) => [merchant.id, merchant.store_name]));
    const merchantLogoMap = new Map((merchantsData || []).map((merchant) => [merchant.id, merchant.logo_url]));
    const merchantIndustryMap = new Map((merchantsData || []).map((merchant) => [merchant.id, merchant.industry_type]));
    const merchantAddressMap = new Map((merchantsData || []).map((merchant) => [merchant.id, merchant.address]));

    const cmList: CustomerMerchantData[] = (cmData || []).map((merchant) => ({
      merchant_id: merchant.merchant_id,
      store_name: merchantMap.get(merchant.merchant_id) || "Store",
      points_balance: merchant.points_balance,
      total_spend: Number(merchant.total_spend),
      visit_count: merchant.visit_count,
      last_visit_at: merchant.last_visit_at,
      logo_url: merchantLogoMap.get(merchant.merchant_id),
      industry_type: merchantIndustryMap.get(merchant.merchant_id),
      address: merchantAddressMap.get(merchant.merchant_id),
    }));
    setCustomerMerchants(cmList);

    const [rewardsRes, campaignsRes, offersRes, redemptionsRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
      supabase.from("redemptions").select("*").eq("customer_id", customerData.id).order("created_at", { ascending: false }),
    ]);
    setRewards((rewardsRes.data || []).map((reward) => ({ ...reward, store_name: merchantMap.get(reward.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map((campaign) => ({ ...campaign, store_name: merchantMap.get(campaign.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map((offer) => ({ ...offer, store_name: merchantMap.get(offer.merchant_id) || "Store" })));
    setRedemptions((redemptionsRes.data || []).map((redemption) => ({ ...redemption, store_name: merchantMap.get(redemption.merchant_id) || "Store" })));

    const merchantIds = cmList.map((merchant) => merchant.merchant_id);
    if (merchantIds.length > 0) {
      const { data: gamData } = await supabase
        .from("gamification_settings")
        .select("merchant_id, stamp_card_enabled, visit_streak_enabled, levels_enabled")
        .in("merchant_id", merchantIds);
      const map: Record<string, { stamp: boolean; streak: boolean; levels: boolean }> = {};
      (gamData || []).forEach((gamification) => {
        map[gamification.merchant_id] = {
          stamp: !!gamification.stamp_card_enabled,
          streak: !!gamification.visit_streak_enabled,
          levels: !!gamification.levels_enabled,
        };
      });
      setGamificationByMerchant(map);
    }

    setLoading(false);
    setTimeout(() => setPointsVisible(true), 300);
  };

  const handleRedeem = async (rewardId: string) => {
    if (!customer) return;
    setRedeeming(rewardId);
    try {
      const { data, error } = await supabase.rpc("redeem_reward", { _customer_id: customer.id, _reward_id: rewardId });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; redemption_code: string; reward_title: string; points_spent: number; expires_at: string };
      if (!result.success) { toast.error(result.error || "Redemption failed"); return; }
      setSelectedReward(null);
      setShowRedemptionModal({ code: result.redemption_code, title: result.reward_title, points: result.points_spent, expires: result.expires_at });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Redemption failed";
      toast.error(message);
    } finally {
      setRedeeming(null);
    }
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied to clipboard`)).catch(() => toast.error("Failed to copy"));
  };

  const handleShare = async () => {
    if (!customer) return;
    const shareData = { title: "Perk Back Loyalty Card", text: `My Perk Back loyalty card: ${customer.loyalty_card_number}\nName: ${customer.full_name}\nCRN: ${customer.crn}` };
    if (navigator.share) { try { await navigator.share(shareData); } catch { /* noop */ } }
    else { navigator.clipboard.writeText(shareData.text || ""); toast.success("Card details copied to clipboard"); }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/get-started", { replace: true });
  };

  const [walletLoading, setWalletLoading] = useState<string | null>(null);
  const deviceType = getDeviceType();
  const isMobile = useIsMobile();

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add to Google Wallet";
      toast.error(message);
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
      const blob = new Blob([data], { type: "application/vnd.apple.pkpass" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "perkback-loyalty.pkpass";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Downloading your Apple Wallet pass...");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add to Apple Wallet";
      toast.error(message);
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

  const activeStoreMerchant = activeStoreViewMerchantId
    ? customerMerchants.find((merchant) => merchant.merchant_id === activeStoreViewMerchantId) ?? null
    : null;
  const storeRewards = activeStoreViewMerchantId ? rewards.filter((reward) => reward.merchant_id === activeStoreViewMerchantId) : [];
  const storeCampaigns = activeStoreViewMerchantId ? campaigns.filter((campaign) => campaign.merchant_id === activeStoreViewMerchantId) : [];
  const storeOffers = activeStoreViewMerchantId ? monthlyOffers.filter((offer) => offer.merchant_id === activeStoreViewMerchantId) : [];
  const storeTransactions = activeStoreViewMerchantId ? transactions.filter((transaction) => transaction.merchant_id === activeStoreViewMerchantId) : [];
  const filteredRedemptions = activeStoreViewMerchantId ? redemptions.filter((redemption) => redemption.merchant_id === activeStoreViewMerchantId) : redemptions;

  const merchantCards: MerchantCardData[] = customerMerchants
    .map((merchant) => {
      const merchantRewards = rewards.filter((reward) => reward.merchant_id === merchant.merchant_id);
      const merchantOffers = monthlyOffers.filter((offer) => offer.merchant_id === merchant.merchant_id);
      const merchantCampaignImage = campaigns.find((campaign) => campaign.merchant_id === merchant.merchant_id && campaign.image_url)?.image_url;
      const merchantRewardImage = merchantRewards.find((reward) => reward.image_url)?.image_url;

      return {
        ...merchant,
        rewardCount: merchantRewards.length,
        offerCount: merchantOffers.length,
        bannerImage: merchantCampaignImage ?? merchantRewardImage ?? getIndustryImage(merchant.industry_type),
      };
    })
    .sort((a, b) => b.points_balance - a.points_balance);

  const activeStoreCard = activeStoreMerchant
    ? merchantCards.find((merchant) => merchant.merchant_id === activeStoreMerchant.merchant_id) ?? null
    : null;

  const dashboardSectionShell = "rounded-[28px] border border-border/35 bg-card/90 shadow-card backdrop-blur-sm";
  const issuedDate = customer.card_issued_at ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const displayPoints = customer.points_balance;
  const overviewRewards = rewards;
  const overviewCampaigns = campaigns;
  const overviewOffers = monthlyOffers;
  const overviewTransactions = transactions;

  const carouselSlides = [
    ...overviewCampaigns.map((campaign) => ({ type: "campaign" as const, id: campaign.id, title: campaign.title, description: campaign.description, store: campaign.store_name, endsIn: null, image_url: campaign.image_url, merchant_id: campaign.merchant_id })),
    ...overviewOffers.map((offer) => ({ type: "offer" as const, id: offer.id, title: offer.title, description: offer.description, store: offer.store_name, endsIn: offer.valid_to ? daysUntil(offer.valid_to) : null, image_url: null as string | null, merchant_id: offer.merchant_id })),
  ];

  const nearestReward = overviewRewards.length > 0
    ? overviewRewards.reduce((closest, reward) => {
        const diff = reward.points_required - displayPoints;
        const closestDiff = closest.points_required - displayPoints;
        if (diff > 0 && (closestDiff <= 0 || diff < closestDiff)) return reward;
        return closest;
      }, overviewRewards[0])
    : null;
  const nearestProgress = nearestReward ? Math.min((displayPoints / nearestReward.points_required) * 100, 100) : 0;

  const rewardMerchant = selectedReward
    ? customerMerchants.find((merchant) => merchant.merchant_id === selectedReward.merchant_id) ?? null
    : null;
  const rewardDirectionsUrl = getDirectionsUrl(rewardMerchant?.address);

  return (
    <>
      <div className="min-h-screen bg-muted/20 pb-24 sm:pb-0">
        {!isMobile && <Header />}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
          <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto max-w-lg space-y-4 px-4 pb-20 pt-6 sm:space-y-5 sm:pt-24">
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

          <div className="sticky top-3 z-20 rounded-[28px] border border-border/40 bg-background/95 p-2 shadow-card backdrop-blur-md">
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1">
              {[
                { key: "my-rewards" as const, label: "Rewards" },
                { key: "my-card" as const, label: "Card" },
                { key: "explore" as const, label: "Explore" },
                { key: "profile" as const, label: "Profile" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveMainTab(tab.key)}
                  className={`min-w-0 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all duration-300 sm:text-xs ${
                    activeMainTab === tab.key
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-button"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeMainTab === "explore" ? (
            <ExploreTab customerMerchantIds={customerMerchants.map((merchant) => merchant.merchant_id)} />
          ) : activeMainTab === "profile" ? (
            <>
              <ScrollReveal>
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <User size={16} className="text-secondary" /> Profile
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Full Name", value: customer.full_name || "—", icon: User },
                      { label: "CRN", value: customer.crn || "—", icon: Hash },
                      { label: "Card Number", value: customer.loyalty_card_number || "—", icon: CreditCard },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><item.icon size={12} /> {item.label}</span>
                        <span className="text-xs font-semibold text-foreground font-mono text-right break-all">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={50}>
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Shield size={16} className="text-muted-foreground" /> Account Settings
                    </h3>
                    <p className="text-xs text-muted-foreground">Manage your session and account controls from one place.</p>
                  </div>
                  <div className="grid gap-2">
                    {isMerchant && (
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-10" asChild>
                        <Link to="/merchant/dashboard">
                          <Store size={14} /> Merchant Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="justify-start gap-2 h-10" onClick={handleLogout}>
                      <LogOut size={14} /> Log out
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 h-10 text-destructive hover:text-destructive" onClick={() => setShowDeleteAccountDialog(true)}>
                      <XCircle size={14} /> Delete my account
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Info size={16} className="text-muted-foreground" /> Pages
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "About Us", href: "/about?web=1" },
                      { label: "Pricing", href: "/pricing?web=1" },
                      { label: "Testimonials", href: "/testimonials?web=1" },
                      { label: "Reviews", href: "/reviews?web=1" },
                      { label: "Blog", href: "/blog?web=1" },
                      { label: "Contact", href: "/contact?web=1" },
                      { label: "Privacy", href: "/privacy?web=1" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="rounded-xl border border-border/50 bg-muted/30 px-3 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </>
          ) : activeMainTab === "my-card" ? (
            <>
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
                    ].map((item) => (
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
            <div className="space-y-4">
              {activeStoreCard ? (
                <StoreDetailView
                  merchant={activeStoreCard}
                  rewards={storeRewards}
                  campaigns={storeCampaigns}
                  offers={storeOffers}
                  transactions={storeTransactions}
                  customerId={customer.id}
                  loyaltyCardNumber={customer.loyalty_card_number || ""}
                  directionsUrl={getDirectionsUrl(activeStoreCard.address)}
                  gamification={gamificationByMerchant[activeStoreCard.merchant_id]}
                  onBack={closeStoreView}
                  onRewardSelect={setSelectedReward}
                  onCampaignSelect={setSelectedCampaign}
                />
              ) : (
                <>
                  <ScrollReveal>
                    <div
                      ref={pointsSectionRef}
                      className={`relative overflow-hidden rounded-[30px] border bg-card p-5 text-center shadow-card transition-all duration-500 sm:p-6 ${
                        highlightedSection === "points" ? "border-primary/50 shadow-hero" : "border-border/50"
                      }`}
                    >
                      <div className="floating-dot w-6 h-6 bg-accent/15 -top-1 right-[15%]" style={{ animationDelay: "0s" }} />
                      <div className="floating-dot w-4 h-4 bg-secondary/10 bottom-2 left-[10%]" style={{ animationDelay: "1.5s" }} />

                      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-3 relative z-10">
                        Total Points Balance
                      </p>
                      <div className={`flex items-center justify-center gap-3 transition-all duration-700 relative z-10 ${pointsVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
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

                  {merchantCards.length > 0 && (
                    <ScrollReveal delay={15}>
                      <div className={`${dashboardSectionShell} space-y-4 p-5 sm:p-6`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Store size={16} className="text-secondary" /> My Stores
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Tap a store card to open its rewards, offers, directions, and loyalty details.
                            </p>
                          </div>
                          <span className="rounded-full bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                            {merchantCards.length} joined
                          </span>
                        </div>

                        <div className="overflow-x-auto pb-1 -mx-1 px-1">
                          <div className="flex gap-4 min-w-max">
                            {merchantCards.map((merchant) => (
                              <MyStoreCard key={merchant.merchant_id} merchant={merchant} onSelect={openStoreView} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {customerMerchants.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {customerMerchants.map((merchant) => {
                        const gamification = gamificationByMerchant[merchant.merchant_id];
                        if (!gamification) return null;
                        if (!gamification.levels && !gamification.streak) return null;
                        return (
                          <MerchantStatusCard
                            key={merchant.merchant_id}
                            merchantId={merchant.merchant_id}
                            storeName={merchant.store_name}
                            pointsBalance={merchant.points_balance}
                            transactions={transactions}
                            showTier={gamification.levels}
                            showStreak={gamification.streak}
                          />
                        );
                      })}
                    </div>
                  )}

                  {carouselSlides.length > 0 && (
                    <ScrollReveal delay={50}>
                      <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
                        <CarouselContent>
                          {carouselSlides.map((slide, index) => (
                            <CarouselItem key={`${slide.type}-${index}`}>
                              <button
                                onClick={() => {
                                  if (slide.type === "campaign") {
                                    const campaign = campaigns.find((item) => item.id === slide.id);
                                    if (campaign) setSelectedCampaign(campaign);
                                    return;
                                  }
                                  openStoreView(slide.merchant_id);
                                }}
                                className="w-full text-left"
                              >
                                <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${CAROUSEL_GRADIENTS[index % CAROUSEL_GRADIENTS.length]} p-5 sm:p-6 min-h-[160px] flex flex-col justify-between`}>
                                  {slide.image_url && (
                                    <div className="absolute inset-0">
                                      <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/50 to-foreground/25" />
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
                            {Array.from({ length: slideCount }).map((_, index) => (
                              <button key={index} onClick={() => carouselApi?.scrollTo(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-primary w-5" : "bg-border"}`} />
                            ))}
                          </div>
                        )}
                      </Carousel>
                    </ScrollReveal>
                  )}

                  <ScrollReveal delay={75}>
                    <div
                      ref={rewardsSectionRef}
                      className={`${dashboardSectionShell} p-5 transition-all duration-500 sm:p-6 ${
                        highlightedSection === "rewards" ? "border-accent/50 shadow-hero" : "border-border/50"
                      }`}
                    >
                      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Gift size={16} className="text-accent" /> Available Rewards
                      </h3>
                      {overviewRewards.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mx-auto mb-3"><Gift size={24} className="text-accent" /></div>
                          <p className="text-sm font-medium text-foreground">No rewards available yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Shop at partner stores to unlock exclusive rewards!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Carousel setApi={setRewardsApi} opts={{ loop: false, align: "start" }} className="w-full">
                            <CarouselContent>
                              {overviewRewards.map((reward, index) => {
                                const merchant = customerMerchants.find((item) => item.merchant_id === reward.merchant_id);
                                const pointsForThisMerchant = merchant ? merchant.points_balance : 0;
                                const progress = Math.min((pointsForThisMerchant / reward.points_required) * 100, 100);
                                const readyToRedeem = progress >= 100;
                                const almostThere = progress >= 80 && progress < 100;
                                const IconComp = rewardTypeIcon(reward.reward_type);
                                const gradient = REWARD_GRADIENTS[index % REWARD_GRADIENTS.length];
                                return (
                                  <CarouselItem key={reward.id} className="basis-full">
                                    <div
                                      onClick={() => setSelectedReward(reward)}
                                      className={`w-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border ${
                                        readyToRedeem
                                          ? "border-accent/40 shadow-[0_0_25px_-4px_hsl(var(--accent)/0.4)]"
                                          : "border-border/20 shadow-card"
                                      }`}
                                    >
                                      <div className="relative h-[180px] overflow-hidden">
                                        {reward.image_url ? (
                                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                          <div className={`w-full h-full bg-gradient-to-br ${gradient}`}>
                                            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-background/10 border border-background/20" />
                                            <div className="absolute bottom-12 left-4 w-8 h-8 rounded-full bg-background/10 border border-background/20" />
                                          </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                          {readyToRedeem && (
                                            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">✨ Ready!</span>
                                          )}
                                          <span className="text-[9px] uppercase tracking-wider font-semibold bg-foreground/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-primary-foreground/90">{reward.reward_type}</span>
                                        </div>
                                        <div className="absolute top-3 left-3">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm ${readyToRedeem ? "bg-accent/30" : "bg-foreground/35"}`}>
                                            <IconComp size={18} className="text-primary-foreground" />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-card p-4 space-y-2">
                                        <p className="font-bold text-base text-foreground leading-tight">{reward.title}</p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Store size={10} /> {reward.store_name}</p>
                                        {reward.description && <p className="text-[10px] text-muted-foreground/80 line-clamp-2">{reward.description}</p>}
                                        <div className="pt-1">
                                          <div className="flex items-center justify-between text-[10px] mb-1">
                                            <span className="text-muted-foreground">{pointsForThisMerchant}/{reward.points_required} pts</span>
                                            {readyToRedeem && <span className="text-accent font-bold">✨ Ready!</span>}
                                            {almostThere && <span className="text-secondary font-semibold">Almost there!</span>}
                                          </div>
                                          <Progress value={progress} className="h-1.5" />
                                        </div>
                                        {readyToRedeem ? (
                                          <Button
                                            variant="hero"
                                            size="sm"
                                            className="w-full gap-1.5 text-xs mt-1"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setSelectedReward(reward);
                                            }}
                                          >
                                            <Ticket size={12} /> Claim Reward
                                          </Button>
                                        ) : (
                                          <p className="text-[10px] text-center text-muted-foreground mt-1">
                                            {reward.points_required - pointsForThisMerchant} pts to go
                                          </p>
                                        )}
                                        {reward.is_limited_time && reward.expires_at && (
                                          <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5"><Clock size={8} /> Expires {new Date(reward.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                                        )}
                                      </div>
                                    </div>
                                  </CarouselItem>
                                );
                              })}
                            </CarouselContent>
                          </Carousel>
                          {rewardsCount > 1 && (
                            <div className="flex justify-center gap-1.5">
                              {Array.from({ length: rewardsCount }).map((_, index) => (
                                <button key={index} onClick={() => rewardsApi?.scrollTo(index)}
                                  className={`h-2 rounded-full transition-all duration-300 ${index === rewardsSlide ? "bg-accent w-5" : "bg-border w-2"}`} aria-label={`Go to reward ${index + 1}`} />
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-center text-muted-foreground">Swipe to see more rewards →</p>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>

                  {overviewOffers.length > 0 && (
                    <ScrollReveal delay={125}>
                      <div
                        ref={offersSectionRef}
                        className={`${dashboardSectionShell} p-5 transition-all duration-500 sm:p-6 ${
                          highlightedSection === "offers" ? "border-secondary/50 shadow-hero" : "border-border/50"
                        }`}
                      >
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <CalendarDays size={16} className="text-accent" /> Monthly Offers
                        </h3>
                        <div className="space-y-3">
                          {overviewOffers.map((offer) => (
                            <div key={offer.id} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                                <CalendarDays size={16} className="text-accent-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs sm:text-sm text-foreground">{offer.title}</p>
                                {offer.description && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{offer.description}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-muted-foreground/60">{offer.store_name}</span>
                                  {offer.valid_to && (
                                    <span className="text-[10px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Clock size={8} /> Ends in {daysUntil(offer.valid_to)} days
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

                  <ScrollReveal delay={150}>
                    <div className={`${dashboardSectionShell} overflow-hidden`}>
                      <button onClick={() => setShowTransactions(!showTransactions)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Shield size={16} className="text-secondary" /> Points Earned
                          <span className="text-xs font-normal text-muted-foreground">({overviewTransactions.length})</span>
                        </h3>
                        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${showTransactions ? "rotate-90" : ""}`} />
                      </button>
                      {showTransactions && (
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
                          {overviewTransactions.length === 0 ? (
                            <div className="text-center py-6">
                              <Gift size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No transactions yet.</p>
                            </div>
                          ) : (
                            overviewTransactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{transaction.merchant_name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-muted-foreground">${transaction.purchase_amount.toFixed(2)}</span>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Clock size={10} /> {new Date(transaction.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-accent-foreground bg-accent/15 px-2 py-1 rounded-lg">+{transaction.points_awarded}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>

                  {filteredRedemptions.length > 0 && (
                    <ScrollReveal delay={175}>
                      <div className={`${dashboardSectionShell} overflow-hidden`}>
                        <Collapsible>
                          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-muted/20 transition-colors group">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Ticket size={16} className="text-secondary" /> My Redemptions
                              <span className="text-xs font-normal text-muted-foreground">({filteredRedemptions.length})</span>
                            </h3>
                            <ChevronRight size={16} className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
                              {filteredRedemptions.map((redemption) => {
                                const isExpired = redemption.status === "expired" || (redemption.status === "pending" && new Date(redemption.expires_at) < new Date());
                                const isVerified = redemption.status === "verified";
                                const isPending = redemption.status === "pending" && !isExpired;
                                return (
                                  <div key={redemption.id} className={`p-3 rounded-xl border ${isPending ? "border-accent/30 bg-accent/5" : "border-border/30 bg-muted/30"}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-xs text-foreground">{redemption.reward_title}</p>
                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{redemption.store_name}</p>
                                      </div>
                                      <div className="pl-2">
                                        {isVerified && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Used</span>}
                                        {isPending && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending</span>}
                                        {isExpired && <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Expired</span>}
                                      </div>
                                    </div>
                                    {isPending && (
                                      <div className="mt-2 bg-card rounded-lg p-2 border border-border/30 text-center">
                                        <p className="text-[10px] text-muted-foreground mb-1">Show this code to merchant</p>
                                        <p className="font-mono text-lg font-bold text-foreground tracking-[0.3em]">{redemption.redemption_code}</p>
                                        <p className="text-[9px] text-muted-foreground/60 mt-1">Expires {new Date(redemption.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                      <span>{redemption.points_spent} pts</span>
                                      <span className="text-muted-foreground/30">·</span>
                                      <span>{new Date(redemption.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </ScrollReveal>
                  )}
                </>
              )}

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
            </div>
          )}
        </div>

        <StoreRewardActionDialog
          open={!!selectedReward}
          onOpenChange={(open) => !open && setSelectedReward(null)}
          reward={selectedReward}
          pointsBalance={rewardMerchant?.points_balance ?? 0}
          directionsUrl={rewardDirectionsUrl}
          address={rewardMerchant?.address}
          redeeming={redeeming === selectedReward?.id}
          onRedeem={handleRedeem}
        />

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
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-secondary" />
                  </div>
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {showRedemptionModal && (
          <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setShowRedemptionModal(null)}>
            <div className="bg-card rounded-2xl p-6 shadow-card-hover w-full max-w-sm animate-fade-up text-center" onClick={(event) => event.stopPropagation()}>
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

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          {selectedCampaign && (() => {
            const merchant = customerMerchants.find((item) => item.merchant_id === selectedCampaign.merchant_id);
            return (
              <>
                <div className="relative h-44 bg-gradient-to-br from-primary via-primary/90 to-secondary">
                  {selectedCampaign.image_url ? (
                    <>
                      <img src={selectedCampaign.image_url} alt={selectedCampaign.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Megaphone size={56} className="text-primary-foreground/40" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] uppercase tracking-wider text-primary-foreground/80 bg-foreground/30 backdrop-blur px-2 py-0.5 rounded-full">Campaign</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <DialogHeader className="space-y-1.5 text-left">
                    <DialogTitle className="text-xl">{selectedCampaign.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1.5 text-xs">
                      <Store size={12} /> {selectedCampaign.store_name}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedCampaign.description && (
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedCampaign.description}</p>
                  )}
                  {merchant?.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span>{merchant.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedCampaign(null)}>Close</Button>
                    {merchant && (
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          openStoreView(selectedCampaign.merchant_id);
                          setSelectedCampaign(null);
                        }}
                      >
                        Visit Store <ArrowRight size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        accountType="customer"
      />
    </>
  );
};

export default AccessCard;
