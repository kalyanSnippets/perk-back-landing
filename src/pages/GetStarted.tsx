import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Lock, User, Store, ArrowLeft, ShieldCheck } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

const GetStarted = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customer");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Route based on existing records
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

        if (merchant && activeTab === "merchant") {
          navigate("/merchant/dashboard");
        } else if (customer?.loyalty_card_number) {
          navigate("/customer/access-card");
        }
      }
    };
    checkSession();
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setStoreName("");
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { toast.error(emailResult.error.errors[0].message); return; }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) { toast.error(passResult.error.errors[0].message); return; }
    if (isSignUp) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) { toast.error(nameResult.error.errors[0].message); return; }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: emailResult.data,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        navigate("/customer/confirmation");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailResult.data, password });
        if (error) throw error;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: customer } = await supabase
            .from("customers")
            .select("loyalty_card_number")
            .eq("user_id", user.id)
            .maybeSingle();
          if (customer?.loyalty_card_number) {
            navigate("/customer/access-card");
          } else {
            navigate("/customer/confirmation");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { toast.error(emailResult.error.errors[0].message); return; }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) { toast.error(passResult.error.errors[0].message); return; }
    if (isSignUp) {
      const nameResult = nameSchema.safeParse(storeName);
      if (!nameResult.success) { toast.error("Store name is required"); return; }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up — the handle_new_user trigger creates a customer record automatically.
        // We also create a merchant record.
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailResult.data,
          password,
          options: {
            data: { full_name: storeName.trim(), role: "merchant" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: merchantError } = await supabase
            .from("merchants")
            .insert({ user_id: authData.user.id, store_name: storeName.trim() });
          if (merchantError) throw merchantError;
        }
        toast.success("Merchant account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailResult.data, password });
        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: merchant } = await supabase
            .from("merchants")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!merchant) {
            toast.error("No merchant account found. Please sign up first.");
            await supabase.auth.signOut();
            return;
          }
          navigate("/merchant/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="absolute top-20 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-secondary/5 blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Logo & Heading */}
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
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isSignUp ? "Choose your account type to get started" : "Sign in to your account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up-delay-1">
          <Tabs
            value={activeTab}
            onValueChange={(v) => { setActiveTab(v); resetForm(); }}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="customer" className="flex items-center gap-2 text-sm">
                <User size={16} /> Customer
              </TabsTrigger>
              <TabsTrigger value="merchant" className="flex items-center gap-2 text-sm">
                <Store size={16} /> Merchant
              </TabsTrigger>
            </TabsList>

            {/* Customer Form */}
            <TabsContent value="customer">
              <form onSubmit={handleCustomerSubmit} className="bg-card rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input id="c-name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input id="c-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input id="c-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isSignUp ? "Create Customer Account" : "Sign In as Customer"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); resetForm(); }} className="text-sm text-secondary hover:underline">
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Your data is securely encrypted
                </p>
              </form>
            </TabsContent>

            {/* Merchant Form */}
            <TabsContent value="merchant">
              <form onSubmit={handleMerchantSubmit} className="bg-card rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label htmlFor="m-name">Store Name</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input id="m-name" placeholder="My Coffee Shop" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="m-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input id="m-email" type="email" placeholder="merchant@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input id="m-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isSignUp ? "Register Store" : "Sign In as Merchant"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); resetForm(); }} className="text-sm text-secondary hover:underline">
                    {isSignUp ? "Already registered? Sign in" : "New merchant? Register your store"}
                  </button>
                </div>
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

export default GetStarted;
