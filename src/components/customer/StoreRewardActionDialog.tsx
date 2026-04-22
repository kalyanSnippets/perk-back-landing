import { Clock, Gift, MapPin, Navigation, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StoreRewardActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: {
    id: string;
    title: string;
    description: string | null;
    points_required: number;
    reward_type: string;
    is_limited_time: boolean;
    expires_at: string | null;
    store_name?: string;
    image_url?: string | null;
  } | null;
  pointsBalance: number;
  directionsUrl: string | null;
  address?: string | null;
  redeeming: boolean;
  onRedeem: (rewardId: string) => void;
}

const StoreRewardActionDialog = ({
  open,
  onOpenChange,
  reward,
  pointsBalance,
  directionsUrl,
  address,
  redeeming,
  onRedeem,
}: StoreRewardActionDialogProps) => {
  if (!reward) return null;

  const progress = Math.min((pointsBalance / reward.points_required) * 100, 100);
  const readyToRedeem = progress >= 100;
  const remainingPoints = Math.max(reward.points_required - pointsBalance, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden border border-border/50 bg-card p-0">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10">
          {reward.image_url ? (
            <>
              <img src={reward.image_url} alt={reward.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary" />
          )}
          <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
            <p className="text-[11px] uppercase tracking-[0.14em] text-primary-foreground/70">{reward.store_name}</p>
            <h3 className="mt-1 text-2xl font-bold leading-tight">{reward.title}</h3>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="sr-only">Reward details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {reward.description || `Use this reward at ${reward.store_name}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border/40 bg-muted/25 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your store points</span>
              <span className="font-bold text-foreground">{pointsBalance}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required</span>
              <span className="font-bold text-foreground">{reward.points_required}</span>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                <Gift size={12} className="text-secondary" /> {reward.reward_type}
              </span>
              {reward.is_limited_time && reward.expires_at && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                  <Clock size={12} className="text-accent-foreground" />
                  Expires {new Date(reward.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>

          {address && (
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-secondary" />
                <span>{address}</span>
              </p>
            </div>
          )}

          {!readyToRedeem && (
            <p className="text-sm text-muted-foreground">
              You need <span className="font-semibold text-foreground">{remainingPoints} more points</span> before this reward is ready.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {directionsUrl && (
              <Button variant="hero" className="w-full gap-2" asChild>
                <a href={directionsUrl} target="_blank" rel="noreferrer">
                  <Navigation size={16} /> Get Directions
                </a>
              </Button>
            )}
            {readyToRedeem && (
              <Button variant="outline" className="w-full gap-2" onClick={() => onRedeem(reward.id)} disabled={redeeming}>
                <Ticket size={16} /> {redeeming ? "Redeeming..." : "Redeem Reward"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreRewardActionDialog;
