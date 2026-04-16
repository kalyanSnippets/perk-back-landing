import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Store, Gift, Megaphone, CalendarDays, MapPin, Sparkles, Clock, TrendingUp, Loader2, CheckCircle, Copy,
} from "lucide-react";
import { useUserLocation, haversineDistance, formatDistance } from "@/lib/geo";
import IndustryFilter from "./IndustryFilter";
import NearbyMerchants from "./NearbyMerchants";
import MerchantPreview from "./MerchantPreview";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface MerchantRow {
  id: string;
  store_name: string;
  industry_type: string | null;
  logo_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}
interface RewardRow { id: string; title: string; description: string | null; points_required: number; reward_type: string; merchant_id: string; image_url: string | null; }
interface CampaignRow { id: string; title: string; description: string | null; image_url: string | null; merchant_id: string; }
interface OfferRow { id: string; title: string; description: string | null; valid_from: string | null; valid_to: string | null; merchant_id: string; }

interface ExploreTabProps {
  customerMerchantIds: string[];
}

const CAROUSEL_GRADIENTS = [
  "from-primary via-primary/90 to-secondary",
  "from-secondary via-secondary/90 to-primary",
  "from-accent/90 via-accent/80 to-primary/80",
];

const HOT_REWARD_COLORS = [
  { bg: "from-amber-500/15 to-orange-400/10", border: "border-amber-400/30", glow: "hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.3)]" },
  { bg: "from-emerald-500/15 to-teal-400/10", border: "border-emerald-400/30", glow: "hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]" },
  { bg: "from-violet-500/15 to-purple-400/10", border: "border-violet-400/30", glow: "hover:shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]" },
  { bg: "from-rose-500/15 to-pink-400/10", border: "border-rose-400/30", glow: "hover:shadow-[0_0_20px_-4px_rgba(244,63,94,0.3)]" },
  { bg: "from-cyan-500/15 to-sky-400/10", border: "border-cyan-400/30", glow: "hover:shadow-[0_0_20px_-4px_rgba(6,182,212,0.3)]" },
];

const INDUSTRY_COLORS: Record<string, { accent: string; badge: string }> = {
  "Coffee Shop": { accent: "from-amber-500 to-orange-400", badge: "bg-amber-100 text-amber-700" },
  "Retail": { accent: "from-blue-500 to-indigo-400", badge: "bg-blue-100 text-blue-700" },
  "Restaurant": { accent: "from-emerald-500 to-teal-400", badge: "bg-emerald-100 text-emerald-700" },
};

const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const ExploreTab = ({ customerMerchantIds }: ExploreTabProps) => {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [previewMerchantId, setPreviewMerchantId] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [hotApi, setHotApi] = useState<CarouselApi>();
  const [hotSlide, setHotSlide] = useState(0);
  const [hotCount, setHotCount] = useState(0);

  const userLocation = useUserLocation();

  useEffect(() => {
    fetchExploreData();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
    const interval = setInterval(() => carouselApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  useEffect(() => {
    if (!hotApi) return;
    setHotCount(hotApi.scrollSnapList().length);
    setHotSlide(hotApi.selectedScrollSnap());
    hotApi.on("select", () => setHotSlide(hotApi.selectedScrollSnap()));
    hotApi.on("reInit", () => {
      setHotCount(hotApi.scrollSnapList().length);
      setHotSlide(hotApi.selectedScrollSnap());
    });
  }, [hotApi]);

  // Proximity suggestion
  useEffect(() => {
    if (userLocation.loading || !userLocation.latitude || !userLocation.longitude) return;
    if (merchants.length === 0) return;

    const nearbyMerchant = merchants.find((m) => {
      if (!m.latitude || !m.longitude) return false;
      return haversineDistance(userLocation.latitude!, userLocation.longitude!, m.latitude, m.longitude) <= 0.5;
    });

    if (nearbyMerchant) {
      const merchantReward = rewards.find((r) => r.merchant_id === nearbyMerchant.id);
      const msg = merchantReward
        ? `You're near ${nearbyMerchant.store_name}! They have: ${merchantReward.title}`
        : `You're near ${nearbyMerchant.store_name}! Check out their deals.`;
      toast.info(msg, { duration: 6000 });
    }
  }, [userLocation.loading, merchants.length, rewards.length]);

  const fetchExploreData = async () => {
    const [merchantsRes, rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("merchants").select("id, store_name, industry_type, logo_url, address, latitude, longitude"),
      supabase.from("rewards").select("id, title, description, points_required, reward_type, merchant_id, image_url").eq("active", true),
      supabase.from("campaigns").select("id, title, description, image_url, merchant_id").eq("active", true),
      supabase.from("monthly_offers").select("id, title, description, valid_from, valid_to, merchant_id").eq("active", true),
    ]);
    setMerchants((merchantsRes.data as MerchantRow[]) || []);
    setRewards((rewardsRes.data as RewardRow[]) || []);
    setCampaigns((campaignsRes.data as CampaignRow[]) || []);
    setOffers((offersRes.data as OfferRow[]) || []);
    setLoading(false);
  };

  const merchantMap = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);

  const uniqueIndustries = useMemo(
    () => [...new Set(merchants.map(m => m.industry_type).filter(Boolean) as string[])].sort(),
    [merchants]
  );

  const filteredMerchants = useMemo(
    () => industryFilter ? merchants.filter((m) => m.industry_type === industryFilter) : merchants,
    [merchants, industryFilter]
  );

  const merchantRewardCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rewards.forEach((r) => counts.set(r.merchant_id, (counts.get(r.merchant_id) || 0) + 1));
    return counts;
  }, [rewards]);

  const previewMerchant = previewMerchantId ? merchantMap.get(previewMerchantId) || null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Loading deals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Near You */}
      {userLocation.latitude && userLocation.longitude && (
        <ScrollReveal>
          <NearbyMerchants
            merchants={filteredMerchants.map((m) => ({ ...m, reward_count: merchantRewardCounts.get(m.id) || 0 }))}
            userLat={userLocation.latitude}
            userLng={userLocation.longitude}
            onMerchantClick={setPreviewMerchantId}
          />
        </ScrollReveal>
      )}

      {/* Featured Campaigns */}
      {campaigns.length > 0 && (
        <ScrollReveal delay={15}>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Megaphone size={16} className="text-secondary" /> Featured Campaigns
            </h3>
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {campaigns.map((c, i) => {
                  const merchant = merchantMap.get(c.merchant_id);
                  return (
                    <CarouselItem key={c.id}>
                      <button
                        onClick={() => setPreviewMerchantId(c.merchant_id)}
                        className="w-full text-left relative rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-between"
                      >
                        {c.image_url ? (
                          <>
                            <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))` }} />
                        )}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/10" />
                        {merchant?.logo_url && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg overflow-hidden bg-background/30 backdrop-blur-sm border border-primary-foreground/20">
                            <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="relative z-10 p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Megaphone size={13} className="text-primary-foreground/70" />
                            <span className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">
                              {merchant?.store_name || "Store"}
                            </span>
                          </div>
                          <h4 className="text-primary-foreground font-bold text-lg leading-tight">{c.title}</h4>
                          {c.description && <p className="text-primary-foreground/70 text-xs mt-1 line-clamp-2">{c.description}</p>}
                          <span className="mt-3 inline-flex items-center gap-1 text-[10px] bg-primary-foreground/20 text-primary-foreground px-2.5 py-1 rounded-full font-semibold">
                            Learn More <TrendingUp size={9} />
                          </span>
                        </div>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              {slideCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button key={i} onClick={() => carouselApi?.scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-primary w-5" : "bg-border"}`} />
                  ))}
                </div>
              )}
            </Carousel>
          </div>
        </ScrollReveal>
      )}

      {/* Hot Rewards */}
      {rewards.length > 0 && (
        <ScrollReveal delay={30}>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Gift size={16} className="text-accent" /> Hot Rewards
            </h3>
            <Carousel setApi={setHotApi} opts={{ loop: false, align: "start" }} className="w-full">
              <CarouselContent>
                {rewards.slice(0, 10).map((r, idx) => {
                  const merchant = merchantMap.get(r.merchant_id);
                  const colorSet = HOT_REWARD_COLORS[idx % HOT_REWARD_COLORS.length];
                  return (
                    <CarouselItem key={r.id} className="basis-full">
                      <button
                        onClick={() => setPreviewMerchantId(r.merchant_id)}
                        className={`w-full rounded-2xl ${colorSet.border} border overflow-hidden text-left transition-all duration-300 ${colorSet.glow}`}
                      >
                        {/* Image or gradient header */}
                        <div className="relative h-[180px] overflow-hidden">
                          {r.image_url ? (
                            <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${colorSet.bg}`}>
                              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/10 border border-background/20" />
                            </div>
                          )}
                          {/* Merchant logo on image */}
                          {merchant?.logo_url && (
                            <div className="absolute top-3 right-3 w-10 h-10 rounded-xl overflow-hidden bg-background/30 backdrop-blur-sm border border-white/20">
                              <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {/* Bottom fade */}
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent" />
                        </div>

                        {/* Content on solid background */}
                        <div className={`p-4 bg-gradient-to-br ${colorSet.bg}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {merchant?.logo_url ? (
                              <img src={merchant.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-border/30" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Gift size={14} className="text-accent" />
                              </div>
                            )}
                            <span className="text-[10px] text-muted-foreground truncate flex-1 font-medium">{merchant?.store_name || "Store"}</span>
                          </div>
                          <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{r.title}</p>
                          {r.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                          <div className="flex items-center justify-between mt-2.5">
                            <span className="text-xs font-bold text-primary">{r.points_required} pts</span>
                            <span className="text-[10px] text-accent font-semibold">Earn & redeem →</span>
                          </div>
                        </div>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
            {hotCount > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: hotCount }).map((_, i) => (
                  <button key={i} onClick={() => hotApi?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === hotSlide ? 'bg-accent w-5' : 'bg-border w-2'}`} aria-label={`Go to reward ${i + 1}`} />
                ))}
              </div>
            )}
            <p className="text-[10px] text-center text-muted-foreground mt-2">Swipe to explore more →</p>
          </div>
        </ScrollReveal>
      )}

      {/* Monthly Offers */}
      {offers.length > 0 && (
        <ScrollReveal delay={45}>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" /> Monthly Offers
            </h3>
            <div className="space-y-2">
              {offers.slice(0, 6).map((o) => {
                const merchant = merchantMap.get(o.merchant_id);
                return (
                  <button
                    key={o.id}
                    onClick={() => setPreviewMerchantId(o.merchant_id)}
                    className="w-full text-left bg-card rounded-xl border border-border/30 p-3.5 hover:shadow-card transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <CalendarDays size={11} className="text-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{merchant?.store_name || "Store"}</span>
                      </div>
                      {o.valid_to && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock size={9} /> {daysUntil(o.valid_to)}d left
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground">{o.title}</p>
                    {o.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{o.description}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Browse Merchants */}
      <ScrollReveal delay={60}>
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Store size={16} className="text-secondary" /> Browse Merchants
          </h3>
          <IndustryFilter selected={industryFilter} onChange={setIndustryFilter} industries={uniqueIndustries} />
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-8">
              <Store size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No merchants found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredMerchants.map((m, idx) => {
                const rewardCount = merchantRewardCounts.get(m.id) || 0;
                const isMember = customerMerchantIds.includes(m.id);
                const dist = userLocation.latitude && userLocation.longitude && m.latitude && m.longitude
                  ? haversineDistance(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude)
                  : null;
                const colors = INDUSTRY_COLORS[m.industry_type || ""] || { accent: "from-secondary to-primary", badge: "bg-secondary/10 text-secondary" };
                const cardGradients = ["from-primary/5 to-secondary/5", "from-secondary/5 to-accent/5", "from-accent/5 to-primary/5", "from-amber-50 to-orange-50"];
                return (
                  <button
                    key={m.id}
                    onClick={() => setPreviewMerchantId(m.id)}
                    className={`rounded-2xl border border-border/30 bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                  >
                    {/* Accent strip */}
                    <div className={`h-1.5 bg-gradient-to-r ${colors.accent}`} />
                    <div className="p-3.5">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.accent} p-0.5 flex items-center justify-center overflow-hidden shrink-0`}>
                          <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                            {m.logo_url ? (
                              <img src={m.logo_url} alt={m.store_name} className="w-full h-full object-cover" />
                            ) : (
                              <Store size={18} className="text-secondary" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          {isMember && (
                            <span className="text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">MEMBER</span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-sm text-foreground truncate">{m.store_name}</p>
                      {m.industry_type && (
                        <span className={`text-[9px] font-semibold ${colors.badge} px-2 py-0.5 rounded-full inline-block mt-1`}>{m.industry_type}</span>
                      )}
                      {m.address && (
                        <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 mt-1.5 truncate">
                          <MapPin size={8} /> {m.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {rewardCount > 0 && (
                          <span className="text-[9px] text-accent font-semibold">{rewardCount} reward{rewardCount > 1 ? "s" : ""}</span>
                        )}
                        {dist !== null && (
                          <span className="text-[9px] text-primary flex items-center gap-0.5 font-medium">
                            <MapPin size={7} /> {formatDistance(dist)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Merchant Preview Dialog */}
      <MerchantPreview
        open={!!previewMerchantId}
        onOpenChange={(open) => !open && setPreviewMerchantId(null)}
        merchant={previewMerchant ? { ...previewMerchant } : null}
        rewards={rewards.filter((r) => r.merchant_id === previewMerchantId)}
        campaigns={campaigns.filter((c) => c.merchant_id === previewMerchantId)}
        offers={offers.filter((o) => o.merchant_id === previewMerchantId)}
        isCustomer={previewMerchantId ? customerMerchantIds.includes(previewMerchantId) : false}
        distance={
          previewMerchant && userLocation.latitude && userLocation.longitude && previewMerchant.latitude && previewMerchant.longitude
            ? formatDistance(haversineDistance(userLocation.latitude, userLocation.longitude, previewMerchant.latitude, previewMerchant.longitude))
            : null
        }
      />
    </div>
  );
};

export default ExploreTab;
