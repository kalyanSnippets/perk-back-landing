import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import {
  Star, Hash, User, CreditCard,
  ArrowRight, Shield, Copy, Share2, CheckCircle,
  XCircle, Store, MapPin, LogOut, Megaphone,
  ChevronRight, Info, CalendarDays, PencilLine,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { getIndustryImage } from "@/lib/industryImages";
import MyStoreCard from "@/components/customer/MyStoreCard";
import StoreDetailView from "@/components/customer/StoreDetailView";
import StoreRewardActionDialog from "@/components/customer/StoreRewardActionDialog";
import LoyaltyCardFlip from "@/components/customer/LoyaltyCardFlip";
import MerchantCardWallet from "@/components/customer/MerchantCardWallet";
import { getRewardTypeLabel } from "@/lib/rewardFormatting";
import { linkCustomerToMerchant } from "@/lib/customerMerchantJoin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CustomerData { id: string; full_name: string | null; crn: string | null; loyalty_card_number: string | null; card_issued_at: string | null; date_of_birth?: string | null; points_balance: number; }
interface CustomerMerchantData { merchant_id: string; store_name: string; points_balance: number; total_spend: number; visit_count: number; last_visit_at: string | null; logo_url?: string | null; industry_type?: string | null; address?: string | null; }
interface MerchantDirectoryData { merchant_id: string; store_name: string; logo_url: string | null; industry_type: string | null; address: string | null; latitude: number | null; longitude: number | null; profile_image_url: string | null; }
interface TransactionData { id: string; merchant_name: string; merchant_id: string | null; purchase_amount: number; points_awarded: number; transaction_date: string; }
interface RewardData { id: string; title: string; description: string | null; points_required: number; reward_type: string; is_limited_time: boolean; expires_at: string | null; merchant_id: string; store_name?: string; image_url?: string | null; }
interface CampaignData { id: string; title: string; description: string | null; ai_generated: boolean | null; image_url: string | null; target_segment: string | null; merchant_id: string; store_name?: string; }
interface MonthlyOfferData { id: string; title: string; description: string | null; valid_from: string | null; valid_to: string | null; merchant_id: string; store_name?: string; }
interface RedemptionData { id: string; reward_id: string; reward_title: string; redemption_code: string; points_spent: number; status: string; redeemed_at: string | null; expires_at: string; }
interface MerchantCardData extends CustomerMerchantData { rewardCount: number; offerCount: number; bannerImage: string; latitude?: number | null; longitude?: number | null; isJoined?: boolean; }
type MainTab = "my-rewards" | "my-card" | "explore" | "profile";
type StoreViewSource = "my-rewards" | "explore";

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; };
const getDirectionsUrl = (address?: string | null) => address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : null;
const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  date_of_birth: z.date().nullable().refine((value) => !value || value <= new Date(), "Date of birth cannot be in the future"),
});
const formatProfileDate = (value?: string | null) => {
  if (!value) return "Add";
  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? "Add"
    : parsedDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
};

const AccessCard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [customerMerchants, setCustomerMerchants] = useState<CustomerMerchantData[]>([]);
  const [merchantDirectory, setMerchantDirectory] = useState<MerchantDirectoryData[]>([]);
  const [activeStoreViewMerchantId, setActiveStoreViewMerchantId] = useState<string | null>(null);
  const [activeStoreViewSource, setActiveStoreViewSource] = useState<StoreViewSource>("my-rewards");
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
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(() => searchParams.get("tab") === "profile" ? "profile" : "my-rewards");
  const [gamificationByMerchant, setGamificationByMerchant] = useState<Record<string, { stamp: boolean; streak: boolean; levels: boolean }>>({});
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [joiningMerchantId, setJoiningMerchantId] = useState<string | null>(null);
  const [joinedMerchantOverrides, setJoinedMerchantOverrides] = useState<Record<string, true>>({});
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profileDateOfBirth, setProfileDateOfBirth] = useState<Date | undefined>(undefined);
  const [profileErrors, setProfileErrors] = useState<{ full_name?: string; date_of_birth?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const trackStoreSwitcherEvent = useCallback((eventName: string, merchantName?: string | null, merchantId?: string | null, source?: StoreViewSource) => {
    if (typeof window === "undefined") return;

    const detail = {
      event: eventName,
      merchantId: merchantId ?? null,
      merchantName: merchantName ?? null,
      source: source ?? "customer_store_switcher",
      timestamp: new Date().toISOString(),
    };

    window.dispatchEvent(new CustomEvent("perkback:analytics", { detail }));

    if ("dataLayer" in window && Array.isArray((window as Window & { dataLayer?: unknown[] }).dataLayer)) {
      (window as Window & { dataLayer: unknown[] }).dataLayer.push(detail);
    }
  }, []);

  const openStoreView = useCallback((merchantId: string, source: StoreViewSource) => {
    const merchant = merchantDirectory.find((item) => item.merchant_id === merchantId)
      ?? customerMerchants.find((item) => item.merchant_id === merchantId)
      ?? null;

    setActiveStoreViewMerchantId(merchantId);
    setActiveStoreViewSource(source);
    setActiveMainTab(source);
    window.scrollTo({ top: 0, behavior: "auto" });
    trackStoreSwitcherEvent("customer_store_selected", merchant?.store_name, merchantId, source);
  }, [customerMerchants, merchantDirectory, trackStoreSwitcherEvent]);

  const closeStoreView = useCallback(() => {
    const merchant = merchantDirectory.find((item) => item.merchant_id === activeStoreViewMerchantId)
      ?? customerMerchants.find((item) => item.merchant_id === activeStoreViewMerchantId)
      ?? null;

    setActiveStoreViewMerchantId(null);
    setActiveMainTab(activeStoreViewSource);
    window.scrollTo({ top: 0, behavior: "auto" });
    trackStoreSwitcherEvent("customer_store_cleared", merchant?.store_name, merchant?.merchant_id, activeStoreViewSource);
  }, [activeStoreViewMerchantId, activeStoreViewSource, customerMerchants, merchantDirectory, trackStoreSwitcherEvent]);

  const handleMainTabChange = useCallback((tab: MainTab) => {
    setActiveMainTab(tab);
    if (tab === "my-card" || tab === "profile") {
      setActiveStoreViewMerchantId(null);
      return;
    }
    if (tab !== activeStoreViewSource) {
      setActiveStoreViewMerchantId(null);
    }
  }, [activeStoreViewSource]);

  const fetchOffersData = useCallback(async () => {
    const merchantMap = new Map(merchantDirectory.map((merchant) => [merchant.merchant_id, merchant.store_name]));
    const [rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
    ]);
    setRewards((rewardsRes.data || []).map((reward) => ({ ...reward, store_name: merchantMap.get(reward.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map((campaign) => ({ ...campaign, store_name: merchantMap.get(campaign.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map((offer) => ({ ...offer, store_name: merchantMap.get(offer.merchant_id) || "Store" })));
  }, [merchantDirectory]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (searchParams.get("tab") === "profile") {
      setActiveMainTab("profile");
      setActiveStoreViewMerchantId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!customer) return;
    setProfileFullName(customer.full_name || "");
    setProfileDateOfBirth(customer.date_of_birth ? new Date(`${customer.date_of_birth}T00:00:00`) : undefined);
    setProfileErrors({});
  }, [customer]);

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
  }, [customer?.id, customer, fetchOffersData]);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/get-started"); return; }
    setUserEmail(authUser.email ?? null);
    const { data: customerData, error } = await supabase.from("customers").select("*").eq("user_id", authUser.id).maybeSingle();
    if (error || !customerData) { navigate("/get-started"); return; }
    if (!customerData.loyalty_card_number) { navigate("/customer/confirmation"); return; }
    setCustomer(customerData);

    const [cmRes, txRes, merchantsRes, rewardsRes, campaignsRes, offersRes, redemptionsRes] = await Promise.all([
      supabase
        .from("customer_merchants")
        .select("merchant_id, points_balance, total_spend, visit_count, last_visit_at")
        .eq("customer_id", customerData.id),
      supabase.from("transactions").select("*").eq("customer_id", customerData.id).order("transaction_date", { ascending: false }),
      supabase.from("merchants_public" as any).select("id, store_name, logo_url, industry_type, address, latitude, longitude, profile_image_url"),
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
      supabase.from("redemptions").select("id, reward_id, reward_title, redemption_code, points_spent, status, redeemed_at, expires_at").eq("customer_id", customerData.id).order("created_at", { ascending: false }),
    ]);

    setTransactions(txRes.data || []);

    const merchantRows = (merchantsRes.data as any[]) || [];
    const merchantDirectoryData: MerchantDirectoryData[] = merchantRows.map((merchant) => ({
      merchant_id: merchant.id,
      store_name: merchant.store_name,
      logo_url: merchant.logo_url,
      industry_type: merchant.industry_type,
      address: merchant.address,
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      profile_image_url: merchant.profile_image_url,
    }));
    setMerchantDirectory(merchantDirectoryData);

    const merchantMap = new Map(merchantDirectoryData.map((merchant) => [merchant.merchant_id, merchant.store_name]));
    const merchantDataMap = new Map(merchantDirectoryData.map((merchant) => [merchant.merchant_id, merchant]));

    const cmList: CustomerMerchantData[] = (cmRes.data || []).map((merchant) => {
      const merchantRecord = merchantDataMap.get(merchant.merchant_id);
      return {
        merchant_id: merchant.merchant_id,
        store_name: merchantRecord?.store_name || "Store",
        points_balance: merchant.points_balance,
        total_spend: Number(merchant.total_spend),
        visit_count: merchant.visit_count,
        last_visit_at: merchant.last_visit_at,
        logo_url: merchantRecord?.logo_url,
        industry_type: merchantRecord?.industry_type,
        address: merchantRecord?.address,
      };
    });
    setCustomerMerchants(cmList);

    setRewards((rewardsRes.data || []).map((reward) => ({ ...reward, store_name: merchantMap.get(reward.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map((campaign) => ({ ...campaign, store_name: merchantMap.get(campaign.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map((offer) => ({ ...offer, store_name: merchantMap.get(offer.merchant_id) || "Store" })));
    setRedemptions((redemptionsRes.data as RedemptionData[] | null) || []);

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
    } else {
      setGamificationByMerchant({});
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

  const handleOpenProfileDialog = () => {
    setProfileFullName(customer?.full_name || "");
    setProfileDateOfBirth(customer?.date_of_birth ? new Date(`${customer.date_of_birth}T00:00:00`) : undefined);
    setProfileErrors({});
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!customer) return;

    const validation = profileUpdateSchema.safeParse({
      full_name: profileFullName,
      date_of_birth: profileDateOfBirth ?? null,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setProfileErrors({
        full_name: fieldErrors.full_name?.[0],
        date_of_birth: fieldErrors.date_of_birth?.[0],
      });
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from("customers")
      .update({
        full_name: validation.data.full_name,
        date_of_birth: validation.data.date_of_birth ? format(validation.data.date_of_birth, "yyyy-MM-dd") : null,
      })
      .eq("id", customer.id);

    setSavingProfile(false);

    if (error) {
      toast.error(error.message || "Unable to update profile");
      return;
    }

    setCustomer((current) => current ? {
      ...current,
      full_name: validation.data.full_name,
      date_of_birth: validation.data.date_of_birth ? format(validation.data.date_of_birth, "yyyy-MM-dd") : null,
    } : current);
    setProfileDialogOpen(false);
    toast.success("Profile updated");
  };

  const handleJoinStore = async (merchantId: string) => {
    setJoiningMerchantId(merchantId);
    try {
      const joinResult = await linkCustomerToMerchant({ merchantId, source: "explore" });
      if (!joinResult.success) {
        toast.error(joinResult.error);
        return;
      }

      const merchantName = joinResult.data?.merchant_name
        ?? merchantDirectory.find((merchant) => merchant.merchant_id === merchantId)?.store_name
        ?? "store";

      setJoinedMerchantOverrides((current) => ({ ...current, [merchantId]: true }));
      toast.success(`You joined ${merchantName}`);
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unable to join store");
    } finally {
      setJoiningMerchantId(null);
    }
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary animate-pulse">
          <Star className="text-primary-foreground" size={24} />
        </div>
        <p className="text-sm text-muted-foreground">Loading your rewards...</p>
      </div>
    );
  }

  if (!customer) return null;

  const rewardCountByMerchant = new Map<string, number>();
  rewards.forEach((reward) => rewardCountByMerchant.set(reward.merchant_id, (rewardCountByMerchant.get(reward.merchant_id) || 0) + 1));

  const offerCountByMerchant = new Map<string, number>();
  monthlyOffers.forEach((offer) => offerCountByMerchant.set(offer.merchant_id, (offerCountByMerchant.get(offer.merchant_id) || 0) + 1));

  const joinedMerchantMap = new Map(customerMerchants.map((merchant) => [merchant.merchant_id, merchant]));

  const allMerchantCards: MerchantCardData[] = merchantDirectory
    .map((merchant) => {
      const joinedMerchant = joinedMerchantMap.get(merchant.merchant_id);
      const merchantCampaignImage = campaigns.find((campaign) => campaign.merchant_id === merchant.merchant_id && campaign.image_url)?.image_url;
      const merchantRewardImage = rewards.find((reward) => reward.merchant_id === merchant.merchant_id && reward.image_url)?.image_url;
      return {
        merchant_id: merchant.merchant_id,
        store_name: merchant.store_name,
        industry_type: merchant.industry_type,
        logo_url: merchant.logo_url,
        address: merchant.address,
        points_balance: joinedMerchant?.points_balance ?? 0,
        total_spend: joinedMerchant?.total_spend ?? 0,
        visit_count: joinedMerchant?.visit_count ?? 0,
        last_visit_at: joinedMerchant?.last_visit_at ?? null,
        rewardCount: rewardCountByMerchant.get(merchant.merchant_id) || 0,
        offerCount: offerCountByMerchant.get(merchant.merchant_id) || 0,
        bannerImage: merchant.profile_image_url ?? merchantCampaignImage ?? merchantRewardImage ?? getIndustryImage(merchant.industry_type),
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        isJoined: !!joinedMerchant || !!joinedMerchantOverrides[merchant.merchant_id],
      };
    })
    .sort((a, b) => Number(b.isJoined) - Number(a.isJoined) || b.rewardCount - a.rewardCount || a.store_name.localeCompare(b.store_name));

  const merchantCards = allMerchantCards.filter((merchant) => merchant.isJoined).sort((a, b) => b.points_balance - a.points_balance);

  const activeStoreCard = activeStoreViewMerchantId
    ? allMerchantCards.find((merchant) => merchant.merchant_id === activeStoreViewMerchantId) ?? null
    : null;

  const storeRewards = activeStoreViewMerchantId ? rewards.filter((reward) => reward.merchant_id === activeStoreViewMerchantId) : [];
  const storeCampaigns = activeStoreViewMerchantId ? campaigns.filter((campaign) => campaign.merchant_id === activeStoreViewMerchantId) : [];
  const storeOffers = activeStoreViewMerchantId ? monthlyOffers.filter((offer) => offer.merchant_id === activeStoreViewMerchantId) : [];
  const storeTransactions = activeStoreViewMerchantId ? transactions.filter((transaction) => transaction.merchant_id === activeStoreViewMerchantId) : [];

  const dashboardSectionShell = "rounded-[28px] border border-border/35 bg-card/90 shadow-card backdrop-blur-sm";
  const issuedDate = customer.card_issued_at ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const memberSinceLabel = customer.card_issued_at
    ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })
    : "Recently";
  const customerInitials = (customer.full_name || "PerkBack Member")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const totalVisits = customerMerchants.reduce((sum, merchant) => sum + merchant.visit_count, 0);
  const displayPoints = customer.points_balance;
  const hasLoyaltyCardNumber = Boolean(customer.loyalty_card_number);
  const profileInfoSections = [
    {
      title: "Profile",
      items: [
        {
          label: "Name & Date of Birth",
          value: customer.date_of_birth ? formatProfileDate(customer.date_of_birth) : "Add",
          subvalue: customer.full_name || "Add your name",
          icon: CalendarDays,
          action: handleOpenProfileDialog,
        },
      ],
    },
    {
      title: "Pages",
      items: [
        { label: "About Us", value: "Open", icon: Info, href: "/about?web=1" },
        { label: "Pricing", value: "Open", icon: Info, href: "/pricing?web=1" },
        { label: "Testimonials", value: "Open", icon: Info, href: "/testimonials?web=1" },
        { label: "Reviews", value: "Open", icon: Info, href: "/reviews?web=1" },
        { label: "Blog", value: "Open", icon: Info, href: "/blog?web=1" },
        { label: "Contact", value: "Open", icon: Info, href: "/contact?web=1" },
        { label: "Privacy", value: "Open", icon: Info, href: "/privacy?web=1" },
      ],
    },
  ];

  const rewardMerchant = selectedReward
    ? allMerchantCards.find((merchant) => merchant.merchant_id === selectedReward.merchant_id) ?? null
    : null;
  const selectedRewardRedemption = selectedReward
    ? redemptions.find((redemption) => redemption.reward_id === selectedReward.id) ?? null
    : null;
  const rewardDirectionsUrl = getDirectionsUrl(rewardMerchant?.address);

  const rewardCards = rewards
    .map((reward) => {
      const merchant = allMerchantCards.find((item) => item.merchant_id === reward.merchant_id);
      const pointsBalance = merchant?.points_balance ?? 0;
      const remainingPoints = Math.max(reward.points_required - pointsBalance, 0);
      return {
        ...reward,
        bannerImage: reward.image_url ?? merchant?.bannerImage ?? getIndustryImage(merchant?.industry_type),
        merchant,
        pointsBalance,
        remainingPoints,
        readyToRedeem: pointsBalance >= reward.points_required,
        progress: reward.points_required > 0 ? Math.min((pointsBalance / reward.points_required) * 100, 100) : 0,
      };
    })
    .sort((a, b) => Number(b.readyToRedeem) - Number(a.readyToRedeem) || a.remainingPoints - b.remainingPoints || Number(b.merchant?.isJoined) - Number(a.merchant?.isJoined));

  const shouldShowStoreDetail = !!activeStoreCard && (activeMainTab === "my-rewards" || activeMainTab === "explore");

  return (
    <>
      <div className="min-h-screen bg-muted/20 pb-24 sm:pb-0">
        {!isMobile && <Header />}
        <div className="fixed inset-0 -z-10">
          <div className="absolute left-0 right-0 top-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
          <div className="absolute right-0 top-20 h-[300px] w-[300px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto max-w-lg space-y-4 px-4 pb-20 pt-6 sm:space-y-5 sm:pt-24">
          <ScrollReveal>
            <div className="text-center">
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {getGreeting()}, {customer.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
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
                  onClick={() => handleMainTabChange(tab.key)}
                  className={`min-w-0 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all duration-300 sm:text-xs ${
                    activeMainTab === tab.key
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-button"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeMainTab === "profile" ? (
            <>
              <ScrollReveal>
                <div className="overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-card">
                  <div className="border-b border-primary-foreground/15 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background/15 text-lg font-bold">
                        {customerInitials || "PB"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-bold">{customer.full_name || "PerkBack Member"}</p>
                        <p className="mt-1 text-sm text-primary-foreground/80">Member since {memberSinceLabel} · CRN {customer.crn || "—"}</p>
                        <p className="mt-3 text-xs text-primary-foreground/78">Card number {customer.loyalty_card_number || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-5">
                    {[
                      { label: "Points", value: displayPoints.toLocaleString("en-AU") },
                      { label: "Cards", value: String(customerMerchants.length) },
                      { label: "Visits", value: String(totalVisits) },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <p className="text-2xl font-bold leading-none">{item.value}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/72">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={40}>
                <div className="space-y-5">
                  {profileInfoSections.map((section) => (
                    <section key={section.title} className="space-y-2.5">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{section.title}</p>
                      <div className="overflow-hidden rounded-[22px] border border-border/50 bg-card shadow-card">
                        {section.items.map((item, index) => (
                          item.href ? (
                            <Link key={item.label} to={item.href} className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 ${index !== section.items.length - 1 ? "border-b border-border/40" : ""}`}>
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-primary">
                                <item.icon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                {item.subvalue && <p className="truncate text-xs text-muted-foreground">{item.subvalue}</p>}
                              </div>
                              <div className="flex items-center gap-2 pl-2">
                                <span className="text-sm text-muted-foreground">{item.value}</span>
                                <ChevronRight size={16} className="text-muted-foreground/80" />
                              </div>
                            </Link>
                          ) : item.action ? (
                            <button
                              key={item.label}
                              type="button"
                              onClick={item.action}
                              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 ${index !== section.items.length - 1 ? "border-b border-border/40" : ""}`}
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-primary">
                                <item.icon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                {item.subvalue && <p className="truncate text-xs text-muted-foreground">{item.subvalue}</p>}
                              </div>
                              <div className="flex items-center gap-2 pl-2">
                                <span className="text-sm text-muted-foreground">{item.value}</span>
                                <ChevronRight size={16} className="text-muted-foreground/80" />
                              </div>
                            </button>
                          ) : (
                            <div
                              key={item.label}
                              className={`flex items-center gap-3 px-4 py-4 ${index !== section.items.length - 1 ? "border-b border-border/40" : ""}`}
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-primary">
                                <item.icon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                {item.subvalue && <p className="truncate text-xs text-muted-foreground">{item.subvalue}</p>}
                              </div>
                              <span className="pl-2 text-sm text-muted-foreground">{item.value}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </section>
                  ))}

                  <section className="space-y-3 pt-2">
                    {isMerchant && (
                      <Button variant="outline" className="h-12 w-full justify-between rounded-2xl border-border/50 bg-card px-4" asChild>
                        <Link to="/merchant/dashboard">
                          <span className="flex items-center gap-2"><Store size={16} /> Merchant Dashboard</span>
                          <ChevronRight size={16} />
                        </Link>
                      </Button>
                    )}
                    <Button className="h-12 w-full justify-between rounded-2xl px-4" onClick={handleLogout}>
                      <span className="flex items-center gap-2"><LogOut size={16} /> Log out</span>
                      <ChevronRight size={16} />
                    </Button>
                    <Button variant="ghost" className="h-12 w-full justify-between rounded-2xl border border-destructive/20 bg-card px-4 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => setShowDeleteAccountDialog(true)}>
                      <span className="flex items-center gap-2"><XCircle size={16} /> Delete my account</span>
                      <ChevronRight size={16} />
                    </Button>
                  </section>
                </div>
              </ScrollReveal>
            </>
          ) : activeMainTab === "my-card" ? (
            <>
              <ScrollReveal>
                <MerchantCardWallet
                  customerId={customer.id}
                  fullName={customer.full_name}
                  loyaltyCardNumber={customer.loyalty_card_number}
                  merchants={customerMerchants.map((m) => ({
                    merchant_id: m.merchant_id,
                    store_name: m.store_name,
                    logo_url: m.logo_url,
                    points_balance: m.points_balance,
                  }))}
                />
              </ScrollReveal>

              <ScrollReveal delay={50}>
                <div className="space-y-3 rounded-[22px] border border-border/40 bg-muted/20 p-3 shadow-card">
                  {!hasLoyaltyCardNumber && (
                    <p className="text-xs text-muted-foreground">Your scan code is still syncing. It should appear on the back of the card shortly.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9 flex-1 gap-1.5 border-border/50 bg-card text-xs" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")} disabled={!hasLoyaltyCardNumber}>
                      <Copy size={13} /> Copy card number
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 flex-1 gap-1.5 border-border/50 bg-card text-xs" onClick={handleShare} disabled={!hasLoyaltyCardNumber}>
                      <Share2 size={13} /> Share
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(deviceType === "ios" || deviceType === "desktop") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 flex-1 gap-1.5 border-border/50 bg-card text-xs"
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
                        className="h-10 flex-1 gap-1.5 border-border/50 bg-card text-xs"
                        onClick={handleAddToGoogleWallet}
                        disabled={walletLoading === "google"}
                      >
                        📱 {walletLoading === "google" ? "Adding..." : "Add to Google Wallet"}
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={75}>
                <div className="rounded-[20px] border border-border/40 bg-card px-4 py-3 shadow-card">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Wallet ready</p>
                  <p className="mt-1 text-sm text-foreground">Your live loyalty card is ready for checkout and wallet save.</p>
                </div>
              </ScrollReveal>
            </>
          ) : shouldShowStoreDetail ? (
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
              isJoined={!!activeStoreCard.isJoined}
              isJoining={joiningMerchantId === activeStoreCard.merchant_id}
              backLabel={activeStoreViewSource === "explore" ? "Back to Explore" : "Back to Rewards"}
              onBack={closeStoreView}
              onJoinStore={handleJoinStore}
              onRewardSelect={setSelectedReward}
              onCampaignSelect={(campaign) => setSelectedCampaign(campaign)}
            />
          ) : activeMainTab === "explore" ? (
            <ExploreTab
              merchants={allMerchantCards}
              onOpenMerchant={(merchantId) => openStoreView(merchantId, "explore")}
            />
          ) : (
            <div className="space-y-4">

              {merchantCards.length > 0 && (
                <ScrollReveal delay={15}>
                  <div className={`${dashboardSectionShell} space-y-4 p-5 sm:p-6`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Store size={16} className="text-secondary" /> My Stores
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tap a store to open its full page with rewards, offers, visits, and directions.
                        </p>
                      </div>
                      <span className="rounded-full bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                        {merchantCards.length} joined
                      </span>
                    </div>

                    <div className="-mx-1 overflow-x-auto px-1 pb-1">
                      <div className="flex min-w-max gap-4">
                        {merchantCards.map((merchant) => (
                          <MyStoreCard key={merchant.merchant_id} merchant={merchant} onSelect={(merchantId) => openStoreView(merchantId, "my-rewards")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )}

              <ScrollReveal delay={30}>
                <section className={`${dashboardSectionShell} p-5 sm:p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Star size={16} className="text-accent" /> All Rewards
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ready rewards appear first, followed by the closest rewards to unlock.
                      </p>
                    </div>
                    <span className="rounded-full bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                      {rewardCards.length} live
                    </span>
                  </div>

                  {rewardCards.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-border/50 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                      Rewards will appear here as merchants publish them.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {rewardCards.map((reward) => (
                        <button
                          key={reward.id}
                          type="button"
                          onClick={() => setSelectedReward(reward)}
                          className="w-full overflow-hidden rounded-[24px] border border-border/30 bg-card text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img src={reward.bannerImage} alt={reward.title} className="h-full w-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
                            {reward.readyToRedeem && (
                              <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">
                                Ready
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-primary-foreground/72">{reward.store_name}</p>
                              <h4 className="mt-1 text-lg font-bold leading-tight">{reward.title}</h4>
                            </div>
                          </div>
                          <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                {reward.description && <p className="line-clamp-2 text-xs text-muted-foreground">{reward.description}</p>}
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                   <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{getRewardTypeLabel(reward.reward_type)}</span>
                                  {reward.merchant?.isJoined ? (
                                    <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent-foreground">Joined store</span>
                                  ) : (
                                    <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">Discover store</span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 rounded-full bg-muted/50 px-3 py-1 text-[11px] font-semibold text-foreground">
                                {reward.points_required} pts
                              </div>
                            </div>

                            <div>
                              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">{reward.pointsBalance}/{reward.points_required} pts</span>
                                <span className="font-semibold text-foreground">
                                  {reward.readyToRedeem ? "Redeem now" : `${reward.remainingPoints} to go`}
                                </span>
                              </div>
                              <Progress value={reward.progress} className="h-2" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </ScrollReveal>

              {isAdmin && (
                <ScrollReveal>
                  <Link to="/admin" className="block">
                    <div className="flex items-center justify-between rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 to-primary/10 p-5 transition-colors hover:border-accent/40 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20"><Shield size={20} className="text-accent" /></div>
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
          redemption={selectedRewardRedemption}
          directionsUrl={rewardDirectionsUrl}
          address={rewardMerchant?.address}
          redeeming={redeeming === selectedReward?.id}
          onRedeem={handleRedeem}
        />

        {showRedemptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm" onClick={() => setShowRedemptionModal(null)}>
            <div className="w-full max-w-sm animate-fade-up rounded-2xl bg-card p-6 text-center shadow-card-hover" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
                <CheckCircle size={32} className="text-accent" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-foreground">Reward Redeemed! 🎉</h2>
              <p className="mb-4 text-sm text-muted-foreground">{showRedemptionModal.title}</p>
              <div className="mb-4 rounded-xl border border-border/50 bg-muted/30 p-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Your Redemption Code</p>
                <p className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground">{showRedemptionModal.code}</p>
                <p className="mt-2 text-xs text-muted-foreground">Show this code to the merchant</p>
              </div>
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
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
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          {selectedCampaign && (() => {
            const merchant = allMerchantCards.find((item) => item.merchant_id === selectedCampaign.merchant_id);
            return (
              <>
                <div className="relative h-44 bg-gradient-to-br from-primary via-primary/90 to-secondary">
                  {selectedCampaign.image_url ? (
                    <>
                      <img src={selectedCampaign.image_url} alt={selectedCampaign.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Megaphone size={56} className="text-primary-foreground/40" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="rounded-full bg-foreground/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground/80 backdrop-blur">Campaign</span>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <DialogHeader className="space-y-1.5 text-left">
                    <DialogTitle className="text-xl">{selectedCampaign.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1.5 text-xs">
                      <Store size={12} /> {selectedCampaign.store_name}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedCampaign.description && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{selectedCampaign.description}</p>
                  )}
                  {merchant?.address && (
                    <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
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
                          openStoreView(selectedCampaign.merchant_id, activeMainTab === "explore" ? "explore" : "my-rewards");
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

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your name and date of birth.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={profileFullName}
                onChange={(event) => {
                  setProfileFullName(event.target.value);
                  setProfileErrors((current) => ({ ...current, full_name: undefined }));
                }}
                placeholder="Your full name"
              />
              {profileErrors.full_name && <p className="text-xs text-destructive">{profileErrors.full_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-2xl border-border/50 bg-card text-left font-normal">
                    <span>{profileDateOfBirth ? format(profileDateOfBirth, "PPP") : "Pick a date"}</span>
                    <PencilLine size={16} className="text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={profileDateOfBirth}
                    onSelect={(date) => {
                      setProfileDateOfBirth(date);
                      setProfileErrors((current) => ({ ...current, date_of_birth: undefined }));
                    }}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {profileErrors.date_of_birth && <p className="text-xs text-destructive">{profileErrors.date_of_birth}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setProfileDialogOpen(false)} disabled={savingProfile}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
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
