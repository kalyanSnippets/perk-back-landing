import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Compass, Gift, MapPin, Navigation, Search, Store } from "lucide-react";
import { useUserLocation, haversineDistance, formatDistance } from "@/lib/geo";
import IndustryFilter from "./IndustryFilter";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";

interface ExploreMerchantCard {
  merchant_id: string;
  store_name: string;
  industry_type?: string | null;
  logo_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bannerImage: string;
  rewardCount: number;
  offerCount: number;
  isJoined?: boolean;
}

interface ExploreTabProps {
  merchants: ExploreMerchantCard[];
  onOpenMerchant: (merchantId: string) => void;
}

const getDirectionsUrl = (merchant: ExploreMerchantCard) => {
  if (merchant.latitude != null && merchant.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${merchant.latitude},${merchant.longitude}`;
  }

  return merchant.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(merchant.address)}`
    : null;
};

const ExploreTab = ({ merchants, onOpenMerchant }: ExploreTabProps) => {
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const userLocation = useUserLocation();

  useEffect(() => {
    if (!carouselApi) return;

    const syncSlide = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    syncSlide();
    carouselApi.on("select", syncSlide);
    carouselApi.on("reInit", syncSlide);
  }, [carouselApi]);

  const uniqueIndustries = useMemo(
    () => [...new Set(merchants.map((merchant) => merchant.industry_type).filter(Boolean) as string[])].sort(),
    [merchants],
  );

  const filteredMerchants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return merchants.filter((merchant) => {
      const matchesIndustry = industryFilter ? merchant.industry_type === industryFilter : true;
      const matchesSearch = normalizedQuery.length === 0
        ? true
        : [merchant.store_name, merchant.industry_type, merchant.address]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesIndustry && matchesSearch;
    });
  }, [industryFilter, merchants, searchQuery]);

  const merchantsWithDistance = useMemo(() => filteredMerchants.map((merchant) => {
    const distance = userLocation.latitude && userLocation.longitude && merchant.latitude != null && merchant.longitude != null
      ? haversineDistance(userLocation.latitude, userLocation.longitude, merchant.latitude, merchant.longitude)
      : null;

    return { ...merchant, distance };
  }), [filteredMerchants, userLocation.latitude, userLocation.longitude]);

  const featuredNearbyMerchant = useMemo(() => merchantsWithDistance
    .filter((merchant) => merchant.distance !== null)
    .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY))[0] ?? null, [merchantsWithDistance]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.reInit();
    carouselApi.scrollTo(0);
    setCurrentSlide(0);
  }, [carouselApi, filteredMerchants.length]);

  if (merchants.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Stores will appear here once merchants go live.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScrollReveal>
        <div className="rounded-[28px] border border-border/35 bg-card/90 p-5 shadow-card backdrop-blur-sm">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Compass size={16} className="text-secondary" /> Explore Stores
            </h3>
            <p className="text-xs text-muted-foreground">
              Browse one merchant at a time, then open the full store page for rewards, offers, and directions.
            </p>
          </div>

          <div className="relative mt-4">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search stores, industries, or locations"
              className="h-11 rounded-xl border-border/50 bg-background pl-9"
            />
          </div>

          <div className="mt-3">
            <IndustryFilter selected={industryFilter} onChange={setIndustryFilter} industries={uniqueIndustries} />
          </div>
        </div>
      </ScrollReveal>

      {featuredNearbyMerchant && featuredNearbyMerchant.distance !== null && (
        <ScrollReveal delay={20}>
          <div className="rounded-[24px] border border-border/35 bg-card/90 p-4 shadow-card backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Closest to you</p>
                <h4 className="mt-1 text-base font-bold text-foreground">{featuredNearbyMerchant.store_name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistance(featuredNearbyMerchant.distance)} away
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenMerchant(featuredNearbyMerchant.merchant_id)}>
                Open <Store size={14} />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      )}

      {merchantsWithDistance.length === 0 ? (
        <ScrollReveal delay={40}>
          <div className="rounded-[28px] border border-dashed border-border/50 bg-muted/10 p-8 text-center">
            <Store size={28} className="mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-foreground">No stores match your search</p>
            <p className="mt-1 text-xs text-muted-foreground">Try another industry or clear the search to browse all merchants.</p>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={40}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-xs text-muted-foreground">
                {merchantsWithDistance.length} store{merchantsWithDistance.length === 1 ? "" : "s"} available
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                <ArrowLeftRight size={12} /> Swipe to browse
              </span>
            </div>

            <Carousel setApi={setCarouselApi} opts={{ align: "start" }} className="w-full">
              <CarouselContent>
                {merchantsWithDistance.map((merchant) => {
                  const directionsUrl = getDirectionsUrl(merchant);
                  return (
                    <CarouselItem key={merchant.merchant_id} className="basis-full">
                      <div className="overflow-hidden rounded-[30px] border border-border/35 bg-card shadow-card">
                        <button type="button" onClick={() => onOpenMerchant(merchant.merchant_id)} className="block w-full text-left">
                          <div className="relative h-[440px] overflow-hidden">
                            <img src={merchant.bannerImage} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/45 to-transparent" />

                            <div className="absolute left-5 top-5 flex items-center gap-2">
                              {merchant.isJoined && (
                                <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground shadow-card">
                                  Joined
                                </span>
                              )}
                              <span className="rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
                                {merchant.rewardCount} reward{merchant.rewardCount === 1 ? "" : "s"}
                              </span>
                            </div>

                            <div className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-background/25 bg-card/90 shadow-card">
                              {merchant.logo_url ? (
                                <img src={merchant.logo_url} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <Store size={22} className="text-secondary" />
                              )}
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
                              <div className="rounded-[24px] border border-background/15 bg-background/10 p-4 backdrop-blur-sm">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/72">{merchant.industry_type || "Business"}</p>
                                <h4 className="mt-1 text-3xl font-bold leading-tight">{merchant.store_name}</h4>
                                {merchant.address && (
                                  <p className="mt-2 flex items-start gap-1.5 text-sm text-primary-foreground/82">
                                    <MapPin size={14} className="mt-0.5 shrink-0" /> {merchant.address}
                                  </p>
                                )}

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="rounded-2xl bg-background/10 p-3">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/62">Rewards</p>
                                    <p className="mt-1 text-xl font-bold">{merchant.rewardCount}</p>
                                  </div>
                                  <div className="rounded-2xl bg-background/10 p-3">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/62">Offers</p>
                                    <p className="mt-1 text-xl font-bold">{merchant.offerCount}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 border-t border-border/30 bg-card p-4">
                          <Button variant="hero" className="flex-1 gap-2" onClick={() => onOpenMerchant(merchant.merchant_id)}>
                            Open Store
                          </Button>
                          {directionsUrl && (
                            <Button variant="outline" size="icon" asChild>
                              <a href={directionsUrl} target="_blank" rel="noreferrer" aria-label={`Get directions to ${merchant.store_name}`}>
                                <Navigation size={16} />
                              </a>
                            </Button>
                          )}
                          {merchant.distance !== null && (
                            <div className="rounded-2xl bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                              {formatDistance(merchant.distance)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>

            {merchantsWithDistance.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {merchantsWithDistance.map((merchant, index) => (
                  <button
                    key={merchant.merchant_id}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "w-6 bg-primary" : "w-2 bg-border"}`}
                    aria-label={`Go to ${merchant.store_name}`}
                  />
                ))}
              </div>
            )}

            <div className="rounded-[24px] border border-border/35 bg-card/90 p-4 shadow-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10">
                  <Gift size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Recommendation</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    For PerkBack, this one-store-per-screen layout works better than a stacked directory because it makes local merchant discovery feel premium while keeping rewards inside the dedicated Rewards tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};

export default ExploreTab;
