import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CreditCard, Loader2, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import perkbackLogo from "@/assets/perkback-logo-224.webp";
import merchantHero from "@/assets/prototype/merchant-welcome-hero.jpg";
import introImage from "@/assets/prototype/onboarding-scan.jpg";
import { linkCustomerToMerchant } from "@/lib/customerMerchantJoin";

type Step = "splash" | "intro" | "questions" | "wallet" | "ready";

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

const SPLASH_DURATION_MS = 2200;

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  phone: z.string().trim().min(6, "Mobile number is required").max(20),
  dob: z.string().min(1, "Date of birth is required"),
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const MobileFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[100dvh] bg-muted/30 flex items-stretch justify-center overflow-hidden">
    <div className="w-full max-w-[420px] min-h-[100dvh] max-h-[100dvh] bg-background shadow-floating-nav flex flex-col overflow-hidden">
      {children}
    </div>
  </div>
);

const Splash = () => (
  <div className="flex-1 bg-gradient-hero flex flex-col items-center justify-center px-6 text-primary-foreground">
    <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary-foreground/10 backdrop-blur-md shadow-hero animate-pop-in">
      <img src={perkbackLogo} alt="PerkBack" className="h-16 w-16 object-contain" />
    </div>
    <h1 className="mt-5 text-3xl font-black tracking-tight">PerkBack</h1>
    <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/70 text-center">
      One wallet · every local perk
    </p>
    <div className="mt-10 flex gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
    </div>
  </div>
);

const Intro = ({
  merchant,
  onJoin,
  onSignIn,
}: {
  merchant: MerchantInfo;
  onJoin: () => void;
  onSignIn: () => void;
}) => (
  <div className="flex-1 flex flex-col px-5 pt-5 pb-6 overflow-hidden">
    <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-card">
      <div className="relative h-44">
        <img src={merchantHero} alt={merchant.store_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
        <div className="absolute left-1/2 bottom-4 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-background/90 px-3 py-2 shadow-card backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-card shadow-card">
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt={merchant.store_name} className="h-9 w-9 object-contain" />
            ) : (
              <span className="text-lg font-black text-primary">{merchant.store_name.charAt(0)}</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {merchant.industry_type ?? "Local merchant"}
            </p>
            <p className="text-sm font-black text-foreground">{merchant.store_name}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="text-center">
          <h2 className="text-[1.85rem] font-black leading-tight text-foreground">Join in seconds</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your PerkBack wallet once, then scan and earn every time you visit {merchant.store_name}.
          </p>
        </div>

        <div className="grid gap-3">
          {[
            "Your wallet works across participating stores.",
            "Points and rewards show up instantly after each visit.",
            "Already a member? Sign in and we’ll take you straight to your card.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-foreground">
              {item}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] shadow-card">
          <img src={introImage} alt="Customer scanning a loyalty QR code" className="h-28 w-full object-cover" />
        </div>
      </div>
    </div>

    <div className="mt-auto pt-5 space-y-3">
      <Button variant="hero" size="lg" className="w-full" onClick={onJoin}>
        Continue <ArrowRight className="h-4 w-4" />
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

const QuickQuestions = ({
  initial,
  onContinue,
}: {
  initial: { firstName: string; phone: string; dob: string };
  onContinue: (v: { firstName: string; phone: string; dob: string }) => void;
}) => {
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
    <form onSubmit={submit} className="flex-1 flex flex-col px-5 pt-6 pb-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step 1 of 2</p>
        <h2 className="mt-2 text-2xl font-black">A few quick details</h2>
        <p className="mt-1 text-sm text-muted-foreground">We use these for your wallet, birthday perks and receipts.</p>
      </div>

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
        <span className="font-bold text-foreground">Why we ask</span> — your birthday unlocks rewards, and your mobile keeps your wallet linked to this merchant.
      </div>

      <div className="mt-auto pt-6">
        <Button type="submit" variant="hero" size="lg" className="w-full">
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

const CreateWallet = ({
  profile,
  merchantSlug,
  onCreated,
  onSignIn,
}: {
  profile: { firstName: string; phone: string; dob: string };
  merchantSlug: string;
  onCreated: () => void;
  onSignIn: () => void;
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
    <form onSubmit={submit} className="flex-1 flex flex-col px-5 pt-6 pb-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 2</p>
        <h2 className="mt-2 text-2xl font-black">Create your PerkBack wallet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use one login to access your card every time you open the app.</p>
      </div>

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
          <a href="/privacy" target="_blank" className="font-bold text-foreground underline-offset-4 hover:underline" rel="noreferrer">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="font-bold text-foreground underline-offset-4 hover:underline" rel="noreferrer">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <Button type="submit" variant="hero" size="lg" className="mt-5 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating wallet…
          </>
        ) : (
          "Create my wallet"
        )}
      </Button>

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => oauth("google")}>Continue with Google</Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => oauth("apple")}>Continue with Apple</Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn} className="font-bold text-foreground underline-offset-4 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
};

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
        <img src={perkbackLogo} alt="PerkBack" className="h-7 w-7 opacity-90" />
      </div>
      <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Cardholder</p>
      <p className="text-xl font-black">{identity.full_name ?? "Member"}</p>
      <div className="mt-4 flex justify-between gap-4">
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

const CustomerJoin = () => {
  const { merchantSlug = "" } = useParams<{ merchantSlug: string }>();
  const navigate = useNavigate();
  const { user, authReady } = useAuth();

  const [step, setStep] = useState<Step>("splash");
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [profile, setProfile] = useState({ firstName: "", phone: "", dob: "" });
  const [identity, setIdentity] = useState<CardIdentity | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setStep("intro"), SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

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
    return () => {
      active = false;
    };
  }, [merchantSlug]);

  useEffect(() => {
    if (!authReady || !user || !merchant || linking || step === "splash") return;

    setLinking(true);
    (async () => {
      try {
        setLinkError(null);
        const result = await linkCustomerToMerchant({ merchantSlug, source: "qr-poster" });

        if (!result.success) {
          setLinkError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success(`You're now earning at ${result.data?.merchant_name ?? merchant.store_name}`);
        navigate("/customer/access-card", { replace: true });
      } finally {
        setLinking(false);
      }
    })();
  }, [authReady, linking, merchant, merchantSlug, navigate, step, user]);

  const signInPath = `/get-started?app=1&next=${encodeURIComponent(`/join/${merchantSlug}`)}`;

  const handleWalletCreated = async () => {
    const {
      data: { user: signedInUser },
    } = await supabase.auth.getUser();

    if (!signedInUser) {
      toast.success("Check your email to confirm your wallet");
      return;
    }

    const result = await linkCustomerToMerchant({ merchantSlug, source: "qr-poster" });

    if (!result.success || !result.data) {
      setLinkError(result.error);
      toast.error(result.error);
      return;
    }

    setIdentity({
      crn: result.data.crn ?? "",
      loyalty_card_number: result.data.loyalty_card_number ?? "",
      full_name: result.data.full_name ?? profile.firstName,
      merchant_name: result.data.merchant_name ?? merchant?.store_name ?? "PerkBack Store",
    });
    setLinkError(null);
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

    if (linkError && merchant) {
      return (
        <div className="flex-1 flex flex-col justify-center px-6 text-center">
          <h2 className="text-2xl font-black text-foreground">We couldn’t join {merchant.store_name}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{linkError}</p>
          <div className="mt-6 space-y-3">
            <Button variant="hero" size="lg" className="w-full" onClick={() => setLinking(false)}>
              Try again
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(signInPath)}>
              Sign in
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate("/customer/access-card")}>
              Continue to wallet
            </Button>
          </div>
        </div>
      );
    }

    if (step === "splash" || !merchant) return <Splash />;

    switch (step) {
      case "intro":
        return (
          <Intro
            merchant={merchant}
            onJoin={() => setStep("questions")}
            onSignIn={() => navigate(signInPath)}
          />
        );
      case "questions":
        return <QuickQuestions initial={profile} onContinue={(values) => { setProfile(values); setStep("wallet"); }} />;
      case "wallet":
        return (
          <CreateWallet
            profile={profile}
            merchantSlug={merchantSlug}
            onCreated={handleWalletCreated}
            onSignIn={() => navigate(signInPath)}
          />
        );
      case "ready":
        return identity ? <CardReady identity={identity} onOpen={() => navigate("/customer/access-card")} /> : <Splash />;
      default:
        return <Splash />;
    }
  }, [handleWalletCreated, identity, merchant, merchantError, merchantSlug, navigate, profile, signInPath, step]);

  return <MobileFrame>{content}</MobileFrame>;
};

export default CustomerJoin;
