import { Bell, ChevronRight, Coffee, CreditCard, Gift, MapPin, QrCode, Settings, ShieldCheck, Sparkles, Star, Store, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileCustomerPrototypeProps {
  screenId: string;
}

const StatusBar = () => (
  <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-bold text-foreground">
    <span>9:41</span>
    <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm border border-foreground/40"><span className="block h-full w-3 rounded-sm bg-foreground/70" /></span></span>
  </div>
);

const PhonePage = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[760px] bg-background text-foreground">
    <StatusBar />
    {children}
  </div>
);

const BottomNav = () => (
  <div className="absolute bottom-4 left-4 right-4 rounded-full border border-border bg-card/95 p-1 shadow-floating-nav backdrop-blur-md">
    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-muted-foreground">
      {[WalletCards, Gift, Store, Settings].map((Icon, index) => (
        <div key={index} className={`flex h-11 items-center justify-center rounded-full ${index === 0 ? "bg-primary text-primary-foreground" : ""}`}><Icon className="h-4 w-4" /></div>
      ))}
    </div>
  </div>
);

const MiniQr = () => (
  <div className="grid h-20 w-20 grid-cols-5 gap-1 rounded-xl bg-card p-2 shadow-card">
    {Array.from({ length: 25 }).map((_, i) => <span key={i} className={`${[0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 23, 24].includes(i) ? "bg-primary" : "bg-muted"} rounded-[2px]`} />)}
  </div>
);

const CustomerSplash = () => (
  <PhonePage>
    <div className="relative flex min-h-[720px] flex-col items-center justify-center overflow-hidden bg-gradient-hero px-8 text-primary-foreground">
      <div className="gradient-blob h-64 w-64 bg-accent/30" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary-foreground/15 shadow-hero backdrop-blur-md"><Sparkles className="h-11 w-11" /></div>
      <h2 className="relative mt-5 text-4xl font-black">PerkBack</h2>
      <p className="relative mt-2 text-center text-sm font-medium text-primary-foreground/75">Your rewards, cards and local perks in one premium wallet.</p>
      <div className="absolute bottom-10 flex gap-2"><span className="h-2 w-8 rounded-full bg-primary-foreground" /><span className="h-2 w-2 rounded-full bg-primary-foreground/50" /></div>
    </div>
  </PhonePage>
);

const CustomerOnboarding = () => (
  <PhonePage>
    <div className="px-5 py-6">
      <div className="rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-hero">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15"><WalletCards className="h-8 w-8" /></div>
        <h2 className="mt-10 text-3xl font-black leading-tight">Earn rewards everywhere local.</h2>
        <p className="mt-3 text-sm text-primary-foreground/75">Join participating cafés, restaurants and retailers with one beautiful digital loyalty identity.</p>
      </div>
      <div className="mt-5 grid gap-3">
        {[[Gift, "Instant rewards"], [MapPin, "Nearby offers"], [ShieldCheck, "One secure card"]].map(([Icon, label]) => <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"><Icon className="h-5 w-5 text-primary" /><span className="font-bold">{String(label)}</span></div>)}
      </div>
      <Button className="mt-6 h-12 w-full rounded-full">Create my loyalty wallet</Button>
    </div>
  </PhonePage>
);

const CustomerAuth = () => (
  <PhonePage>
    <div className="px-5 py-8">
      <p className="eyebrow">Customer access</p>
      <h2 className="mt-2 text-3xl font-black">Welcome back to PerkBack</h2>
      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card"><p className="text-xs text-muted-foreground">Email</p><p className="font-bold">mia@example.com</p></div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card"><p className="text-xs text-muted-foreground">Date of birth</p><p className="font-bold">•• / •• / ••••</p></div>
      </div>
      <Button className="mt-6 h-12 w-full rounded-full">View my wallet</Button>
      <p className="mt-4 text-center text-sm text-muted-foreground">New here? Create a customer account</p>
    </div>
  </PhonePage>
);

const CustomerHome = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Good morning</p><h2 className="text-2xl font-black">Mia Chen</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card"><Bell className="h-5 w-5" /></div></div>
      <div className="mt-5 rounded-[2rem] bg-gradient-hero p-5 text-primary-foreground shadow-hero">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/70">Total points</p>
        <div className="mt-2 flex items-end justify-between"><span className="text-5xl font-black">2,840</span><span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">Gold</span></div>
        <div className="mt-5 h-2 rounded-full bg-primary-foreground/20"><div className="h-2 w-3/4 rounded-full bg-accent" /></div>
        <p className="mt-2 text-xs text-primary-foreground/70">160 points until your next reward</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-card p-4 shadow-card"><Gift className="h-5 w-5 text-accent-deep" /><p className="mt-3 text-2xl font-black">7</p><p className="text-xs text-muted-foreground">Ready offers</p></div><div className="rounded-2xl bg-card p-4 shadow-card"><Store className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-black">12</p><p className="text-xs text-muted-foreground">Local stores</p></div></div>
      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card"><div className="flex items-center justify-between"><div><p className="font-black">Morning coffee streak</p><p className="text-xs text-muted-foreground">3 of 5 visits complete</p></div><Coffee className="h-5 w-5 text-warm-orange" /></div></div>
      <BottomNav />
    </div>
  </PhonePage>
);

const CustomerCard = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5">
      <p className="eyebrow">Digital loyalty card</p><h2 className="mt-1 text-2xl font-black">Tap, scan, earn</h2>
      <div className="mt-5 rounded-[2rem] bg-gradient-hero p-5 text-primary-foreground shadow-hero">
        <div className="flex items-center justify-between"><CreditCard className="h-8 w-8" /><span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">CRN 48291</span></div>
        <p className="mt-14 text-sm text-primary-foreground/70">Mia Chen</p><p className="font-mono text-xl font-black tracking-widest">8429 1048 72</p>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-card p-5 shadow-card"><div><p className="font-black">Scan at checkout</p><p className="text-xs text-muted-foreground">QR + barcode identity</p></div><MiniQr /></div>
      <div className="mt-4 h-16 rounded-2xl bg-card p-3 shadow-card"><div className="flex h-full items-end gap-1">{Array.from({ length: 28 }).map((_, i) => <span key={i} className="w-1 rounded-sm bg-foreground" style={{ height: `${18 + (i % 5) * 7}px` }} />)}</div></div>
      <BottomNav />
    </div>
  </PhonePage>
);

const CustomerRewards = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Rewards</p><h2 className="mt-1 text-2xl font-black">Ready to redeem</h2><div className="mt-5 space-y-3">{[["Free coffee", "Bean Society", "450 pts"], ["$10 retail perk", "Local Thread", "900 pts"], ["Dessert upgrade", "Osteria Lane", "650 pts"]].map(([title, store, pts]) => <div key={title} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold"><Gift className="h-5 w-5 text-accent-foreground" /></div><div><p className="font-black">{title}</p><p className="text-xs text-muted-foreground">{store}</p></div></div><span className="text-xs font-black text-primary">{pts}</span></div>)}</div><BottomNav /></div>
  </PhonePage>
);

const CustomerExplore = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Explore nearby</p><h2 className="mt-1 text-2xl font-black">Local perks around you</h2><div className="mt-5 h-44 rounded-[2rem] bg-gradient-to-br from-muted to-card p-4 shadow-card"><div className="relative h-full rounded-2xl bg-background"><MapPin className="absolute left-24 top-12 h-7 w-7 text-primary" /><MapPin className="absolute right-16 top-20 h-6 w-6 text-accent-deep" /><MapPin className="absolute bottom-8 left-16 h-6 w-6 text-success" /></div></div><div className="mt-4 space-y-3">{["Bean Society · 120m", "Local Thread · 310m", "Osteria Lane · 480m"].map((label) => <div key={label} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><span className="font-bold">{label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}</div><BottomNav /></div>
  </PhonePage>
);

const CustomerReceipt = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Receipt</p><h2 className="mt-1 text-2xl font-black">Bean Society</h2><div className="mt-5 rounded-2xl bg-card p-5 shadow-card"><div className="flex items-center justify-between"><p className="font-black">Today, 9:18 AM</p><span className="rounded-full bg-success/15 px-3 py-1 text-xs font-black text-success">+42 pts</span></div><div className="mt-5 space-y-3 text-sm">{[["Flat white", "$5.50"], ["Banana bread", "$6.00"], ["Reward boost", "+12 pts"]].map(([a, b]) => <div key={a} className="flex justify-between border-b border-border pb-2"><span>{a}</span><span className="font-bold">{b}</span></div>)}</div><div className="mt-5 flex justify-between text-lg font-black"><span>Total</span><span>$11.50</span></div></div><BottomNav /></div>
  </PhonePage>
);

const CustomerProfile = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground"><Star className="h-8 w-8" /></div><div><h2 className="text-2xl font-black">Mia Chen</h2><p className="text-sm text-muted-foreground">Gold member · 2,840 pts</p></div></div><div className="mt-6 space-y-3">{["Wallet passes", "Notification preferences", "Account security", "Linked merchants"].map((item) => <div key={item} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><span className="font-bold">{item}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}</div><BottomNav /></div>
  </PhonePage>
);

export const MobileCustomerPrototype = ({ screenId }: MobileCustomerPrototypeProps) => {
  const screens: Record<string, JSX.Element> = {
    "customer-splash": <CustomerSplash />,
    "customer-onboarding": <CustomerOnboarding />,
    "customer-auth": <CustomerAuth />,
    "customer-home": <CustomerHome />,
    "customer-card": <CustomerCard />,
    "customer-rewards": <CustomerRewards />,
    "customer-explore": <CustomerExplore />,
    "customer-receipt": <CustomerReceipt />,
    "customer-profile": <CustomerProfile />,
  };
  return screens[screenId] ?? screens["customer-home"];
};
