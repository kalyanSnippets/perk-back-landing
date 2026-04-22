import { ArrowLeft, CalendarDays, Gift, MapPin, Navigation, Megaphone, Shield, Store, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ScrollReveal from "@/components/ScrollReveal";
import StampCardProgress from "@/components/customer/StampCardProgress";
import NfcTapButton from "@/components/customer/NfcTapButton";
import MerchantStatusCard from "@/components/customer/MerchantStatusCard";

interface RewardData {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  is_limited_time: boolean;
  expires_at: string | null;
  merchant_id: string;
  store_name?: string;
  image_url?: string | null;
}

interface CampaignData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  merchant_id: string;
  ai_generated?: boolean | null;
  target_segment?: string | null;
  store_name?: string;
}

interface MonthlyOfferData {
  id: string;
  title: string;
  description: string | null;
  valid_to: string | null;
  merchant_id: string;
  store_name?: string;
}

interface TransactionData {
  id: string;
  merchant_id: string | null;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
}

interface CustomerMerchantData {
  merchant_id: string;
  store_name: string;
  points_balance: number;
  total_spend: number;
  visit_count: number;
  last_visit_at: string | null;
  logo_url?: string | null;
  industry_type?: string | null;
  address?: string | null;
}

interface StoreDetailViewProps {
  merchant: CustomerMerchantData & { rewardCount: number; offerCount: number; bannerImage: string };
  rewards: RewardData[];
  campaigns: CampaignData[];
  offers: MonthlyOfferData[];
  transactions: TransactionData[];
  customerId: string;
  loyaltyCardNumber: string;
  directionsUrl: string | null;
  gamification?: { stamp: boolean; streak: boolean; levels: boolean };
  onBack: () => void;
  onRewardSelect: (reward: RewardData) => void;
  onCampaignSelect: (campaign: CampaignData) => void;
}

const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const StoreDetailView = ({
  merchant,
  rewards,
  campaigns,
  offers,
  transactions,
  customerId,
  loyaltyCardNumber,
  directionsUrl,
  gamification,
  onBack,
  onRewardSelect,
  onCampaignSelect,
}: StoreDetailViewProps) => {
  const nearestReward = rewards.length > 0
    ? rewards.reduce((closest, reward) => {
        const diff = reward.points_required - merchant.points_balance;
        const closestDiff = closest.points_required - merchant.points_balance;
        if (diff > 0 && (closestDiff <= 0 || diff < closestDiff)) return reward;
        return closest;
      }, rewards[0])
    : null;
  const nearestProgress = nearestReward ? Math.min((merchant.points_balance / nearestReward.points_required) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      <ScrollReveal>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft size={16} /> Back to My Rewards
        </button>
      </ScrollReveal>

      <ScrollReveal delay={20}>
        <section className="overflow-hidden rounded-[30px] border border-border/40 bg-card shadow-card">
          <div className="relative h-64 overflow-hidden">
            <img src={merchant.bannerImage} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/45 to-transparent" />
            <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-background/30 bg-card/95 shadow-card">
              {merchant.logo_url ? (
                <img src={merchant.logo_url} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Store size={24} className="text-secondary" />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
              <p className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">{merchant.industry_type || "Business"}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-3xl font-bold">{merchant.store_name}</h2>
                  {merchant.address && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-primary-foreground/78">
                      <MapPin size={14} className="mt-0.5 shrink-0" /> {merchant.address}
                    </p>
                  )}
                </div>
                {directionsUrl && (
                  <Button variant="hero-outline" size="sm" className="shrink-0 border-background/25 bg-background/10 text-primary-foreground hover:bg-background hover:text-foreground" asChild>
                    <a href={directionsUrl} target="_blank" rel="noreferrer">
                      <Navigation size={14} /> Directions
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-border/30 bg-card p-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Points</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{merchant.points_balance}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Visits</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{merchant.visit_count}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Spend</p>
              <p className="mt-1 text-2xl font-bold text-foreground">${merchant.total_spend.toFixed(0)}</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="rounded-[28px] border border-border/40 bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Reward Summary</p>
              <h3 className="mt-1 text-xl font-bold text-foreground">{merchant.rewardCount} rewards ready to explore</h3>
            </div>
            <div className="rounded-2xl bg-muted/35 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Offers</p>
              <p className="text-lg font-bold text-foreground">{merchant.offerCount}</p>
            </div>
          </div>
          {nearestReward ? (
            <div className="mt-4 rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Next unlock</span>
                <span className="font-semibold text-foreground">{nearestReward.title}</span>
              </div>
              <Progress value={nearestProgress} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {Math.max(nearestReward.points_required - merchant.points_balance, 0)} points to go.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">This store has no active rewards yet.</p>
          )}
        </section>
      </ScrollReveal>

      {gamification && (gamification.levels || gamification.streak) && (
        <ScrollReveal delay={60}>
          <MerchantStatusCard
            merchantId={merchant.merchant_id}
            storeName={merchant.store_name}
            pointsBalance={merchant.points_balance}
            transactions={transactions}
            showTier={gamification.levels}
            showStreak={gamification.streak}
          />
        </ScrollReveal>
      )}

      <ScrollReveal delay={80}>
        <div className="space-y-3">
          <StampCardProgress customerId={customerId} merchantId={merchant.merchant_id} merchantName={merchant.store_name} />
          <NfcTapButton customerId={customerId} customerCardNumber={loyaltyCardNumber} />
        </div>
      </ScrollReveal>

      {campaigns.length > 0 && (
        <ScrollReveal delay={100}>
          <section className="rounded-[28px] border border-border/40 bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <Megaphone size={16} className="text-secondary" /> Campaigns
            </div>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => onCampaignSelect(campaign)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border/30 bg-muted/20 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/40">
                    {campaign.image_url ? (
                      <img src={campaign.image_url} alt={campaign.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15">
                        <Megaphone size={18} className="text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{campaign.title}</p>
                    {campaign.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {offers.length > 0 && (
        <ScrollReveal delay={120}>
          <section className="rounded-[28px] border border-border/40 bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarDays size={16} className="text-accent-foreground" /> Monthly Offers
            </div>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-border/30 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                      <CalendarDays size={16} className="text-accent-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{offer.title}</p>
                      {offer.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{offer.description}</p>}
                      {offer.valid_to && (
                        <p className="mt-2 text-[11px] text-muted-foreground">Ends in {daysUntil(offer.valid_to)} days</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={140}>
        <section className="rounded-[28px] border border-border/40 bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <Gift size={16} className="text-accent" /> Rewards
          </div>
          {rewards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              No rewards live for this store yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => {
                const progress = Math.min((merchant.points_balance / reward.points_required) * 100, 100);
                const readyToRedeem = progress >= 100;
                return (
                  <button
                    key={reward.id}
                    type="button"
                    onClick={() => onRewardSelect(reward)}
                    className="w-full overflow-hidden rounded-[24px] border border-border/30 bg-muted/15 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="relative h-40 overflow-hidden">
                      {reward.image_url ? (
                        <img src={reward.image_url} alt={reward.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                      {readyToRedeem && (
                        <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-foreground">{reward.title}</p>
                          {reward.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{reward.description}</p>}
                        </div>
                        <div className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          {reward.reward_type}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{merchant.points_balance}/{reward.points_required} pts</span>
                          <span className="font-semibold text-foreground">
                            {readyToRedeem ? "Redeem now" : `${reward.points_required - merchant.points_balance} to go`}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={160}>
        <section className="rounded-[28px] border border-border/40 bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <Shield size={16} className="text-secondary" /> Recent Points Activity
          </div>
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              No transactions yet for this store.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-border/30 bg-muted/20 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{transaction.merchant_name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ${transaction.purchase_amount.toFixed(2)} · {new Date(transaction.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent/15 px-2.5 py-1 text-sm font-bold text-accent-foreground">
                    +{transaction.points_awarded}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={180}>
        <div className="rounded-[28px] border border-border/40 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Visit This Store</p>
              <h3 className="mt-1 text-xl font-bold text-foreground">Ready to use your loyalty perks?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Open directions and head in-store to earn more points or redeem what's already unlocked.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 shadow-card">
              <Ticket size={20} className="text-accent-foreground" />
            </div>
          </div>
          {directionsUrl && (
            <Button variant="hero" className="mt-4 w-full gap-2" asChild>
              <a href={directionsUrl} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Get Directions to {merchant.store_name}
              </a>
            </Button>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
};

export default StoreDetailView;
