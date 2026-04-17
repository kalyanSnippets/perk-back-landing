import { Store, Gift, Megaphone, CalendarDays, MapPin, Navigation } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface MerchantPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: {
    id: string;
    store_name: string;
    industry_type: string | null;
    logo_url: string | null;
    address: string | null;
  } | null;
  rewards: { id: string; title: string; points_required: number; reward_type: string }[];
  campaigns: { id: string; title: string; description: string | null }[];
  offers: { id: string; title: string; description: string | null; valid_to: string | null }[];
  isCustomer: boolean;
  distance?: string | null;
}

const MerchantPreview = ({ open, onOpenChange, merchant, rewards, campaigns, offers, isCustomer, distance }: MerchantPreviewProps) => {
  if (!merchant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center overflow-hidden">
              {merchant.logo_url ? (
                <img src={merchant.logo_url} alt={merchant.store_name} className="w-full h-full object-cover" />
              ) : (
                <Store size={24} className="text-secondary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base">{merchant.store_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{merchant.industry_type || "Business"}</span>
                {distance && (
                  <span className="text-[10px] text-primary flex items-center gap-0.5">
                    <MapPin size={8} /> {distance}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {merchant.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin size={12} /> {merchant.address}
            </p>
          )}

          {/* Rewards */}
          {rewards.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <Gift size={13} className="text-accent" /> Rewards ({rewards.length})
              </h4>
              <div className="space-y-1.5">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-xs text-foreground font-medium">{r.title}</span>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{r.points_required} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns */}
          {campaigns.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <Megaphone size={13} className="text-secondary" /> Campaigns ({campaigns.length})
              </h4>
              <div className="space-y-1.5">
                {campaigns.map((c) => (
                  <div key={c.id} className="bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-foreground font-medium">{c.title}</p>
                    {c.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Offers */}
          {offers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <CalendarDays size={13} className="text-primary" /> Monthly Offers ({offers.length})
              </h4>
              <div className="space-y-1.5">
                {offers.map((o) => (
                  <div key={o.id} className="bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-foreground font-medium">{o.title}</p>
                    {o.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{o.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isCustomer && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-foreground">Visit this store to start earning! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">Show your loyalty card at checkout to collect points.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantPreview;
