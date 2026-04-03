import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, Receipt, Megaphone, Gift, TrendingUp,
  Sparkles, Gamepad2, Cake, CalendarHeart, Wifi, FileBarChart, Settings, Lock
} from "lucide-react";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { getRequiredPlan, planLabel, type PlanTier } from "@/lib/features";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  route: string;
  icon: React.ElementType;
  featureKey?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", route: "/merchant/dashboard", icon: LayoutDashboard },
  { label: "Customers", route: "/merchant/customers", icon: Users },
  { label: "Transactions", route: "/merchant/transactions", icon: Receipt },
  { label: "Campaigns", route: "/merchant/campaigns", icon: Megaphone, featureKey: "campaigns" },
  { label: "Rewards", route: "/merchant/rewards", icon: Gift, featureKey: "rewards" },
  { label: "Analytics", route: "/merchant/analytics", icon: TrendingUp, featureKey: "analytics" },
  { label: "AI Suggestions", route: "/merchant/ai-suggestions", icon: Sparkles, featureKey: "ai_suggestions" },
  { label: "Gamification", route: "/merchant/gamification", icon: Gamepad2, featureKey: "gamification" },
  { label: "Birthday Offers", route: "/merchant/birthday-offers", icon: Cake, featureKey: "birthday_offers" },
  { label: "Monthly Offers", route: "/merchant/monthly-offers", icon: CalendarHeart, featureKey: "monthly_offers" },
  { label: "POS", route: "/merchant/pos", icon: Wifi, featureKey: "pos_integration" },
  { label: "Reports", route: "/merchant/reports", icon: FileBarChart, featureKey: "advanced_reports" },
  { label: "Settings", route: "/merchant/settings", icon: Settings },
];

interface MerchantNavProps {
  merchantId: string | undefined;
}

const MerchantNav = ({ merchantId }: MerchantNavProps) => {
  const { canAccess, loading } = useMerchantSubscription(merchantId);
  const location = useLocation();

  if (loading) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-20 self-start bg-card rounded-2xl border border-border/50 shadow-card p-2 gap-0.5 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const locked = item.featureKey ? !canAccess(item.featureKey) : false;
          const requiredPlan = item.featureKey ? getRequiredPlan(item.featureKey) : "free";
          return (
            <NavLink
              key={item.route}
              to={item.route}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                locked ? "text-muted-foreground/60" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              activeClassName="bg-primary/10 text-primary font-semibold"
            >
              <item.icon size={16} className="shrink-0" />
              <span className="truncate flex-1">{item.label}</span>
              {locked && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/50">
                  <Lock size={10} />
                  {planLabel(requiredPlan)}
                </span>
              )}
            </NavLink>
          );
        })}
      </aside>

      {/* Mobile bottom nav — scrollable icon bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-card">
        <div className="flex overflow-x-auto gap-0.5 px-2 py-1.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const locked = item.featureKey ? !canAccess(item.featureKey) : false;
            const isActive = location.pathname === item.route;
            return (
              <NavLink
                key={item.route}
                to={item.route}
                className={cn(
                  "flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-lg text-[9px] font-medium transition-colors relative",
                  isActive
                    ? "text-primary bg-primary/10"
                    : locked
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon size={18} />
                  {locked && (
                    <Lock size={8} className="absolute -top-1 -right-1.5 text-muted-foreground/50" />
                  )}
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MerchantNav;
