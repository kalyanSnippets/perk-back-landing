import {
  BarChart3,
  Bell,
  CreditCard,
  Gift,
  Home,
  LineChart,
  Megaphone,
  QrCode,
  ScanLine,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PrototypeDevice = "mobile" | "desktop";
export type PrototypeFlow = "customer" | "merchant" | "marketing";

export interface PrototypeScreen {
  id: string;
  title: string;
  flow: PrototypeFlow;
  device: PrototypeDevice;
  step: number;
  description: string;
  ctaLabel?: string;
  ctaTarget?: string;
  icon: LucideIcon;
}

export const prototypeScreens: PrototypeScreen[] = [
  { id: "customer-splash", title: "Splash", flow: "customer", device: "mobile", step: 1, description: "Premium brand intro for the PerkBack wallet.", ctaLabel: "Start", ctaTarget: "customer-onboarding", icon: Sparkles },
  { id: "customer-onboarding", title: "Onboarding", flow: "customer", device: "mobile", step: 2, description: "Clear loyalty promise with modern app-store polish.", ctaLabel: "Create account", ctaTarget: "customer-auth", icon: Home },
  { id: "customer-auth", title: "Login", flow: "customer", device: "mobile", step: 3, description: "Fast customer entry with friendly, premium copy.", ctaLabel: "View wallet", ctaTarget: "customer-home", icon: UserRound },
  { id: "customer-home", title: "Home", flow: "customer", device: "mobile", step: 4, description: "Points, tier progress, and rewards ready to use.", ctaLabel: "Open card", ctaTarget: "customer-card", icon: WalletCards },
  { id: "customer-card", title: "Loyalty Card", flow: "customer", device: "mobile", step: 5, description: "Digital card, barcode area, QR identity, and tier status.", ctaLabel: "See rewards", ctaTarget: "customer-rewards", icon: CreditCard },
  { id: "customer-rewards", title: "Rewards", flow: "customer", device: "mobile", step: 6, description: "Redeemable offers and merchant-specific perks.", ctaLabel: "Explore nearby", ctaTarget: "customer-explore", icon: Gift },
  { id: "customer-explore", title: "Explore", flow: "customer", device: "mobile", step: 7, description: "Nearby participating merchants and live deals.", ctaLabel: "View receipt", ctaTarget: "customer-receipt", icon: Store },
  { id: "customer-receipt", title: "Receipt", flow: "customer", device: "mobile", step: 8, description: "Transaction detail with points and item-level offers.", ctaLabel: "Profile", ctaTarget: "customer-profile", icon: ShoppingBag },
  { id: "customer-profile", title: "Profile", flow: "customer", device: "mobile", step: 9, description: "Settings, wallet sync, notifications, and preferences.", ctaTarget: "customer-home", icon: Settings },
  { id: "merchant-login", title: "Merchant Login", flow: "merchant", device: "mobile", step: 1, description: "Business-first login for in-store staff and owners.", ctaLabel: "Open dashboard", ctaTarget: "merchant-dashboard", icon: Store },
  { id: "merchant-dashboard", title: "Dashboard", flow: "merchant", device: "mobile", step: 2, description: "Today’s loyalty ROI, quick actions, and activity feed.", ctaLabel: "Add points", ctaTarget: "merchant-add-points", icon: BarChart3 },
  { id: "merchant-add-points", title: "Add Points", flow: "merchant", device: "mobile", step: 3, description: "Fast point entry using card number, phone, or customer search.", ctaLabel: "Scan card", ctaTarget: "merchant-scan", icon: Gift },
  { id: "merchant-scan", title: "QR Scanner", flow: "merchant", device: "mobile", step: 4, description: "Camera-ready scanning moment for customer cards.", ctaLabel: "Customers", ctaTarget: "merchant-customers", icon: ScanLine },
  { id: "merchant-customers", title: "Customers", flow: "merchant", device: "mobile", step: 5, description: "Segmented loyalty customer list for quick follow-up.", ctaLabel: "Campaign", ctaTarget: "merchant-campaign", icon: Users },
  { id: "merchant-campaign", title: "Campaign", flow: "merchant", device: "mobile", step: 6, description: "Guided campaign builder with AI-style suggestions.", ctaLabel: "Insights", ctaTarget: "merchant-insights", icon: Megaphone },
  { id: "merchant-insights", title: "Insights", flow: "merchant", device: "mobile", step: 7, description: "Retention, repeat visits, revenue, and reward impact.", ctaLabel: "Settings", ctaTarget: "merchant-settings", icon: LineChart },
  { id: "merchant-settings", title: "Settings", flow: "merchant", device: "mobile", step: 8, description: "Plan, POS, NFC, profile, and notification controls.", ctaTarget: "merchant-dashboard", icon: Settings },
  { id: "marketing-home", title: "Homepage", flow: "marketing", device: "desktop", step: 1, description: "Premium SaaS hero for merchants and customers.", ctaLabel: "View pricing", ctaTarget: "marketing-pricing", icon: Sparkles },
  { id: "marketing-pricing", title: "Pricing", flow: "marketing", device: "desktop", step: 2, description: "Clear Free, Growth, and Pro plan comparison.", ctaLabel: "Customer app", ctaTarget: "desktop-customer", icon: CreditCard },
  { id: "desktop-customer", title: "Customer Web", flow: "marketing", device: "desktop", step: 3, description: "Desktop customer dashboard with rewards marketplace.", ctaLabel: "Merchant app", ctaTarget: "desktop-merchant", icon: WalletCards },
  { id: "desktop-merchant", title: "Merchant SaaS", flow: "marketing", device: "desktop", step: 4, description: "Loyalty operating system dashboard for local businesses.", ctaLabel: "Analytics", ctaTarget: "desktop-analytics", icon: BarChart3 },
  { id: "desktop-analytics", title: "Analytics", flow: "marketing", device: "desktop", step: 5, description: "Retention reporting, segments, and campaign impact.", ctaLabel: "Platform", ctaTarget: "desktop-admin", icon: LineChart },
  { id: "desktop-admin", title: "Platform", flow: "marketing", device: "desktop", step: 6, description: "Admin-style platform overview and merchant health.", ctaTarget: "marketing-home", icon: Bell },
];

export const getPrototypeScreens = (device: PrototypeDevice, flow: PrototypeFlow) =>
  prototypeScreens.filter((screen) => screen.device === device && screen.flow === flow).sort((a, b) => a.step - b.step);

export const getPrototypeScreenById = (id: string) => prototypeScreens.find((screen) => screen.id === id);
