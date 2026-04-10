import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Store, Gift, Megaphone, CalendarDays, MapPin, Sparkles, Clock, TrendingUp,
} from "lucide-react";
import { useUserLocation, haversineDistance, formatDistance } from "@/lib/geo";
import IndustryFilter from "./IndustryFilter";
import NearbyMerchants from "./NearbyMerchants";
import MerchantPreview from "./MerchantPreview";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";

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
                {campaigns.map((c, i) => (
                  <CarouselItem key={c.id}>
                    <button
                      onClick={() => setPreviewMerchantId(c.merchant_id)}
                      className="w-full text-left relative rounded-2xl overflow-hidden bg-gradient-to-br ${CAROUSEL_GRADIENTS[i % CAROUSEL_GRADIENTS.length]} p-5 min-h-[130px] flex flex-col justify-between"
                      style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))` }}
                    >
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/10" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Megaphone size={13} className="text-primary-foreground/70" />
                          <span className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">
                            {merchantMap.get(c.merchant_id)?.store_name || "Store"}
                          </span>
                        </div>
                        <h4 className="text-primary-foreground font-bold text-base leading-tight">{c.title}</h4>
                        {c.description && <p className="text-primary-foreground/70 text-xs mt-1 line-clamp-2">{c.description}</p>}
                      </div>
                    </button>
                  </CarouselItem>
                ))}
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
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {rewards.slice(0, 10).map((r) => {
                const merchant = merchantMap.get(r.merchant_id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setPreviewMerchantId(r.merchant_id)}
                    className="min-w-[170px] snap-start flex-shrink-0 rounded-xl border border-border/30 bg-card p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Gift size={13} className="text-accent" />
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate flex-1">{merchant?.store_name || "Store"}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{r.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-primary">{r.points_required} pts</span>
                      <span className="text-[10px] text-accent">Earn & redeem →</span>
                    </div>
                  </button>
                );
              })}
            </div>
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
            <div className="grid grid-cols-2 gap-2.5">
              {filteredMerchants.map((m) => {
                const rewardCount = merchantRewardCounts.get(m.id) || 0;
                const isMember = customerMerchantIds.includes(m.id);
                const dist = userLocation.latitude && userLocation.longitude && m.latitude && m.longitude
                  ? haversineDistance(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude)
                  : null;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPreviewMerchantId(m.id)}
                    className="rounded-xl border border-border/30 bg-card p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {m.logo_url ? (
                          <img src={m.logo_url} alt={m.store_name} className="w-full h-full object-cover" />
                        ) : (
                          <Store size={18} className="text-secondary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {isMember && (
                          <span className="text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">MEMBER</span>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold text-xs text-foreground truncate">{m.store_name}</p>
                    {m.industry_type && (
                      <span className="text-[9px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full inline-block mt-1">{m.industry_type}</span>
                    )}
                    {m.address && (
                      <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 mt-1 truncate">
                        <MapPin size={8} /> {m.address}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {rewardCount > 0 && (
                        <span className="text-[9px] text-accent">{rewardCount} reward{rewardCount > 1 ? "s" : ""}</span>
                      )}
                      {dist !== null && (
                        <span className="text-[9px] text-primary flex items-center gap-0.5">
                          <MapPin size={7} /> {formatDistance(dist)}
                        </span>
                      )}
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
