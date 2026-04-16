import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Store, ArrowLeft, ShieldCheck, Phone, Calendar, MapPin, Briefcase, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { lovable } from "@/integrations/lovable/index";
import perkbackLogo from "@/assets/perkback-logo.webp";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

type Role = "customer" | "merchant";
type AuthMode = "login" | "signup";

const GetStarted = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { user, loading: authLoading, isMerchant, isCustomer } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (isMerchant && isCustomer) {
      navigate("/choose-role");
    } else if (isMerchant) {
      navigate("/merchant/dashboard");
    } else if (isCustomer) {
      navigate("/customer/access-card");
    }
  }, [user, authLoading, isMerchant, isCustomer, navigate]);

  const resetForm = () => {
    setEmail(""); setPassword(""); setFullName(""); setPhone(""); setDob("");
    setStoreName(""); setAddress(""); setContactNumber(""); setIndustryType("");
    setShowPassword(false); setAgreedToTerms(false);
  };

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || `${provider} sign-in failed`);
        return;
      }
      if (result.redirected) return;
    } catch (error: any) {
      toast.error(error.message || `${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => handleOAuthSignIn("google");
  const handleAppleSignIn = () => handleOAuthSignIn("apple");

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { toast.error("Please enter your email address first"); return; }
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
    if (!emailResult.success) { toast.error(emailResult.error.issues[0].message); return; }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) { toast.error(passResult.error.issues[0].message); return; }

    if (authMode === "signup") {
      if (!agreedToTerms) { toast.error("Please agree to the Terms & Conditions"); return; }
      if (role === "customer") {
        const nameResult = nameSchema.safeParse(fullName);
        if (!nameResult.success) { toast.error(nameResult.error.issues[0].message); return; }
        if (!phone.trim()) { toast.error("Phone number is required"); return; }
        if (!dob) { toast.error("Date of birth is required"); return; }
      } else {
        const nameResult = nameSchema.safeParse(storeName);
        if (!nameResult.success) { toast.error("Store name is required"); return; }
        if (!address.trim()) { toast.error("Address is required"); return; }
        if (!contactNumber.trim()) { toast.error("Contact number is required"); return; }
        if (!industryType.trim()) { toast.error("Industry type is required"); return; }
      }
    }

    setLoading(true);
    try {
      if (authMode === "signup") { await handleSignUp(emailResult.data); }
      else { await handleLogin(emailResult.data); }
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
      email: validEmail, password,
      options: { data: metadata, emailRedirectTo: window.location.origin },
    });

    if (error && (error.message?.includes("User already registered") || error.status === 422)) {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: validEmail, password });
      if (loginError) throw new Error("Account exists but password is incorrect. Try logging in instead.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed");

      if (role === "merchant") {
        const { data: existing } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
        if (!existing) {
          const { error: insertErr } = await supabase.from("merchants").insert({
            user_id: user.id, store_name: storeName.trim(),
            address: address.trim() || null, contact_number: contactNumber.trim() || null,
            industry_type: industryType.trim() || null,
          });
          if (insertErr) throw insertErr;
        }
        toast.success("Merchant profile added to your existing account!");
      } else {
        const { data: existing } = await supabase.from("customers").select("loyalty_card_number").eq("user_id", user.id).maybeSingle();
        if (!existing) {
          const { error: insertErr } = await supabase.from("customers").insert({
            user_id: user.id, full_name: fullName.trim(),
            phone: phone.trim() || null, date_of_birth: dob || null,
          });
          if (insertErr) throw insertErr;
        }
        toast.success("Customer profile added to your existing account!");
      }
      window.location.reload();
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
    const [{ data: merchant }, { data: customer }] = await Promise.all([
      supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("customers").select("loyalty_card_number").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!merchant && !customer) {
      await supabase.auth.signOut();
      toast.error("No account found for this email. Please sign up first.");
      return;
    }
    if (merchant && customer) navigate("/choose-role");
    else if (merchant) navigate("/merchant/dashboard");
    else if (customer) navigate(customer.loyalty_card_number ? "/customer/access-card" : "/customer/confirmation");
  };

  const switchToSignup = (selectedRole: Role) => {
    setRole(selectedRole);
    setAuthMode("signup");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="absolute top-20 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-secondary/5 blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center animate-fade-up">
          <Link to="/" className="inline-block mb-4">
            <img src={perkbackLogo} alt="Perk Back" className="h-10 sm:h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {authMode === "login" ? "Sign in to your account" : `Sign up as ${role === "customer" ? "a customer" : "a merchant"}`}
          </p>
        </div>

        <div className="animate-fade-up-delay-1">
          {authMode === "login" ? (
            /* ─── Login Form ─── */
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 sm:p-7 shadow-card space-y-3.5">
              <FormField id="l-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
              <PasswordField id="l-pass" label="Password" value={password} onChange={setPassword} showPassword={showPassword} toggleShowPassword={() => setShowPassword(!showPassword)} />

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>

              <Button type="button" variant="outline" size="lg" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={loading}>
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>

              <Button type="button" variant="outline" size="lg" className="w-full gap-2" onClick={handleAppleSignIn} disabled={loading}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Continue with Apple
              </Button>

              <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-secondary hover:underline w-full text-center">
                Forgot password?
              </button>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Your data is securely encrypted
              </p>

              <div className="pt-2 border-t border-border/50 text-center space-y-1">
                <p className="text-xs text-muted-foreground">Don't have an account?</p>
                <div className="flex items-center justify-center gap-3">
                  <button type="button" onClick={() => switchToSignup("customer")} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <User size={12} /> Sign up as Customer
                  </button>
                  <span className="text-border">|</span>
                  <button type="button" onClick={() => switchToSignup("merchant")} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <Store size={12} /> Sign up as Merchant
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ─── Signup Form ─── */
            <>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={() => { setRole("customer"); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === "customer" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <User size={18} /> Customer
                </button>
                <button type="button" onClick={() => { setRole("merchant"); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === "merchant" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Store size={18} /> Merchant
                </button>
              </div>

              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 sm:p-7 shadow-card space-y-3.5">
                {role === "customer" ? (
                  <>
                    <FormField id="s-name" label="Full Name" icon={<User size={16} />} value={fullName} onChange={setFullName} placeholder="John Doe" required />
                    <FormField id="s-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
                    <PasswordField id="s-pass" label="Password" value={password} onChange={setPassword} showPassword={showPassword} toggleShowPassword={() => setShowPassword(!showPassword)} />
                    <FormField id="s-phone" label="Phone" icon={<Phone size={16} />} value={phone} onChange={setPhone} placeholder="+1 234 567 8900" required />
                    <div className="space-y-1.5">
                      <Label htmlFor="s-dob">Date of Birth <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input id="s-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FormField id="s-store" label="Store Name" icon={<Store size={16} />} value={storeName} onChange={setStoreName} placeholder="My Coffee Shop" required />
                    <FormField id="s-email" label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="merchant@example.com" type="email" required />
                    <PasswordField id="s-pass" label="Password" value={password} onChange={setPassword} showPassword={showPassword} toggleShowPassword={() => setShowPassword(!showPassword)} />
                    <FormField id="s-address" label="Address" icon={<MapPin size={16} />} value={address} onChange={setAddress} placeholder="123 Main St" required />
                    <FormField id="s-contact" label="Contact Number" icon={<Phone size={16} />} value={contactNumber} onChange={setContactNumber} placeholder="+1 234 567 8900" required />
                    <FormField id="s-industry" label="Industry Type" icon={<Briefcase size={16} />} value={industryType} onChange={setIndustryType} placeholder="Café, Retail, Restaurant..." required />
                  </>
                )}

                <div className="flex items-start gap-2">
                  <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(v === true)} className="mt-0.5" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    I agree to the <Link to="/privacy" className="text-primary hover:underline" target="_blank">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
                  </label>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !agreedToTerms}>
                  {loading ? "Please wait..." : role === "customer" ? "Create Customer Account" : "Register Store"}
                </Button>

                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Your data is securely encrypted
                </p>

                <div className="pt-2 border-t border-border/50 text-center">
                  <button type="button" onClick={() => { setAuthMode("login"); resetForm(); }} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-5 animate-fade-up-delay-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft size={16} /> Back to Home</Link>
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
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-10" required={required} minLength={type === "password" ? 6 : undefined} />
    </div>
  </div>
);

/* Password field with eye toggle */
const PasswordField = ({
  id, label, value, onChange, showPassword, toggleShowPassword,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; showPassword: boolean; toggleShowPassword: () => void;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={16} /></span>
      <Input id={id} type={showPassword ? "text" : "password"} placeholder="••••••••" value={value} onChange={(e) => onChange(e.target.value)} className="pl-10 pr-10" required minLength={6} />
      <button type="button" onClick={toggleShowPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

export default GetStarted;