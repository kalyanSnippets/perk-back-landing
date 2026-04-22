import { useState, useEffect, useCallback, useRef } from "react";
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
  CheckCircle, XCircle, Ticket, Info, Store, ArrowLeft, MapPin, LogOut
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import ScrollReveal from "@/components/ScrollReveal";
import ExploreTab from "@/components/customer/ExploreTab";
import StampCardProgress from "@/components/customer/StampCardProgress";
import MerchantStatusCard from "@/components/customer/MerchantStatusCard";
import NfcTapButton from "@/components/customer/NfcTapButton";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { getDeviceType } from "@/lib/deviceDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
  const { isAdmin, isMerchant, logout } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [rewardsApi, setRewardsApi] = useState<CarouselApi>();
  const [rewardsSlide, setRewardsSlide] = useState(0);
  const [rewardsCount, setRewardsCount] = useState(0);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState<{ code: string; title: string; points: number; expires: string } | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardData | null>(null);
  const [showClaimInfo, setShowClaimInfo] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"my-rewards" | "my-card" | "explore" | "profile">("my-rewards");
  const [gamificationByMerchant, setGamificationByMerchant] = useState<Record<string, { stamp: boolean; streak: boolean; levels: boolean }>>({});
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<"points" | "rewards" | "offers" | null>(null);
  const [highlightedRewardId, setHighlightedRewardId] = useState<string | null>(null);
  const pointsSectionRef = useRef<HTMLDivElement | null>(null);
  const rewardsSectionRef = useRef<HTMLDivElement | null>(null);
  const offersSectionRef = useRef<HTMLDivElement | null>(null);

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

  const handleMerchantSelection = useCallback((merchantId: string | null) => {
    const merchant = merchantId ? customerMerchants.find((item) => item.merchant_id === merchantId) ?? null : null;
    setIsSummaryLoading(true);
    setSelectedMerchantId(merchantId);
    trackStoreSwitcherEvent(merchantId ? "customer_store_selected" : "customer_store_cleared", merchant);
  }, [customerMerchants, trackStoreSwitcherEvent]);

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
    const interval = setInterval(() => carouselApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  useEffect(() => {
    if (!rewardsApi) return;
    setRewardsCount(rewardsApi.scrollSnapList().length);
    setRewardsSlide(rewardsApi.selectedScrollSnap());
    rewardsApi.on("select", () => setRewardsSlide(rewardsApi.selectedScrollSnap()));
    rewardsApi.on("reInit", () => {
      setRewardsCount(rewardsApi.scrollSnapList().length);
      setRewardsSlide(rewardsApi.selectedScrollSnap());
    });
  }, [rewardsApi]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!isSummaryLoading) return;

    const timer = window.setTimeout(() => setIsSummaryLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, [isSummaryLoading]);

  useEffect(() => {
    if (!highlightedSection && !highlightedRewardId) return;

    const timer = window.setTimeout(() => {
      setHighlightedSection(null);
      setHighlightedRewardId(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [highlightedSection, highlightedRewardId]);

  useEffect(() => {
    if (!customer) return;
    // Throttle bursty realtime events: collapse multiple inserts/updates within
    // 1.2s into a single refetch to avoid render storms on the customer dashboard.
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
      .channel('customer-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new.customer_id === customer.id) scheduleRefetch();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
        // Use the realtime payload directly — no need to re-fetch the whole page.
        if (payload.new.id === customer.id) {
          setCustomer((prev) => prev ? { ...prev, points_balance: (payload.new as any).points_balance } : prev);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, scheduleOffersRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, scheduleOffersRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_offers' }, scheduleOffersRefetch)
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

    // Fetch per-merchant gamification settings to gate the status indicator
    const merchantIds = cmList.map(cm => cm.merchant_id);
    if (merchantIds.length > 0) {
      const { data: gamData } = await supabase
        .from("gamification_settings")
        .select("merchant_id, stamp_card_enabled, visit_streak_enabled, levels_enabled")
        .in("merchant_id", merchantIds);
      const map: Record<string, { stamp: boolean; streak: boolean; levels: boolean }> = {};
      (gamData || []).forEach(g => {
        map[g.merchant_id] = {
          stamp: !!g.stamp_card_enabled,
          streak: !!g.visit_streak_enabled,
          levels: !!g.levels_enabled,
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

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/get-started", { replace: true });
  };

  const focusRewardsSection = useCallback((section: "points" | "rewards" | "offers") => {
    setActiveMainTab("my-rewards");
    setHighlightedSection(section);

    const sectionMap = {
      points: pointsSectionRef,
      rewards: rewardsSectionRef,
      offers: offersSectionRef,
    } as const;

    window.requestAnimationFrame(() => {
      sectionMap[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
  const selectedMerchantAccent = selectedMerchant
    ? INDUSTRY_COLORS[selectedMerchant.industry_type || ""] ?? { bg: "from-primary/20 via-primary/10 to-secondary/10", border: "border-primary/30", text: "text-primary" }
    : null;
  const selectedMerchantSpotlightImage = selectedMerchant
    ? filteredCampaigns.find((campaign) => campaign.image_url)?.image_url
      ?? filteredRewards.find((reward) => reward.image_url)?.image_url
      ?? null
    : null;
  const selectedMerchantMapUrl = selectedMerchant?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMerchant.address)}`
    : null;
  const selectedMerchantTopReward = selectedMerchant
    ? filteredRewards.slice().sort((a, b) => a.points_required - b.points_required)[0] ?? null
    : null;
  const selectedMerchantReadyReward = selectedMerchant
    ? filteredRewards.find((reward) => reward.points_required <= selectedMerchant.points_balance) ?? null
    : null;
  const handleCheckPoints = () => {
    focusRewardsSection("points");
    setPointsVisible(false);
    window.setTimeout(() => setPointsVisible(true), 50);
  };
  const handleViewOffers = () => {
    if (!selectedMerchant) return;

    if (filteredOffers.length > 0) {
      focusRewardsSection("offers");
      toast.success(`Showing offers for ${selectedMerchant.store_name}`);
      return;
    }

    setShowStoreDetails(true);
    toast.message(`${selectedMerchant.store_name} has no live offers right now.`);
  };
  const handleQuickRedeem = () => {
    if (!selectedMerchant) return;

    if (!selectedMerchantReadyReward) {
      if (selectedMerchantTopReward) {
        setHighlightedRewardId(selectedMerchantTopReward.id);
        focusRewardsSection("rewards");
        toast.message(`Next reward: ${selectedMerchantTopReward.title}`);
        return;
      }

      setShowStoreDetails(true);
      toast.message("No rewards are available for this store yet.");
      return;
    }

    setHighlightedRewardId(selectedMerchantReadyReward.id);
    setSelectedReward(selectedMerchantReadyReward);
  };

  const issuedDate = customer.card_issued_at ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const carouselSlides = [
    ...filteredCampaigns.map(c => ({ type: "campaign" as const, id: c.id, title: c.title, description: c.description, store: c.store_name, endsIn: null, image_url: c.image_url, merchant_id: c.merchant_id })),
    ...filteredOffers.map(o => ({ type: "offer" as const, id: o.id, title: o.title, description: o.description, store: o.store_name, endsIn: o.valid_to ? daysUntil(o.valid_to) : null, image_url: null as string | null, merchant_id: o.merchant_id })),
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
    <>
    <div className="min-h-screen bg-muted/20 pb-24 sm:pb-0">
      {!isMobile && <Header />}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5 pb-20 pt-6 sm:pt-24">

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

        {/* ─── Main Tab Switcher — Top navigation for all breakpoints ─── */}
        <div className="sticky top-3 z-20 rounded-2xl border border-border/50 bg-background/95 p-2 shadow-card backdrop-blur-md">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1">
          {[
            { key: "my-rewards" as const, label: "Rewards" },
            { key: "my-card" as const, label: "Card" },
            { key: "explore" as const, label: "Explore" },
            { key: "profile" as const, label: "Profile" },
          ].map(tab => (
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
          <ExploreTab customerMerchantIds={customerMerchants.map(cm => cm.merchant_id)} />
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
                  ].map(item => (
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

        {/* Points Balance — Vibrant — TOP */}
        <ScrollReveal>
          <div
            ref={pointsSectionRef}
            className={`relative overflow-hidden bg-card rounded-2xl p-5 sm:p-6 shadow-card border text-center transition-all duration-500 ${
              highlightedSection === "points" ? "border-primary/50 shadow-hero" : "border-border/50"
            }`}
          >
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

        {/* My Store */}
        {customerMerchants.length > 0 && (
          <ScrollReveal delay={15}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Store size={16} className="text-secondary" /> My Store
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Switch stores anytime to filter your rewards, offers, activity, and progress.
                  </p>
                </div>
                {selectedMerchant && (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={() => handleMerchantSelection(null)}>
                    View All
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <Select
                  value={selectedMerchantId ?? "all"}
                  onOpenChange={(open) => {
                    if (open) trackStoreSwitcherEvent("customer_store_switcher_opened", selectedMerchant);
                  }}
                  onValueChange={(value) => handleMerchantSelection(value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
                    <SelectValue placeholder="Choose a store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {customerMerchants.map((merchant) => (
                      <SelectItem key={merchant.merchant_id} value={merchant.merchant_id}>
                        {merchant.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleMerchantSelection(null)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
                      !selectedMerchant
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Stores
                  </button>
                  {customerMerchants.slice(0, 2).map((merchant) => {
                    const isActive = selectedMerchantId === merchant.merchant_id;
                    return (
                      <button
                        key={merchant.merchant_id}
                        onClick={() => handleMerchantSelection(merchant.merchant_id)}
                        className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {merchant.store_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-5">
                {isSummaryLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-full max-w-[220px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-border/40 bg-background px-3 py-3 space-y-2">
                          <Skeleton className="h-3 w-14" />
                          <Skeleton className="h-6 w-10" />
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-xl" />)}
                    </div>
                  </div>
                ) : selectedMerchant ? (
                  <div className="space-y-4">
                    <div className={`relative overflow-hidden rounded-[20px] border ${selectedMerchantAccent?.border || "border-border/40"}`}>
                      {selectedMerchantSpotlightImage ? (
                        <>
                          <img src={selectedMerchantSpotlightImage} alt={selectedMerchant.store_name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-background/95 via-background/70 to-background/20" />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${selectedMerchantAccent?.bg || "from-primary/20 via-primary/10 to-secondary/10"}`} />
                      )}

                      <div className="pointer-events-none absolute -top-12 right-[-18px] h-32 w-32 rounded-full border border-background/20" />
                      <div className="pointer-events-none absolute -bottom-10 left-[-22px] h-24 w-24 rounded-full bg-background/10" />

                      <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 rounded-2xl border border-background/30 bg-background/90 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                            {selectedMerchant.logo_url ? (
                              <img src={selectedMerchant.logo_url} alt={selectedMerchant.store_name} className="h-full w-full object-cover" />
                            ) : (
                              <Store size={22} className={selectedMerchantAccent?.text || "text-secondary"} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-background/80 text-foreground hover:bg-background/80">Selected store</Badge>
                              {selectedMerchantReadyReward && <Badge className="bg-accent text-accent-foreground">Reward ready</Badge>}
                              {!selectedMerchantReadyReward && selectedMerchantTopReward && (
                                <Badge variant="outline" className="border-background/30 bg-background/60 text-foreground">
                                  {Math.max(selectedMerchantTopReward.points_required - selectedMerchant.points_balance, 0)} pts to go
                                </Badge>
                              )}
                            </div>
                            <h4 className="mt-3 text-lg font-bold text-foreground truncate">{selectedMerchant.store_name}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-foreground/75">
                              {selectedMerchant.industry_type && <span>{selectedMerchant.industry_type}</span>}
                              {selectedMerchant.address && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                  <MapPin size={11} />
                                  <span className="truncate">{selectedMerchant.address}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/60">Store points</p>
                                <p className="mt-1 text-3xl font-bold text-foreground">{selectedMerchant.points_balance}</p>
                              </div>
                              <div className="rounded-2xl border border-background/25 bg-background/80 px-3 py-2 text-right">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reward focus</p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {selectedMerchantTopReward ? selectedMerchantTopReward.title : "No store rewards yet"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "Points", value: `${selectedMerchant.points_balance}` },
                        { label: "Rewards", value: `${filteredRewards.length}` },
                        { label: "Offers", value: `${filteredOffers.length}` },
                        { label: "Visits", value: `${selectedMerchant.visit_count}` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border/40 bg-background px-3 py-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background p-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reward focus</p>
                          <h5 className="text-sm font-semibold text-foreground">
                            {selectedMerchantTopReward ? selectedMerchantTopReward.title : "No store rewards yet"}
                          </h5>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-[11px]" onClick={() => setShowStoreDetails(true)}>
                          View details
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedMerchantTopReward
                          ? selectedMerchantTopReward.description || `Track your next reward from ${selectedMerchant.store_name}.`
                          : `This store has no active rewards right now. Check back soon for new offers and perks.`}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" size="sm" className="h-10 justify-start" onClick={handleViewOffers}>
                          <CalendarDays size={14} /> View offers
                        </Button>
                        <Button variant="hero" size="sm" className="h-10 justify-start" onClick={handleQuickRedeem}>
                          <Ticket size={14} /> Redeem reward
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 justify-start" onClick={handleCheckPoints}>
                          <Star size={14} /> Check points
                        </Button>
                        {selectedMerchantMapUrl ? (
                          <Button variant="outline" size="sm" className="h-10 justify-start" asChild>
                            <a href={selectedMerchantMapUrl} target="_blank" rel="noreferrer">
                              <MapPin size={14} /> Get directions
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-10 justify-start" onClick={() => setShowStoreDetails(true)}>
                            <Info size={14} /> Store details
                          </Button>
                        )}
                      </div>
                      <div className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
                        {selectedMerchantReadyReward
                          ? `Best next step: redeem ${selectedMerchantReadyReward.title} while it’s ready.`
                          : selectedMerchantTopReward
                            ? `You’re ${Math.max(selectedMerchantTopReward.points_required - selectedMerchant.points_balance, 0)} points away from ${selectedMerchantTopReward.title}.`
                            : `No rewards or offers are live yet for ${selectedMerchant.store_name}, so keep earning and check back soon.`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">All stores overview</p>
                      <h4 className="text-base font-bold text-foreground">Your rewards network at a glance</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Browse everything across your connected stores, or choose one store above for a focused view.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "Stores", value: `${customerMerchants.length}` },
                        { label: "Rewards", value: `${filteredRewards.length}` },
                        { label: "Offers", value: `${filteredOffers.length}` },
                        { label: "Visits", value: `${customerMerchants.reduce((total, merchant) => total + merchant.visit_count, 0)}` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border/40 bg-background px-3 py-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-dashed border-border/50 bg-background/70 px-4 py-4 text-center">
                      <Store size={18} className="mx-auto text-secondary" />
                      <p className="mt-2 text-sm font-semibold text-foreground">Choose a store for focused rewards</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Similar loyalty apps keep the default view broad, then unlock store-specific rewards, offers, and quick actions after selection.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Your Status — slim bar, only when merchant has gamification enabled */}
        {customerMerchants.length > 0 && (
          <div className="space-y-2">
            {(selectedMerchantId
              ? customerMerchants.filter(cm => cm.merchant_id === selectedMerchantId)
              : customerMerchants
            ).map(cm => {
              const gam = gamificationByMerchant[cm.merchant_id];
              if (!gam) return null;
              if (!gam.levels && !gam.streak) return null;
              return (
                <MerchantStatusCard
                  key={cm.merchant_id}
                  merchantId={cm.merchant_id}
                  storeName={cm.store_name}
                  pointsBalance={cm.points_balance}
                  transactions={transactions}
                  showTier={gam.levels}
                  showStreak={gam.streak}
                />
              );
            })}
          </div>
        )}


        {carouselSlides.length > 0 && (
          <ScrollReveal delay={50}>
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {carouselSlides.map((slide, i) => (
                  <CarouselItem key={`${slide.type}-${i}`}>
                    <button
                      onClick={() => {
                        if (slide.type === "campaign") {
                          const c = campaigns.find(x => x.id === slide.id);
                          if (c) setSelectedCampaign(c);
                          return;
                        }
                        const cm = customerMerchants.find(c => c.merchant_id === slide.merchant_id);
                        if (cm) handleMerchantSelection(slide.merchant_id);
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
                <Carousel setApi={setRewardsApi} opts={{ loop: false, align: "start" }} className="w-full">
                  <CarouselContent>
                    {filteredRewards.map((r, idx) => {
                      const merchantCm = customerMerchants.find(cm => cm.merchant_id === r.merchant_id);
                      const pointsForThisMerchant = merchantCm ? merchantCm.points_balance : 0;
                      const progress = Math.min((pointsForThisMerchant / r.points_required) * 100, 100);
                      const readyToRedeem = progress >= 100;
                      const almostThere = progress >= 80 && progress < 100;
                      const IconComp = rewardTypeIcon(r.reward_type);
                      const gradient = REWARD_GRADIENTS[idx % REWARD_GRADIENTS.length];
                      return (
                        <CarouselItem key={r.id} className="basis-full">
                          <div onClick={() => setSelectedReward(r)}
                            className={`w-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border ${
                              readyToRedeem
                                ? 'border-accent/40 shadow-[0_0_25px_-4px_hsl(var(--accent)/0.4)]'
                                : 'border-border/20 shadow-card'
                            }`}
                          >
                            {/* Image or gradient header */}
                            <div className="relative h-[180px] overflow-hidden">
                              {r.image_url ? (
                                <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${gradient}`}>
                                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-background/10 border border-background/20" />
                                  <div className="absolute bottom-12 left-4 w-8 h-8 rounded-full bg-background/10 border border-background/20" />
                                </div>
                              )}
                              {/* Bottom fade */}
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                              {/* Badges on image */}
                              <div className="absolute top-3 right-3 flex items-center gap-2">
                                {readyToRedeem && (
                                  <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">✨ Ready!</span>
                                )}
                                <span className="text-[9px] uppercase tracking-wider font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90">{r.reward_type}</span>
                              </div>
                              <div className="absolute top-3 left-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm ${readyToRedeem ? 'bg-accent/30' : 'bg-black/30'}`}>
                                  <IconComp size={18} className="text-white" />
                                </div>
                              </div>
                            </div>

                            {/* Content on solid background */}
                            <div className="bg-card p-4 space-y-2">
                              <p className="font-bold text-base text-foreground leading-tight">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Store size={10} /> {r.store_name}</p>
                              {r.description && <p className="text-[10px] text-muted-foreground/80 line-clamp-2">{r.description}</p>}
                              <div className="pt-1">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-muted-foreground">{pointsForThisMerchant}/{r.points_required} pts</span>
                                  {readyToRedeem && <span className="text-accent font-bold">✨ Ready!</span>}
                                  {almostThere && <span className="text-secondary font-semibold">Almost there!</span>}
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                              {readyToRedeem ? (
                                <Button variant="hero" size="sm" className="w-full gap-1.5 text-xs mt-1">
                                  <Ticket size={12} /> Claim Reward
                                </Button>
                              ) : (
                                <p className="text-[10px] text-center text-muted-foreground mt-1">
                                  {r.points_required - pointsForThisMerchant} pts to go
                                </p>
                              )}
                              {r.is_limited_time && r.expires_at && (
                                <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5"><Clock size={8} /> Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
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
                    {Array.from({ length: rewardsCount }).map((_, i) => (
                      <button key={i} onClick={() => rewardsApi?.scrollTo(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === rewardsSlide ? 'bg-accent w-5' : 'bg-border w-2'}`} aria-label={`Go to reward ${i + 1}`} />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-center text-muted-foreground">Swipe to see more rewards →</p>
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

        {/* Redemption History — Collapsible */}
        {filteredRedemptions.length > 0 && (
          <ScrollReveal delay={175}>
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
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
                              {isVerified && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Used</span>}
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
                </CollapsibleContent>
              </Collapsible>
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

      {/* Store Reward Details Dialog */}
      <Dialog open={showStoreDetails} onOpenChange={setShowStoreDetails}>
        <DialogContent className="max-w-md">
          {selectedMerchant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Store size={18} className="text-secondary" /> {selectedMerchant.store_name}
                </DialogTitle>
                <DialogDescription>
                  Store-specific rewards, offers, and activity tailored to this merchant.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Current balance</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{selectedMerchant.points_balance} pts</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{filteredRewards.length} rewards</p>
                      <p>{filteredOffers.length} offers</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Rewards at this store</h4>
                  {filteredRewards.length > 0 ? (
                    filteredRewards.slice(0, 4).map((reward) => {
                      const isReady = reward.points_required <= selectedMerchant.points_balance;

                      return (
                        <button
                          key={reward.id}
                          onClick={() => {
                            setShowStoreDetails(false);
                            setSelectedReward(reward);
                          }}
                          className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{reward.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {reward.description || `${reward.points_required} points required to redeem.`}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold text-foreground">{reward.points_required} pts</p>
                              <p className={`text-[10px] font-semibold ${isReady ? "text-accent-foreground" : "text-muted-foreground"}`}>
                                {isReady ? "Ready now" : `${Math.max(reward.points_required - selectedMerchant.points_balance, 0)} to go`}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/50 bg-background/70 px-4 py-5 text-center">
                      <Gift size={18} className="mx-auto text-accent" />
                      <p className="mt-2 text-sm font-semibold text-foreground">No active rewards yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">This merchant hasn’t published rewards yet, but your points and visits are still being tracked.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-10 justify-start" onClick={handleViewOffers}>
                    <CalendarDays size={14} /> View offers
                  </Button>
                  <Button variant="hero" size="sm" className="h-10 justify-start" onClick={handleQuickRedeem}>
                    <Ticket size={14} /> Redeem reward
                  </Button>
                </div>
              </div>
            </>
          )}
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

    {/* Campaign Detail Dialog */}
    <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {selectedCampaign && (() => {
          const cm = customerMerchants.find(c => c.merchant_id === selectedCampaign.merchant_id);
          return (
            <>
              <div className="relative h-44 bg-gradient-to-br from-primary via-primary/90 to-secondary">
                {selectedCampaign.image_url ? (
                  <>
                    <img src={selectedCampaign.image_url} alt={selectedCampaign.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Megaphone size={56} className="text-primary-foreground/40" />
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[10px] uppercase tracking-wider text-primary-foreground/80 bg-black/30 backdrop-blur px-2 py-0.5 rounded-full">Campaign</span>
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
                {cm?.address && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                    <MapPin size={14} className="shrink-0 mt-0.5" />
                    <span>{cm.address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedCampaign(null)}>Close</Button>
                  {cm && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        handleMerchantSelection(selectedCampaign.merchant_id);
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

    {/* Delete Account (with friction) */}
    <DeleteAccountDialog
      open={showDeleteAccountDialog}
      onOpenChange={setShowDeleteAccountDialog}
      accountType="customer"
    />

    </>
  );
};

export default AccessCard;
