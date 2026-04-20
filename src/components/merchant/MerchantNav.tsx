import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, BarChart3, Megaphone, Settings, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FloatingBottomNav from "@/components/shared/FloatingBottomNav";

interface NavItem {
  label: string;
  route: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", route: "/merchant/dashboard", icon: LayoutDashboard },
  { label: "Customers", route: "/merchant/customers", icon: Users },
  { label: "Points", route: "/merchant/points", icon: Coins },
  { label: "Insights", route: "/merchant/insights", icon: BarChart3 },
  { label: "Marketing", route: "/merchant/marketing", icon: Megaphone },
  { label: "Settings", route: "/merchant/settings", icon: Settings },
];

interface MerchantNavProps {
  merchantId: string | undefined;
}

const MerchantNav = ({ merchantId }: MerchantNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeItem =
    NAV_ITEMS.find(
      (item) => location.pathname === item.route || location.pathname.startsWith(item.route + "/"),
    ) ?? NAV_ITEMS[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-20 self-start bg-card rounded-2xl border border-border/50 shadow-card p-2 gap-0.5 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
            activeClassName="bg-primary/10 text-primary font-semibold"
          >
            <item.icon size={16} className="shrink-0" />
            <span className="truncate flex-1">{item.label}</span>
          </NavLink>
        ))}
      </aside>

      {/* Mobile floating pill nav */}
      <div className="lg:hidden">
        <FloatingBottomNav
          items={NAV_ITEMS.map((item) => ({
            key: item.route,
            label: item.label,
            icon: item.icon,
            onClick: () => navigate(item.route),
          }))}
          activeKey={activeItem.route}
        />
      </div>
    </>
  );
};

export default MerchantNav;
