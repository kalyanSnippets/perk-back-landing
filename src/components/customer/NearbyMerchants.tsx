import { MapPin, Store } from "lucide-react";
import { formatDistance, haversineDistance } from "@/lib/geo";

interface MerchantWithLocation {
  id: string;
  store_name: string;
  industry_type: string | null;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  reward_count: number;
}

interface NearbyMerchantsProps {
  merchants: MerchantWithLocation[];
  userLat: number;
  userLng: number;
  radiusKm?: number;
  onMerchantClick: (merchantId: string) => void;
}

const NearbyMerchants = ({ merchants, userLat, userLng, radiusKm = 5, onMerchantClick }: NearbyMerchantsProps) => {
  const nearby = merchants
    .filter((m) => m.latitude != null && m.longitude != null)
    .map((m) => ({
      ...m,
      distance: haversineDistance(userLat, userLng, m.latitude!, m.longitude!),
    }))
    .filter((m) => m.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  if (nearby.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <MapPin size={16} className="text-primary" /> Near You
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {nearby.map((m) => (
          <button
            key={m.id}
            onClick={() => onMerchantClick(m.id)}
            className="min-w-[160px] snap-start flex-shrink-0 rounded-xl border border-border/30 bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center overflow-hidden">
                {m.logo_url ? (
                  <img src={m.logo_url} alt={m.store_name} className="w-full h-full object-cover" />
                ) : (
                  <Store size={14} className="text-secondary" />
                )}
              </div>
              <p className="font-semibold text-xs text-foreground truncate flex-1">{m.store_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{m.industry_type || "Business"}</span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <MapPin size={8} /> {formatDistance(m.distance)}
              </span>
            </div>
            {m.reward_count > 0 && (
              <p className="text-[10px] text-accent mt-1">{m.reward_count} reward{m.reward_count > 1 ? "s" : ""} available</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NearbyMerchants;
