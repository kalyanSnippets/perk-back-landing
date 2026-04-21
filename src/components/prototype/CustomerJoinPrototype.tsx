import { ArrowRight, Check, ChevronRight, CreditCard, Gift, MapPin, QrCode, ScanLine, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import perkbackLogo from "@/assets/perkback-logo-224.webp";
import merchantHero from "@/assets/prototype/merchant-welcome-hero.jpg";
import merchantLogo from "@/assets/prototype/merchant-logo-bean-society.png";
import slideScan from "@/assets/prototype/onboarding-scan.jpg";
import slideRewards from "@/assets/prototype/onboarding-rewards.jpg";
import slideDiscover from "@/assets/prototype/onboarding-discover.jpg";

interface Props {
  screenId: string;
}

const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div className={cn("flex items-center justify-between px-5 pt-3 text-[11px] font-bold", dark ? "text-primary-foreground" : "text-foreground")}>
    <span>9:41</span>
    <span className="flex items-center gap-1">
      <span className={cn("h-2 w-4 rounded-sm border", dark ? "border-primary-foreground/40" : "border-foreground/40")}>
        <span className={cn("block h-full w-3 rounded-sm", dark ? "bg-primary-foreground/70" : "bg-foreground/70")} />
      </span>
    </span>
  </div>
);

const Page = ({ children, dark = false, className }: { children: React.ReactNode; dark?: boolean; className?: string }) => (
  <div className={cn("min-h-[760px]", dark ? "bg-primary text-primary-foreground" : "bg-background text-foreground", className)}>
    <StatusBar dark={dark} />
    {children}
  </div>
);

// Decorative QR rendered as a CSS grid
const FakeQR = ({ size = 180, light = false }: { size?: number; light?: boolean }) => (
  <div
    className={cn("grid grid-cols-9 gap-[2px] rounded-2xl p-3 shadow-card", light ? "bg-primary-foreground" : "bg-card")}
    style={{ width: size, height: size }}
  >
    {Array.from({ length: 81 }).map((_, i) => {
      const corners = [0, 1, 2, 8, 9, 10, 16, 17, 18, 6, 7, 14, 15, 22, 23, 54, 55, 56, 62, 63, 64, 70, 71, 72];
      const noise = (i * 31) % 7 < 3;
      const filled = corners.includes(i) || noise;
      return <span key={i} className={cn("rounded-[1px]", filled ? "bg-foreground" : "bg-transparent")} />;
    })}
  </div>
);

/* ───────── Screen 1: QR poster (counter-top sign) ───────── */
const QrPoster = () => (
  <Page>
    <div className="flex min-h-[720px] flex-col items-center justify-center px-6">
      <div className="w-full rounded-[2rem] border-2 border-dashed border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-hero">
          <img src={perkbackLogo} alt="PerkBack" className="h-7 w-7" />
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">PerkBack</p>
        <h2 className="mt-2 text-xl font-black leading-tight">Earn rewards at<br />Bean Society</h2>
        <div className="mt-5 flex justify-center"><FakeQR size={170} /></div>
        <p className="mt-4 text-sm font-bold text-foreground">Scan to join</p>
        <p className="mt-1 text-xs text-muted-foreground">One wallet. Every local perk.</p>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Counter-top sign at the merchant store</p>
    </div>
  </Page>
);

/* ───────── Screen 2: Splash ───────── */
const Splash = () => (
  <div className="relative min-h-[760px] overflow-hidden bg-gradient-hero">
    <StatusBar dark />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground">
      <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary-foreground/10 shadow-hero backdrop-blur-md animate-pop-in">
        <img src={perkbackLogo} alt="PerkBack" className="h-16 w-16" />
      </div>
      <h2 className="mt-5 text-3xl font-black tracking-tight">PerkBack</h2>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/70">One wallet. Every local perk.</p>
    </div>
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
    </div>
  </div>
);

/* ───────── Screen 3: Merchant welcome ───────── */
const MerchantWelcome = () => (
  <Page>
    <div className="flex min-h-[720px] flex-col px-5 pb-6 pt-4">
      <div className="overflow-hidden rounded-[2rem] shadow-hero">
        <div className="relative h-44">
          <img src={merchantHero} alt="Bean Society storefront" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute -bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-2xl bg-card shadow-card">
            <img src={merchantLogo} alt="Bean Society" className="h-12 w-12 object-contain" />
          </div>
        </div>
        <div className="bg-card px-5 pb-5 pt-10 text-center">
          <p className="eyebrow">Coffee shop · 120m away</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">Welcome to<br />Bean Society</h2>
          <p className="mt-3 text-sm text-muted-foreground">Join PerkBack to earn rewards here and at every participating local store.</p>
        </div>
      </div>
      <div className="mt-auto pt-6">
        <Button variant="hero" size="lg" className="w-full">Get started <ArrowRight className="h-4 w-4" /></Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Already have an account? <span className="font-bold text-foreground">Sign in</span></p>
      </div>
    </div>
  </Page>
);

/* ───────── Screens 4–6: Onboarding ───────── */
const OnboardingSlide = ({ image, alt, eyebrow, title, body, dot }: { image: string; alt: string; eyebrow: string; title: string; body: string; dot: 0 | 1 | 2 }) => (
  <Page>
    <div className="flex min-h-[720px] flex-col px-5 pb-6 pt-3">
      <div className="flex justify-end">
        <span className="text-sm font-bold text-muted-foreground">Skip</span>
      </div>
      <div className="mt-2 overflow-hidden rounded-[2rem] shadow-card">
        <img src={image} alt={alt} className="h-64 w-full object-cover" loading="lazy" />
      </div>
      <div className="mt-6 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-all", i === dot ? "w-8 bg-primary" : "w-1.5 bg-border")} />
        ))}
      </div>
      <div className="mt-auto pt-6">
        <Button variant="hero" size="lg" className="w-full">{dot === 2 ? "Create my wallet" : "Continue"} <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  </Page>
);

/* ───────── Screen 7: Quick questions ───────── */
const QuickQuestions = () => (
  <Page>
    <div className="px-5 pb-6 pt-5">
      <p className="eyebrow">Step 1 of 2</p>
      <h2 className="mt-2 text-2xl font-black">Tell us a bit about you</h2>
      <div className="mt-5 space-y-3">
        {[
          { label: "First name", value: "Jane" },
          { label: "Mobile number", value: "+61 412 345 678" },
          { label: "Date of birth", value: "14 / 06 / 1994" },
        ].map((f) => (
          <div key={f.label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</p>
            <p className="mt-1 text-base font-bold">{f.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <span className="font-bold text-foreground">Why we ask:</span> birthday rewards and SMS receipts from your favourite stores.
      </div>
      <Button variant="hero" size="lg" className="mt-6 w-full">Continue <ChevronRight className="h-4 w-4" /></Button>
    </div>
  </Page>
);

/* ───────── Screen 8: Create wallet ───────── */
const CreateWallet = () => (
  <Page>
    <div className="px-5 pb-6 pt-5">
      <p className="eyebrow">Step 2 of 2</p>
      <h2 className="mt-2 text-2xl font-black">Create your wallet</h2>
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="mt-1 text-base font-bold">jane@example.com</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</p>
          <p className="mt-1 text-base font-bold tracking-widest">••••••••••</p>
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-4 w-4 items-center justify-center rounded border border-primary bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></span>
        I agree to the <span className="font-bold text-foreground">Terms</span> and <span className="font-bold text-foreground">Privacy Policy</span>
      </label>
      <Button variant="hero" size="lg" className="mt-5 w-full">Create wallet</Button>
      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-2">
        <Button variant="outline" size="lg" className="w-full">Continue with Google</Button>
        <Button variant="outline" size="lg" className="w-full">Continue with Apple</Button>
      </div>
    </div>
  </Page>
);

/* ───────── Screen 9: Card ready celebration ───────── */
const CardReady = () => (
  <div className="relative min-h-[760px] overflow-hidden bg-gradient-hero">
    <StatusBar dark />
    <div className="flex min-h-[720px] flex-col px-5 pb-6 pt-6 text-primary-foreground">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur-md">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-3xl font-black leading-tight">Your wallet<br />is ready</h2>
      </div>
      <div className="mt-6 rounded-[2rem] bg-primary-foreground/10 p-5 backdrop-blur-md shadow-hero">
        <div className="flex items-center justify-between">
          <CreditCard className="h-7 w-7" />
          <img src={perkbackLogo} alt="PerkBack" className="h-7 w-7 opacity-90" />
        </div>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Cardholder</p>
        <p className="text-xl font-black">Jane Smith</p>
        <div className="mt-4 flex justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">CRN</p>
            <p className="font-mono text-base font-black">82914</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">Card no.</p>
            <p className="font-mono text-base font-black">1029 3847 56</p>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-primary-foreground/10 p-4 text-center backdrop-blur-md">
        <p className="text-sm">You're now earning at <span className="font-black">Bean Society</span></p>
      </div>
      <div className="mt-auto pt-6 space-y-2">
        <Button variant="gold" size="lg" className="w-full">Open my wallet <ArrowRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="lg" className="w-full bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
          <WalletCards className="h-4 w-4" /> Add to Apple / Google Wallet
        </Button>
      </div>
    </div>
  </div>
);

/* ───────── Screen 10: Wallet home preview ───────── */
const WalletHome = () => (
  <Page>
    <div className="px-5 pb-24 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Good morning</p>
          <h2 className="text-2xl font-black">Jane</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card">
          <img src={perkbackLogo} alt="PerkBack" className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 rounded-[2rem] bg-gradient-hero p-5 text-primary-foreground shadow-hero">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Total points</p>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-5xl font-black">120</span>
          <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-black text-accent-foreground">NEW</span>
        </div>
        <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-3 text-sm font-bold backdrop-blur-md">
          <ScanLine className="h-4 w-4" /> Tap to pay
        </button>
      </div>
      <p className="eyebrow mt-5">Your stores</p>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted"><img src={merchantLogo} alt="" className="h-9 w-9 object-contain" /></div>
        <div className="flex-1"><p className="font-black">Bean Society</p><p className="text-xs text-muted-foreground">120 pts · Joined today</p></div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-gold p-4 text-accent-foreground shadow-card">
        <Gift className="h-5 w-5" />
        <p className="mt-2 font-black">330 points until your first free coffee</p>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-full border border-border bg-card/95 p-1 shadow-floating-nav backdrop-blur-md">
        <div className="grid grid-cols-4 gap-1">
          {[WalletCards, CreditCard, Gift, MapPin].map((Icon, i) => (
            <div key={i} className={cn("flex h-11 items-center justify-center rounded-full", i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </Page>
);

export const CustomerJoinPrototype = ({ screenId }: Props) => {
  const screens: Record<string, JSX.Element> = {
    "join-qr-poster": <QrPoster />,
    "join-splash": <Splash />,
    "join-merchant-welcome": <MerchantWelcome />,
    "join-onboarding-1": <OnboardingSlide image={slideScan} alt="Scan QR at counter" eyebrow="Show your card" title="Scan once, earn forever" body="Open your PerkBack wallet at checkout — staff scans your QR in seconds." dot={0} />,
    "join-onboarding-2": <OnboardingSlide image={slideRewards} alt="Coffee reward" eyebrow="Real rewards" title="Free coffees, perks & treats" body="Every purchase moves you closer to rewards from your favourite local places." dot={1} />,
    "join-onboarding-3": <OnboardingSlide image={slideDiscover} alt="Local map" eyebrow="Discover" title="Find perks near you" body="Browse local stores nearby and unlock new offers wherever you go." dot={2} />,
    "join-quick-questions": <QuickQuestions />,
    "join-create-wallet": <CreateWallet />,
    "join-card-ready": <CardReady />,
    "join-wallet-home": <WalletHome />,
  };
  return screens[screenId] ?? screens["join-qr-poster"];
};
