import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Lock, User, Store, ArrowLeft, ShieldCheck, Phone, Calendar, MapPin, Briefcase } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const phoneSchema = z.string().trim().max(20).optional();

type Role = "customer" | "merchant";

const GetStarted = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Customer fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  // Merchant fields
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [industryType, setIndustryType] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: merchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        const { data: customer } = await supabase
          .from("customers")
          .select("loyalty_card_number")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (role === "merchant" && merchant) {
          navigate("/merchant/dashboard");
        } else if (role === "customer" && customer?.loyalty_card_number) {
          navigate("/customer/access-card");
        } else if (role === "customer" && customer) {
          navigate("/customer/confirmation");
        }
      }
    };
    checkSession();
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setDob("");
    setStoreName("");
    setAddress("");
    setContactNumber("");
    setIndustryType("");
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error("Please enter your email address first");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailResult.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { toast.error(emailResult.error.errors[0].message); return; }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) { toast.error(passResult.error.errors[0].message); return; }

    if (authMode === "signup") {
      if (role === "customer") {
        const nameResult = nameSchema.safeParse(fullName);
        if (!nameResult.success) { toast.error(nameResult.error.errors[0].message); return; }
      } else {
        const nameResult = nameSchema.safeParse(storeName);
        if (!nameResult.success) { toast.error("Store name is required"); return; }
      }
    }

    setLoading(true);
    try {
      if (authMode === "signup") {
        await handleSignUp(emailResult.data);
      } else {
        await handleLogin(emailResult.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (validEmail: string) => {
    const metadata: Record<string, string> = {};

    if (role === "customer") {
      metadata.full_name = fullName.trim();
      metadata.role = "customer";
      if (phone) metadata.phone = phone.trim();
      if (dob) metadata.date_of_birth = dob;
    } else {
      metadata.full_name = storeName.trim();
      metadata.role = "merchant";
      if (address) metadata.address = address.trim();
      if (contactNumber) metadata.contact_number = contactNumber.trim();
      if (industryType) metadata.industry_type = industryType.trim();
    }

    const { error } = await supabase.auth.signUp({
      email: validEmail,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });

    // Handle "User already registered" — sign in and add missing profile
    if (error && (error.message?.includes("User already registered") || error.status === 422)) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password,
      });
      if (loginError) {
        throw new Error("Account exists but password is incorrect. Try logging in instead.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed");

      if (role === "merchant") {
        const { data: existing } = await supabase
          .from("merchants")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertErr } = await supabase.from("merchants").insert({
            user_id: user.id,
            store_name: storeName.trim(),
            address: address.trim() || null,
            contact_number: contactNumber.trim() || null,
            industry_type: industryType.trim() || null,
          });
          if (insertErr) throw insertErr;
        }
        toast.success("Merchant profile added to your existing account!");
        navigate("/merchant/dashboard");
      } else {
        const { data: existing } = await supabase
          .from("customers")
          .select("loyalty_card_number")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertErr } = await supabase.from("customers").insert({
            user_id: user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            date_of_birth: dob || null,
          });
          if (insertErr) throw insertErr;
        }
        toast.success("Customer profile added to your existing account!");
        navigate(existing?.loyalty_card_number ? "/customer/access-card" : "/customer/confirmation");
      }
      return;
    }

    if (error) throw error;

    await supabase.auth.signOut();
    toast.success("Account created! Please sign in.");
    setAuthMode("login");
    resetForm();
  };

  const handleLogin = async (validEmail: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: validEmail, password });
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Login failed");

    if (role === "customer") {
      const { data: customer } = await supabase
        .from("customers")
        .select("loyalty_card_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer) {
        await supabase.auth.signOut();
        toast.error("No customer account found for this email.");
        return;
      }
      navigate(customer.loyalty_card_number ? "/customer/access-card" : "/customer/confirmation");
    } else {
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!merchant) {
        await supabase.auth.signOut();
        toast.error("No merchant account found for this email.");
        return;
      }
      navigate("/merchant/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="absolute top-20 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-secondary/5 blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              Perk <span className="text-secondary">Back</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {authMode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {authMode === "signup" ? "Choose your role to get started" : "Sign in to your account"}
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-3 mb-4 animate-fade-up">
          <button
            type="button"
            onClick={() => { setRole("customer"); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              role === "customer"
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            <User size={18} />
            Customer
          </button>
          <button
            type="button"
            onClick={() => { setRole("merchant"); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              role === "merchant"
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Store size={18} />
            Merchant
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="animate-fade-up-delay-1">
          <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as "signup" | "login"); resetForm(); }} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 sm:p-7 shadow-card space-y-3.5">
                {/* Role-specific signup fields */}
                {role === "customer" ? (
                  <>
                    <FormField id="s-name" label="Full Name" icon={<User size={16} />} value={fullName} onChange={setFullName} placeholder="John Doe" required />
                    <FormField id="s-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
                    <FormField id="s-pass" label="Password" icon={<Lock size={16} />} value={password} onChange={setPassword} placeholder="••••••••" type="password" required />
                    <FormField id="s-phone" label="Phone (optional)" icon={<Phone size={16} />} value={phone} onChange={setPhone} placeholder="+1 234 567 8900" />
                    <div className="space-y-1.5">
                      <Label htmlFor="s-dob">Date of Birth (optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input id="s-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FormField id="s-store" label="Store Name" icon={<Store size={16} />} value={storeName} onChange={setStoreName} placeholder="My Coffee Shop" required />
                    <FormField id="s-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="merchant@example.com" type="email" required />
                    <FormField id="s-pass" label="Password" icon={<Lock size={16} />} value={password} onChange={setPassword} placeholder="••••••••" type="password" required />
                    <FormField id="s-address" label="Address (optional)" icon={<MapPin size={16} />} value={address} onChange={setAddress} placeholder="123 Main St" />
                    <FormField id="s-contact" label="Contact Number (optional)" icon={<Phone size={16} />} value={contactNumber} onChange={setContactNumber} placeholder="+1 234 567 8900" />
                    <FormField id="s-industry" label="Industry Type (optional)" icon={<Briefcase size={16} />} value={industryType} onChange={setIndustryType} placeholder="Café, Retail, Restaurant..." />
                  </>
                )}

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : role === "customer" ? "Create Customer Account" : "Register Store"}
                </Button>

                <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-secondary hover:underline">
                  Forgot password?
                </button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Your data is securely encrypted
                </p>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 sm:p-7 shadow-card space-y-3.5">
                <FormField id="l-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
                <FormField id="l-pass" label="Password" icon={<Lock size={16} />} value={password} onChange={setPassword} placeholder="••••••••" type="password" required />

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : role === "customer" ? "Sign In as Customer" : "Sign In as Merchant"}
                </Button>

                <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-secondary hover:underline">
                  Forgot password?
                </button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Your data is securely encrypted
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center mt-5 animate-fade-up-delay-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

/* Reusable form field component */
const FormField = ({
  id, label, icon, value, onChange, placeholder, type = "text", required = false,
}: {
  id: string; label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        required={required}
        minLength={type === "password" ? 6 : undefined}
      />
    </div>
  </div>
);

export default GetStarted;
