import { BarChart3, CheckCircle2, CreditCard, Gift, LineChart, Megaphone, Settings, ShieldCheck, Store, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DesktopDashboardPrototypeProps { screenId: string; }

const nav = [
  [BarChart3, "Dashboard"],
  [Users, "Customers"],
  [UserRound, "Profiles"],
  [Megaphone, "Campaigns"],
  [Gift, "Offers"],
  [LineChart, "Analytics"],
  [Settings, "Settings"],
] as const;

const activeIndexByScreen: Record<string, number> = {
  "merchant-desktop-dashboard": 0,
  "merchant-desktop-customers": 1,
  "merchant-desktop-customer-profile": 2,
  "merchant-desktop-campaign": 3,
  "merchant-desktop-offers": 4,
  "merchant-desktop-analytics": 5,
  "merchant-desktop-settings": 6,
};

const Shell = ({ screenId, children }: { screenId: string; children: React.ReactNode }) => (
  <div className="grid min-h-[680px] grid-cols-[16rem_1fr] bg-background">
    <aside className="border-r border-border bg-card p-5">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground"><Store className="h-5 w-5" /></div><div><span className="block font-black">Bean Society</span><span className="text-xs text-muted-foreground">Growth plan</span></div></div>
      <div className="mt-8 space-y-2">{nav.map(([Icon, label], i) => <div key={label} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold", i === activeIndexByScreen[screenId] ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Icon className="h-4 w-4" /> {label}</div>)}</div>
    </aside>
    <main className="p-8">{children}</main>
  </div>
);

const Stat = ({ label, value, delta }: { label: string; value: string; delta: string }) => <div className="rounded-2xl bg-card p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm font-bold text-success">{delta}</p></div>;
const Bars = () => <div className="flex h-56 items-end gap-3 rounded-2xl bg-muted/50 p-5">{[42, 56, 48, 80, 70, 92, 84, 98, 76, 90].map((height, index) => <span key={index} className="flex-1 rounded-t-xl bg-gradient-primary" style={{ height: `${height}%` }} />)}</div>;

const Dashboard = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div className="flex items-center justify-between"><div><p className="eyebrow">Bean Society</p><h2 className="text-4xl font-black">Today’s loyalty command centre</h2></div><Button className="rounded-full">Add points</Button></div><div className="mt-8 grid gap-4 lg:grid-cols-4"><Stat label="Customers purchased" value="42" delta="counted from sales" /><Stat label="Repeat rate" value="38%" delta="+6%" /><Stat label="Revenue tracked" value="$8.4k" delta="+18%" /><Stat label="Rewards redeemed" value="214" delta="+31" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]"><div className="rounded-2xl bg-card p-6 shadow-card"><h3 className="text-xl font-black">Repeat visits / retained revenue</h3><Bars /></div><div className="space-y-4"><div className="rounded-2xl bg-gradient-hero p-6 text-primary-foreground shadow-hero"><Megaphone className="h-6 w-6" /><h3 className="mt-5 text-2xl font-black">Double points window</h3><p className="mt-2 text-sm text-primary-foreground/75">Best action for slow afternoon trade.</p></div><div className="rounded-2xl bg-card p-6 shadow-card"><h3 className="font-black">Live activity</h3><p className="mt-3 text-sm text-muted-foreground">Mia earned 42 points · Oscar redeemed free coffee</p></div></div></div></Shell>;
const Customers = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div><p className="eyebrow">Customer CRM</p><h2 className="text-4xl font-black">Retention segments</h2></div><div className="mt-8 grid gap-4 lg:grid-cols-6">{["VIP", "Frequent", "New", "At-risk", "Dormant", "Birthday"].map((seg, i) => <div key={seg} className="rounded-2xl bg-card p-4 shadow-card"><p className="text-sm font-black">{seg}</p><p className="mt-4 text-3xl font-black">{[18, 64, 22, 41, 36, 9][i]}</p></div>)}</div><div className="mt-6 rounded-2xl bg-card p-6 shadow-card"><h3 className="text-xl font-black">Customers who purchased</h3>{["Mia Chen · Gold · 12 visits · $286 spend", "Oscar Reed · At-risk · 41 days inactive", "Ava Singh · VIP · $420 spend"].map((row) => <div key={row} className="mt-4 flex items-center justify-between rounded-2xl bg-muted p-4"><span className="font-bold">{row}</span><Button size="sm" variant="outline" className="rounded-full">Open</Button></div>)}</div></Shell>;
const CustomerProfile = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div className="grid gap-6 lg:grid-cols-[22rem_1fr]"><div className="rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-hero"><UserRound className="h-8 w-8" /><h2 className="mt-20 text-4xl font-black">Mia Chen</h2><p className="mt-2 text-primary-foreground/75">Gold · 2,840 points · CRN 48291</p></div><div className="space-y-5"><div className="grid gap-4 lg:grid-cols-4"><Stat label="Visits" value="12" delta="+3 this month" /><Stat label="Spend" value="$286" delta="+$42" /><Stat label="Rewards used" value="4" delta="+1" /><Stat label="Last visit" value="Today" delta="9:18 AM" /></div><div className="rounded-2xl bg-card p-6 shadow-card"><h3 className="text-xl font-black">Campaign history</h3>{["Double points afternoon · opened", "Birthday pastry · redeemed", "Win-back SMS · not needed"].map((item) => <p key={item} className="mt-3 rounded-xl bg-muted p-3 text-sm font-bold">{item}</p>)}</div></div></div></Shell>;
const Campaign = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div className="flex items-center justify-between"><div><p className="eyebrow">Campaign studio</p><h2 className="text-4xl font-black">Launch guided campaigns</h2></div><Button className="rounded-full">Preview SMS</Button></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{["Birthday offer", "Win-back campaign", "Double-points day", "Monthly offer", "Buy X Get Y", "Slow-day boost"].map((template) => <div key={template} className="rounded-2xl bg-card p-5 shadow-card"><Megaphone className="h-5 w-5 text-primary" /><h3 className="mt-5 text-xl font-black">{template}</h3><p className="mt-2 text-sm text-muted-foreground">Recommended audience, best send time, and predicted repeat visit lift.</p></div>)}</div><div className="mt-6 rounded-2xl bg-gradient-gold p-5 text-accent-foreground shadow-card"><p className="font-black">AI recommendation: target 41 at-risk customers with a 2–4 PM double-points window.</p></div></Shell>;
const Offers = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div><p className="eyebrow">Rewards and offers</p><h2 className="text-4xl font-black">Coffee rewards manager</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{["Free coffee after 5 visits", "Double points morning", "Monthly brews", "Birthday pastry", "Stamp card", "VIP reward"].map((offer, i) => <div key={offer} className="rounded-2xl bg-card p-5 shadow-card"><Gift className="h-6 w-6 text-accent-deep" /><h3 className="mt-6 text-xl font-black">{offer}</h3><p className="mt-2 text-sm text-muted-foreground">{i < 3 ? "Active" : "Draft"} · coffee shop default</p></div>)}</div></Shell>;
const Analytics = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div className="flex items-center justify-between"><div><p className="eyebrow">Analytics</p><h2 className="text-4xl font-black">What happened and what to do next</h2></div><Button variant="outline" className="rounded-full">Export report</Button></div><div className="mt-8 grid gap-4 lg:grid-cols-3"><Stat label="Retained revenue" value="$24.8k" delta="+21%" /><Stat label="At-risk saved" value="86" delta="+14" /><Stat label="Campaign ROI" value="4.8x" delta="+0.9x" /></div><div className="mt-6 rounded-2xl bg-card p-6 shadow-card"><h3 className="text-xl font-black">Retention trend and campaign impact</h3><Bars /></div></Shell>;
const SettingsScreen = ({ screenId }: { screenId: string }) => <Shell screenId={screenId}><div><p className="eyebrow">Settings</p><h2 className="text-4xl font-black">Stable business controls</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{[[Store, "Business profile"], [CreditCard, "Plan management"], [CheckCircle2, "POS integration"], [ShieldCheck, "NFC / QR setup"], [Users, "Staff access"], [Settings, "Notifications"]].map(([Icon, title]) => <div key={String(title)} className="rounded-2xl bg-card p-6 shadow-card"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-6 text-xl font-black">{String(title)}</h3><p className="mt-2 text-sm text-muted-foreground">Configured for Bean Society.</p></div>)}</div></Shell>;

export const DesktopDashboardPrototype = ({ screenId }: DesktopDashboardPrototypeProps) => {
  if (screenId === "merchant-desktop-customers") return <Customers screenId={screenId} />;
  if (screenId === "merchant-desktop-customer-profile") return <CustomerProfile screenId={screenId} />;
  if (screenId === "merchant-desktop-campaign") return <Campaign screenId={screenId} />;
  if (screenId === "merchant-desktop-offers") return <Offers screenId={screenId} />;
  if (screenId === "merchant-desktop-analytics") return <Analytics screenId={screenId} />;
  if (screenId === "merchant-desktop-settings") return <SettingsScreen screenId={screenId} />;
  return <Dashboard screenId={screenId} />;
};
