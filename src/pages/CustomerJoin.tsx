import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, CreditCard, Gift, Loader2, MapPin, ScanLine, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import perkbackLogo from "@/assets/perkback-logo-224.webp";
import merchantHero from "@/assets/prototype/merchant-welcome-hero.jpg";
import slideScan from "@/assets/prototype/onboarding-scan.jpg";
import slideRewards from "@/assets/prototype/onboarding-rewards.jpg";
import slideDiscover from "@/assets/prototype/onboarding-discover.jpg";

type Step =
  | "splash"
  | "welcome"
  | "onboarding"
  | "questions"
  | "wallet"
  | "ready";

interface MerchantInfo {
  id: string;
  store_name: string;
  logo_url: string | null;
  industry_type: string | null;
  address: string | null;
}

interface CardIdentity {
  crn: string;
  loyalty_card_number: string;
  full_name: string | null;
  merchant_name: string;
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  phone: z.string().trim().min(6, "Mobile number is required").max(20),
  dob: z.string().min(1, "Date of birth is required"),
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

/* ───────── Mobile frame (centered on desktop) ───────── */
const MobileFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-muted/30 flex items-stretch justify-center">
    <div className="w-full max-w-[420px] min-h-screen bg-background shadow-floating-nav flex flex-col">
      {children}
    </div>
  </div>
);

/* ───────── Splash ───────── */
const Splash = () => (
  <div className="flex-1 bg-gradient-hero flex flex-col items-center justify-center text-primary-foreground">
    <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary-foreground/10 backdrop-blur-md shadow-hero animate-pop-in">
      <img src={perkbackLogo} alt="PerkBack" className="h-16 w-16" />
    </div>
    <h1 className="mt-5 text-3xl font-black tracking-tight">PerkBack</h1>
    <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/70">
      One wallet · every local perk
    </p>
    <div className="mt-10 flex gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
    </div>
  </div>
);

/* ───────── Welcome ───────── */
const Welcome = ({ merchant, onJoin, onSignIn }: { merchant: MerchantInfo; onJoin: () => void; onSignIn: () => void }) => (
  <div className="flex-1 flex flex-col px-5 pb-8 pt-6">
    <div className="overflow-hidden rounded-[2rem] shadow-hero">
      <div className="relative h-44">
        <img src={merchantHero} alt={merchant.store_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute -bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-2xl bg-card shadow-card overflow-hidden">
          {merchant.logo_url ? (
            <img src={merchant.logo_url} alt={merchant.store_name} className="h-12 w-12 object-contain" />
          ) : (
            <span className="text-xl font-black text-primary">
              {merchant.store_name.charAt(0)}
            </span>
          )}
        </div>
      </div>
      <div className="bg-card px-5 pb-5 pt-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {merchant.industry_type ?? "Local merchant"}
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          Welcome to<br />{merchant.store_name}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Join PerkBack to start earning here — and at every local store on the network.
        </p>
      </div>
    </div>
    <div className="mt-auto pt-6 space-y-3">
      <Button variant="hero" size="lg" className="w-full" onClick={onJoin}>
        Join now <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Already on PerkBack?{" "}
        <button onClick={onSignIn} className="font-bold text-foreground underline-offset-4 hover:underline">
          Sign in
        </button>
      </p>
    </div>
  </div>
);

/* ───────── Onboarding ───────── */
const ONBOARDING_SLIDES = [
  { image: slideScan, eyebrow: "SHOW YOUR CARD", title: "Scan once, earn every time", body: "Open your wallet at the counter — staff scans your code and your points land instantly." },
  { image: slideRewards, eyebrow: "REAL REWARDS", title: "Free coffees, perks and treats", body: "Every visit moves you closer to rewards from the local places you already love." },
  { image: slideDiscover, eyebrow: "DISCOVER", title: "Find new perks nearby", body: "See live offers from cafés, restaurants and shops around you — wherever you are." },
];

const Onboarding = ({ onDone }: { onDone: () => void }) => {
  const [i, setI] = useState(0);
  const slide = ONBOARDING_SLIDES[i];
  const isLast = i === ONBOARDING_SLIDES.length - 1;
  return (
    <div className="flex-1 flex flex-col px-5 pb-8 pt-4">
      <div className="flex justify-end">
        <button onClick={onDone} className="text-sm font-bold text-muted-foreground hover:text-foreground">
          Skip
        </button>
      </div>
      <div className="mt-2 overflow-hidden rounded-[2rem] shadow-card">
        <img src={slide.image} alt="" className="h-64 w-full object-cover" />
      </div>
      <div className="mt-6 text-center animate-fade-in-up" key={i}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{slide.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">{slide.title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{slide.body}</p>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {ONBOARDING_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-8 bg-primary" : "w-1.5 bg-border")}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
      <div className="mt-auto pt-6">
        <Button variant="hero" size="lg" className="w-full" onClick={() => (isLast ? onDone() : setI(i + 1))}>
          {isLast ? "Create my wallet" : "Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/* ───────── Quick Questions ───────── */
const QuickQuestions = ({ initial, onContinue }: { initial: { firstName: string; phone: string; dob: string }; onContinue: (v: { firstName: string; phone: string; dob: string }) => void }) => {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [phone, setPhone] = useState(initial.phone);
  const [dob, setDob] = useState(initial.dob);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ firstName, phone, dob });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    onContinue(parsed.data);
  };

  return (
    <form onSubmit={submit} className="flex-1 flex flex-col px-5 pb-8 pt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step 1 of 2</p>
      <h2 className="mt-2 text-2xl font-black">A few quick details</h2>
      <p className="mt-1 text-sm text-muted-foreground">We use these to power your birthday rewards and SMS receipts.</p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" autoComplete="given-name" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 412 345 678" autoComplete="tel" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1.5" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <span className="font-bold text-foreground">Why we ask</span> — your birthday unlocks free perks, and your mobile keeps your receipts safe.
      </div>

      <div className="mt-auto pt-6">
        <Button type="submit" variant="hero" size="lg" className="w-full">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

/* ───────── Create Wallet ───────── */
const CreateWallet = ({ profile, merchantSlug, onCreated }: {
  profile: { firstName: string; phone: string; dob: string };
  merchantSlug: string;
  onCreated: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/join/${merchantSlug}`,
          data: {
            full_name: profile.firstName,
            phone: profile.phone,
            date_of_birth: profile.dob,
          },
        },
      });
      if (error) throw error;
      toast.success("Wallet created — welcome to PerkBack");
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create wallet");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/join/${merchantSlug}`,
    });
    if (result.error) toast.error("Could not start sign-in");
  };

  return (
    <form onSubmit={submit} className="flex-1 flex flex-col px-5 pb-8 pt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 2</p>
      <h2 className="mt-2 text-2xl font-black">Create your PerkBack wallet</h2>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Create a password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className="mt-1.5" />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span>
          I agree to PerkBack's{" "}
          <a href="/privacy" target="_blank" className="font-bold text-foreground underline-offset-4 hover:underline">Terms</a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="font-bold text-foreground underline-offset-4 hover:underline">Privacy Policy</a>.
        </span>
      </label>

      <Button type="submit" variant="hero" size="lg" className="mt-5 w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating wallet…</> : "Create my wallet"}
      </Button>

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => oauth("google")}>Continue with Google</Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => oauth("apple")}>Continue with Apple</Button>
      </div>
    </form>
  );
};

/* ───────── Card Ready ───────── */
const CardReady = ({ identity, onOpen }: { identity: CardIdentity; onOpen: () => void }) => (
  <div className="flex-1 bg-gradient-hero flex flex-col px-5 pb-8 pt-8 text-primary-foreground">
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur-md animate-pop-in">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-3xl font-black leading-tight">Your wallet<br />is ready</h2>
      <p className="mt-2 text-sm text-primary-foreground/80">
        Welcome to PerkBack{identity.full_name ? `, ${identity.full_name.split(" ")[0]}` : ""}.
      </p>
    </div>

    <div className="mt-6 rounded-[2rem] bg-primary-foreground/10 p-5 backdrop-blur-md shadow-hero animate-fade-in-up">
      <div className="flex items-center justify-between">
        <CreditCard className="h-7 w-7" />
        <img src={perkbackLogo} alt="" className="h-7 w-7 opacity-90" />
      </div>
      <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Cardholder</p>
      <p className="text-xl font-black">{identity.full_name ?? "Member"}</p>
      <div className="mt-4 flex justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">CRN</p>
          <p className="font-mono text-base font-black">{identity.crn}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">Card no.</p>
          <p className="font-mono text-base font-black">{identity.loyalty_card_number.replace(/(\d{4})(\d{4})(\d{2})/, "$1 $2 $3")}</p>
        </div>
      </div>
    </div>

    <div className="mt-5 rounded-2xl bg-primary-foreground/10 p-4 text-center backdrop-blur-md space-y-1">
      <p className="text-sm">You're now earning at <span className="font-black">{identity.merchant_name}</span></p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/70 font-bold">
        Joined via {identity.merchant_name} QR
      </p>
    </div>

    <div className="mt-auto pt-6 space-y-2">
      <Button variant="gold" size="lg" className="w-full" onClick={onOpen}>
        Open my wallet <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        onClick={onOpen}
      >
        <WalletCards className="h-4 w-4" /> Add to Apple & Google Wallet
      </Button>
    </div>
  </div>
);

/* ───────── Page Orchestrator ───────── */
const CustomerJoin = () => {
  const { merchantSlug = "" } = useParams<{ merchantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, authReady } = useAuth();

  const [step, setStep] = useState<Step>("splash");
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [profile, setProfile] = useState({ firstName: "", phone: "", dob: "" });
  const [identity, setIdentity] = useState<CardIdentity | null>(null);
  const [linking, setLinking] = useState(false);

  // Splash auto-advance
  useEffect(() => {
    if (step === "splash") {
      const t = setTimeout(() => setStep("welcome"), 1300);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Load merchant
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_merchant_by_slug", { _slug: merchantSlug });
      if (!active) return;
      if (error || !data || data.length === 0) {
        setMerchantError("We couldn't find that store. Please scan the QR again.");
        return;
      }
      setMerchant(data[0] as MerchantInfo);
    })();
    return () => { active = false; };
  }, [merchantSlug]);

  // If already signed in → link silently and go straight to wallet
  useEffect(() => {
    if (!authReady || !user || !merchant || linking) return;
    if (searchParams.get("step") === "ready") return; // OAuth-return path handled below
    setLinking(true);
    (async () => {
      const { data, error } = await supabase.rpc("join_merchant_by_slug", {
        _slug: merchantSlug,
        _source: "qr-poster",
      });
      if (!error && (data as any)?.success) {
        toast.success(`You're now earning at ${(data as any).merchant_name}`);
      }
      navigate("/customer/access-card", { replace: true });
    })();
  }, [authReady, user, merchant, merchantSlug, linking, navigate, searchParams]);

  const handleWalletCreated = async () => {
    // After signUp, session exists immediately (auto-confirm) or pending email.
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      toast.success("Check your email to confirm your wallet");
      return;
    }
    const { data, error } = await supabase.rpc("join_merchant_by_slug", {
      _slug: merchantSlug,
      _source: "qr-poster",
    });
    if (error || !(data as any)?.success) {
      toast.error("Could not link to merchant");
      return;
    }
    const result = data as any;
    setIdentity({
      crn: result.crn,
      loyalty_card_number: result.loyalty_card_number,
      full_name: result.full_name ?? profile.firstName,
      merchant_name: result.merchant_name,
    });
    setStep("ready");
  };

  const content = useMemo(() => {
    if (merchantError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="text-xl font-black">Store not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">{merchantError}</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Back to PerkBack</Button>
        </div>
      );
    }

    if (step === "splash" || !merchant) return <Splash />;

    switch (step) {
      case "welcome":
        return <Welcome merchant={merchant} onJoin={() => setStep("onboarding")} onSignIn={() => navigate(`/get-started?next=/join/${merchantSlug}`)} />;
      case "onboarding":
        return <Onboarding onDone={() => setStep("questions")} />;
      case "questions":
        return <QuickQuestions initial={profile} onContinue={(v) => { setProfile(v); setStep("wallet"); }} />;
      case "wallet":
        return <CreateWallet profile={profile} merchantSlug={merchantSlug} onCreated={handleWalletCreated} />;
      case "ready":
        return identity ? <CardReady identity={identity} onOpen={() => navigate("/customer/access-card")} /> : <Splash />;
      default:
        return <Splash />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, merchant, merchantError, profile, identity, merchantSlug]);

  return <MobileFrame>{content}</MobileFrame>;
};

export default CustomerJoin;
