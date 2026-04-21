import { Bell, CheckCircle2, ChevronRight, Coffee, CreditCard, Gift, Heart, MapPin, QrCode, Search, Settings, ShieldCheck, Sparkles, Star, Store, Ticket, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileCustomerPrototypeProps {
  screenId: string;
}

const navItems = [
  { key: "wallet", icon: WalletCards },
  { key: "rewards", icon: Gift },
  { key: "explore", icon: Store },
  { key: "profile", icon: Settings },
];

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

const BottomNav = ({ active = "wallet" }: { active?: string }) => (
  <div className="absolute bottom-4 left-4 right-4 rounded-full border border-border bg-card/95 p-1 shadow-floating-nav backdrop-blur-md">
    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-muted-foreground">
      {navItems.map(({ key, icon: Icon }) => (
        <div key={key} className={cn("flex h-11 items-center justify-center rounded-full", active === key ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Icon className="h-4 w-4" /></div>
      ))}
    </div>
  </div>
);

const MiniQr = () => (
  <div className="grid h-24 w-24 grid-cols-5 gap-1 rounded-2xl bg-card p-2 shadow-card">
    {Array.from({ length: 25 }).map((_, i) => <span key={i} className={cn("rounded-[2px]", [0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 23, 24].includes(i) ? "bg-primary" : "bg-muted")} />)}
  </div>
);

const CustomerInvite = () => (
  <PhonePage>
    <div className="flex min-h-[720px] flex-col px-5 pb-6 pt-5">
      <div className="rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-hero">
        <div className="flex items-center justify-between"><span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-black">Bean Society invite</span><Coffee className="h-6 w-6" /></div>
        <h2 className="mt-20 text-4xl font-black leading-tight">Claim your first local perk.</h2>
        <p className="mt-3 text-sm text-primary-foreground/75">Join PerkBack from this store and keep every reward in one wallet.</p>
      </div>
      <div className="mt-5 grid gap-3">
        {["Start earning today", "Use one card at participating stores", "Unlock nearby rewards"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"><CheckCircle2 className="h-5 w-5 text-success" /><span className="font-bold">{item}</span></div>)}
      </div>
      <Button className="mt-auto h-12 rounded-full">Open PerkBack</Button>
    </div>
  </PhonePage>
);

const CustomerSplash = () => (
  <PhonePage>
    <div className="relative flex min-h-[720px] flex-col items-center justify-center overflow-hidden bg-gradient-hero px-8 text-primary-foreground">
      <div className="gradient-blob h-64 w-64 bg-accent/30" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary-foreground/15 shadow-hero backdrop-blur-md"><Sparkles className="h-11 w-11" /></div>
      <h2 className="relative mt-5 text-4xl font-black">PerkBack</h2>
      <p className="relative mt-2 text-center text-sm font-medium text-primary-foreground/75">One loyalty wallet for your favourite local places.</p>
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
        <p className="mt-3 text-sm text-primary-foreground/75">Cards, points, offers and receipts from cafés, retailers and restaurants in one simple wallet.</p>
      </div>
      <div className="mt-5 grid gap-3">
        {[[Gift, "Instant rewards"], [MapPin, "Nearby offers"], [ShieldCheck, "One secure identity"]].map(([Icon, label]) => <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"><Icon className="h-5 w-5 text-primary" /><span className="font-bold">{String(label)}</span></div>)}
      </div>
      <Button className="mt-6 h-12 w-full rounded-full">Create my loyalty wallet</Button>
    </div>
  </PhonePage>
);

const CustomerAuth = () => (
  <PhonePage>
    <div className="px-5 py-8">
      <p className="eyebrow">Customer access</p>
      <h2 className="mt-2 text-3xl font-black">Create your wallet</h2>
      <div className="mt-6 rounded-2xl bg-card p-4 shadow-card"><p className="text-sm font-bold">Step 1 of 2</p><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 w-1/2 rounded-full bg-primary" /></div></div>
      <div className="mt-4 space-y-3">
        {["Full name", "Email", "Phone", "Date of birth"].map((label, i) => <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card"><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold">{i === 0 ? "Mia Chen" : i === 1 ? "mia@example.com" : i === 2 ? "+61 412 345 678" : "•• / •• / ••••"}</p></div>)}
      </div>
      <Button className="mt-6 h-12 w-full rounded-full">View my wallet</Button>
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
      <BottomNav active="wallet" />
    </div>
  </PhonePage>
);

const CustomerCard = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5">
      <p className="eyebrow">Digital loyalty card</p><h2 className="mt-1 text-2xl font-black">Ready at checkout</h2>
      <div className="mt-5 rounded-[2rem] bg-gradient-hero p-5 text-primary-foreground shadow-hero">
        <div className="flex items-center justify-between"><CreditCard className="h-8 w-8" /><span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">CRN 48291</span></div>
        <p className="mt-12 text-sm text-primary-foreground/70">Mia Chen</p><p className="font-mono text-xl font-black tracking-widest">8429 1048 72</p>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-card p-5 shadow-card"><div><p className="font-black">Scan to earn</p><p className="text-xs text-muted-foreground">Works at participating stores</p></div><MiniQr /></div>
      <div className="mt-4 h-16 rounded-2xl bg-card p-3 shadow-card"><div className="flex h-full items-end gap-1">{Array.from({ length: 28 }).map((_, i) => <span key={i} className="w-1 rounded-sm bg-foreground" style={{ height: `${18 + (i % 5) * 7}px` }} />)}</div></div>
      <Button variant="outline" className="mt-4 h-11 w-full rounded-full"><WalletCards className="h-4 w-4" /> Add to wallet</Button>
      <BottomNav active="wallet" />
    </div>
  </PhonePage>
);

const CustomerRewards = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Rewards</p><h2 className="mt-1 text-2xl font-black">Ready to redeem</h2><div className="mt-5 space-y-3">{[["Free coffee", "Bean Society", "450 pts", true], ["$10 retail perk", "Local Thread", "900 pts", true], ["Dessert upgrade", "Osteria Lane", "650 pts", false]].map(([title, store, pts, ready]) => <div key={String(title)} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold"><Gift className="h-5 w-5 text-accent-foreground" /></div><div><p className="font-black">{String(title)}</p><p className="text-xs text-muted-foreground">{String(store)}</p></div></div><span className={cn("text-xs font-black", ready ? "text-success" : "text-primary")}>{String(pts)}</span></div>)}</div><BottomNav active="rewards" /></div>
  </PhonePage>
);

const RewardDetail = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5">
      <div className="rounded-[2rem] bg-gradient-gold p-5 text-accent-foreground shadow-hero"><Ticket className="h-8 w-8" /><h2 className="mt-16 text-3xl font-black">Free coffee</h2><p className="mt-2 text-sm font-bold opacity-80">Bean Society · 450 points · expires Friday</p></div>
      <div className="mt-5 rounded-2xl bg-card p-5 shadow-card"><p className="font-black">Redeem code</p><p className="mt-2 text-sm text-muted-foreground">Show this at checkout after staff confirms your purchase.</p><div className="mt-4 rounded-2xl bg-muted p-4 text-center font-mono text-2xl font-black tracking-widest">PB-4821</div></div>
      <Button className="mt-4 h-12 w-full rounded-full">Confirm redemption</Button>
      <BottomNav active="rewards" />
    </div>
  </PhonePage>
);

const CustomerExplore = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Explore nearby</p><h2 className="mt-1 text-2xl font-black">Local perks around you</h2><div className="mt-4 flex items-center gap-2 rounded-full bg-card px-4 py-3 shadow-card"><Search className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Coffee, retail, restaurants</span></div><div className="mt-4 flex gap-2 text-xs font-bold">{["Coffee", "Retail", "Restaurant"].map((chip, i) => <span key={chip} className={cn("rounded-full px-3 py-2", i === 0 ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card")}>{chip}</span>)}</div><div className="mt-5 h-40 rounded-[2rem] bg-gradient-to-br from-muted to-card p-4 shadow-card"><div className="relative h-full rounded-2xl bg-background"><MapPin className="absolute left-24 top-10 h-7 w-7 text-primary" /><MapPin className="absolute right-16 top-16 h-6 w-6 text-accent-deep" /><MapPin className="absolute bottom-8 left-16 h-6 w-6 text-success" /></div></div><div className="mt-4 space-y-3">{["Bean Society · 120m · Free coffee", "Local Thread · 310m · $10 perk", "Osteria Lane · 480m · Dessert offer"].map((label) => <div key={label} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><span className="text-sm font-bold">{label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}</div><BottomNav active="explore" /></div>
  </PhonePage>
);

const MerchantDetail = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><div className="rounded-[2rem] bg-gradient-hero p-5 text-primary-foreground shadow-hero"><Coffee className="h-8 w-8" /><h2 className="mt-16 text-3xl font-black">Bean Society</h2><p className="mt-2 text-sm text-primary-foreground/75">120m away · Coffee Shop · 8 active perks</p></div><div className="mt-5 grid gap-3">{["Free coffee after 5 visits", "Double points 2–4 PM", "Birthday pastry reward"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"><Heart className="h-5 w-5 text-accent-deep" /><span className="font-bold">{item}</span></div>)}</div><Button className="mt-5 h-12 w-full rounded-full">Start earning here</Button><BottomNav active="explore" /></div>
  </PhonePage>
);

const CustomerReceipt = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><p className="eyebrow">Receipt</p><h2 className="mt-1 text-2xl font-black">Bean Society</h2><div className="mt-5 rounded-2xl bg-card p-5 shadow-card"><div className="flex items-center justify-between"><p className="font-black">Today, 9:18 AM</p><span className="rounded-full bg-success/15 px-3 py-1 text-xs font-black text-success">+42 pts</span></div><div className="mt-5 space-y-3 text-sm">{[["Flat white", "$5.50"], ["Banana bread", "$6.00"], ["Reward boost", "+12 pts"]].map(([a, b]) => <div key={a} className="flex justify-between border-b border-border pb-2"><span>{a}</span><span className="font-bold">{b}</span></div>)}</div><div className="mt-5 flex justify-between text-lg font-black"><span>Total</span><span>$11.50</span></div></div><div className="mt-4 rounded-2xl bg-gradient-gold p-4 text-accent-foreground shadow-card"><p className="font-black">160 points until your next reward</p></div><BottomNav active="wallet" /></div>
  </PhonePage>
);

const CustomerProfile = () => (
  <PhonePage>
    <div className="relative min-h-[720px] px-5 pb-24 pt-5"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground"><Star className="h-8 w-8" /></div><div><h2 className="text-2xl font-black">Mia Chen</h2><p className="text-sm text-muted-foreground">Gold member · 2,840 pts</p></div></div><div className="mt-6 space-y-3">{["Wallet passes", "Notification preferences", "Account security", "Linked merchants", "Privacy controls"].map((item) => <div key={item} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"><span className="font-bold">{item}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}</div><BottomNav active="profile" /></div>
  </PhonePage>
);

export const MobileCustomerPrototype = ({ screenId }: MobileCustomerPrototypeProps) => {
  const screens: Record<string, JSX.Element> = {
    "customer-invite": <CustomerInvite />,
    "customer-splash": <CustomerSplash />,
    "customer-onboarding": <CustomerOnboarding />,
    "customer-auth": <CustomerAuth />,
    "customer-home": <CustomerHome />,
    "customer-card": <CustomerCard />,
    "customer-rewards": <CustomerRewards />,
    "customer-reward-detail": <RewardDetail />,
    "customer-explore": <CustomerExplore />,
    "customer-merchant-detail": <MerchantDetail />,
    "customer-receipt": <CustomerReceipt />,
    "customer-profile": <CustomerProfile />,
  };
  return screens[screenId] ?? screens["customer-home"];
};
