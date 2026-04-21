import {
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  Gift,
  Home,
  LineChart,
  MapPin,
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

export type PrototypeDevice = "mobile" | "tablet" | "desktop";
export type PrototypeFlow = "customer-join" | "customer-mobile" | "merchant-tablet" | "merchant-desktop" | "marketing-desktop";

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
  // Customer first-touch (QR → wallet)
  { id: "join-qr-poster", title: "QR Poster", flow: "customer-join", device: "mobile", step: 1, description: "Counter-top sign at the merchant store with the scannable PerkBack QR.", ctaLabel: "Scan", ctaTarget: "join-splash", icon: QrCode },
  { id: "join-splash", title: "Splash", flow: "customer-join", device: "mobile", step: 2, description: "PerkBack brand splash — animated logo bloom on the hero gradient.", ctaLabel: "Next", ctaTarget: "join-merchant-welcome", icon: Sparkles },
  { id: "join-merchant-welcome", title: "Merchant Welcome", flow: "customer-join", device: "mobile", step: 3, description: "Branded intro with merchant logo, store name, and lifestyle photography.", ctaLabel: "Get started", ctaTarget: "join-onboarding-1", icon: Store },
  { id: "join-onboarding-1", title: "Onboarding · Scan", flow: "customer-join", device: "mobile", step: 4, description: "Slide 1 — show your card at any participating store.", ctaLabel: "Continue", ctaTarget: "join-onboarding-2", icon: ScanLine },
  { id: "join-onboarding-2", title: "Onboarding · Rewards", flow: "customer-join", device: "mobile", step: 5, description: "Slide 2 — free coffees, perks and treats from real local places.", ctaLabel: "Continue", ctaTarget: "join-onboarding-3", icon: Gift },
  { id: "join-onboarding-3", title: "Onboarding · Discover", flow: "customer-join", device: "mobile", step: 6, description: "Slide 3 — find perks near you in a local marketplace.", ctaLabel: "Create wallet", ctaTarget: "join-quick-questions", icon: MapPin },
  { id: "join-quick-questions", title: "Quick Questions", flow: "customer-join", device: "mobile", step: 7, description: "Name, phone and DOB — with a clear reason for each.", ctaLabel: "Continue", ctaTarget: "join-create-wallet", icon: UserRound },
  { id: "join-create-wallet", title: "Create Wallet", flow: "customer-join", device: "mobile", step: 8, description: "Email, password and Google / Apple sign-up.", ctaLabel: "Create", ctaTarget: "join-card-ready", icon: WalletCards },
  { id: "join-card-ready", title: "Card Ready", flow: "customer-join", device: "mobile", step: 9, description: "Celebration moment with CRN and loyalty number revealed.", ctaLabel: "Open wallet", ctaTarget: "join-wallet-home", icon: CheckCircle2 },
  { id: "join-wallet-home", title: "Wallet Home", flow: "customer-join", device: "mobile", step: 10, description: "Where the customer lands — points, store, and next reward.", ctaTarget: "join-qr-poster", icon: WalletCards },

  { id: "customer-invite", title: "Invite", flow: "customer-mobile", device: "mobile", step: 1, description: "Reward-led entry from a merchant QR, SMS, email, or wallet link.", ctaLabel: "Start", ctaTarget: "customer-splash", icon: Sparkles },
  { id: "customer-splash", title: "Splash", flow: "customer-mobile", device: "mobile", step: 2, description: "Premium brand intro for the PerkBack wallet.", ctaLabel: "Next", ctaTarget: "customer-onboarding", icon: Sparkles },
  { id: "customer-onboarding", title: "Onboarding", flow: "customer-mobile", device: "mobile", step: 3, description: "One loyalty wallet for favourite local places.", ctaLabel: "Create account", ctaTarget: "customer-auth", icon: Home },
  { id: "customer-auth", title: "Signup / Login", flow: "customer-mobile", device: "mobile", step: 4, description: "Short, safe customer entry with email, phone, and DOB.", ctaLabel: "View wallet", ctaTarget: "customer-home", icon: UserRound },
  { id: "customer-home", title: "Wallet Home", flow: "customer-mobile", device: "mobile", step: 5, description: "Points, tier progress, ready rewards, nearby merchants, and recent activity.", ctaLabel: "Show card", ctaTarget: "customer-card", icon: WalletCards },
  { id: "customer-card", title: "Digital Card", flow: "customer-mobile", device: "mobile", step: 6, description: "Checkout-ready QR, barcode, CRN, card number, and wallet prompt.", ctaLabel: "Rewards", ctaTarget: "customer-rewards", icon: CreditCard },
  { id: "customer-rewards", title: "Rewards", flow: "customer-mobile", device: "mobile", step: 7, description: "Ready rewards separated from keep-earning offers.", ctaLabel: "Reward detail", ctaTarget: "customer-reward-detail", icon: Gift },
  { id: "customer-reward-detail", title: "Reward Detail", flow: "customer-mobile", device: "mobile", step: 8, description: "Redeem confirmation with merchant, points cost, expiry, and code state.", ctaLabel: "Explore", ctaTarget: "customer-explore", icon: CheckCircle2 },
  { id: "customer-explore", title: "Explore", flow: "customer-mobile", device: "mobile", step: 9, description: "Nearby map/list discovery with coffee, retail, and restaurant filters.", ctaLabel: "Merchant detail", ctaTarget: "customer-merchant-detail", icon: MapPin },
  { id: "customer-merchant-detail", title: "Merchant Detail", flow: "customer-mobile", device: "mobile", step: 10, description: "Store profile, active offers, distance, and start-earning action.", ctaLabel: "Receipt", ctaTarget: "customer-receipt", icon: Store },
  { id: "customer-receipt", title: "Receipt", flow: "customer-mobile", device: "mobile", step: 11, description: "Transaction detail with points earned and item-level offers.", ctaLabel: "Profile", ctaTarget: "customer-profile", icon: ShoppingBag },
  { id: "customer-profile", title: "Profile", flow: "customer-mobile", device: "mobile", step: 12, description: "Linked merchants, notifications, wallet passes, privacy, and security.", ctaTarget: "customer-home", icon: Settings },

  { id: "merchant-tablet-counter", title: "Counter Dashboard", flow: "merchant-tablet", device: "tablet", step: 1, description: "Tablet-first counter view for staff during service.", ctaLabel: "Scan customer", ctaTarget: "merchant-tablet-scan", icon: Store },
  { id: "merchant-tablet-scan", title: "Scan Customer", flow: "merchant-tablet", device: "tablet", step: 2, description: "Camera and customer lookup for QR, CRN, card, or phone.", ctaLabel: "Add points", ctaTarget: "merchant-tablet-add-points", icon: ScanLine },
  { id: "merchant-tablet-add-points", title: "Add Points", flow: "merchant-tablet", device: "tablet", step: 3, description: "Split customer lookup and purchase calculator for quick checkout.", ctaLabel: "Confirm", ctaTarget: "merchant-tablet-confirm", icon: Gift },
  { id: "merchant-tablet-confirm", title: "Confirm Transaction", flow: "merchant-tablet", device: "tablet", step: 4, description: "Fast review before issuing points to the customer.", ctaLabel: "Success", ctaTarget: "merchant-tablet-success", icon: CheckCircle2 },
  { id: "merchant-tablet-success", title: "Transaction Success", flow: "merchant-tablet", device: "tablet", step: 5, description: "Points issued, next reward progress, and receipt confirmation.", ctaLabel: "Customer", ctaTarget: "merchant-tablet-customer", icon: Bell },
  { id: "merchant-tablet-customer", title: "Quick Profile", flow: "merchant-tablet", device: "tablet", step: 6, description: "Compact customer profile with visits, balance, and rewards.", ctaTarget: "merchant-tablet-counter", icon: Users },

  { id: "merchant-desktop-dashboard", title: "Dashboard", flow: "merchant-desktop", device: "desktop", step: 1, description: "Owner command centre with ROI, repeat customers, and next best action.", ctaLabel: "Customers", ctaTarget: "merchant-desktop-customers", icon: BarChart3 },
  { id: "merchant-desktop-customers", title: "Customers", flow: "merchant-desktop", device: "desktop", step: 2, description: "Segments for VIP, frequent, new, at-risk, dormant, and birthday customers.", ctaLabel: "Profile", ctaTarget: "merchant-desktop-customer-profile", icon: Users },
  { id: "merchant-desktop-customer-profile", title: "Customer Profile", flow: "merchant-desktop", device: "desktop", step: 3, description: "Visits, spend, points, rewards used, and campaign history.", ctaLabel: "Campaigns", ctaTarget: "merchant-desktop-campaign", icon: UserRound },
  { id: "merchant-desktop-campaign", title: "Campaign Studio", flow: "merchant-desktop", device: "desktop", step: 4, description: "Guided templates, audience selection, preview, and launch confidence.", ctaLabel: "Offers", ctaTarget: "merchant-desktop-offers", icon: Megaphone },
  { id: "merchant-desktop-offers", title: "Rewards & Offers", flow: "merchant-desktop", device: "desktop", step: 5, description: "Rewards, monthly offers, stamp cards, and redemption rules.", ctaLabel: "Analytics", ctaTarget: "merchant-desktop-analytics", icon: Gift },
  { id: "merchant-desktop-analytics", title: "Analytics", flow: "merchant-desktop", device: "desktop", step: 6, description: "Retention, ROI, customer segments, and export-ready reporting.", ctaLabel: "Settings", ctaTarget: "merchant-desktop-settings", icon: LineChart },
  { id: "merchant-desktop-settings", title: "Settings", flow: "merchant-desktop", device: "desktop", step: 7, description: "Business profile, plan, POS, NFC/QR, staff access, and notifications.", ctaTarget: "merchant-desktop-dashboard", icon: Settings },

  { id: "marketing-home", title: "Homepage", flow: "marketing-desktop", device: "desktop", step: 1, description: "Premium SaaS homepage for the local loyalty platform.", ctaLabel: "Merchant landing", ctaTarget: "marketing-merchant", icon: Sparkles },
  { id: "marketing-merchant", title: "Merchant Landing", flow: "marketing-desktop", device: "desktop", step: 2, description: "Conversion page focused on retention, ROI, and campaign automation.", ctaLabel: "Customer landing", ctaTarget: "marketing-customer", icon: Store },
  { id: "marketing-customer", title: "Customer Landing", flow: "marketing-desktop", device: "desktop", step: 3, description: "Consumer-facing value proposition for the loyalty wallet.", ctaLabel: "Pricing", ctaTarget: "marketing-pricing", icon: WalletCards },
  { id: "marketing-pricing", title: "Pricing", flow: "marketing-desktop", device: "desktop", step: 4, description: "Clear Free, Growth, and Pro plan comparison.", ctaLabel: "How it works", ctaTarget: "marketing-demo", icon: CreditCard },
  { id: "marketing-demo", title: "Demo", flow: "marketing-desktop", device: "desktop", step: 5, description: "How PerkBack connects cards, rewards, campaigns, and merchant dashboards.", ctaTarget: "marketing-home", icon: QrCode },
];

export const getPrototypeScreens = (device: PrototypeDevice, flow: PrototypeFlow) =>
  prototypeScreens.filter((screen) => screen.device === device && screen.flow === flow).sort((a, b) => a.step - b.step);

export const getPrototypeScreenById = (id: string) => prototypeScreens.find((screen) => screen.id === id);
