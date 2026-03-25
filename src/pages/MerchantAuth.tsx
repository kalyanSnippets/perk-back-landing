import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Store, ArrowLeft } from "lucide-react";

const MerchantAuth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: storeName, role: "merchant" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: merchantError } = await supabase
            .from("merchants")
            .insert({ user_id: authData.user.id, store_name: storeName });
          if (merchantError) throw merchantError;
        }

        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              Perk <span className="text-secondary">Back</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {isSignUp ? "Register your store" : "Merchant login"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? "Start managing loyalty rewards" : "Access your merchant dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-5 animate-fade-up-delay-1">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="storeName"
                  placeholder="My Coffee Shop"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Register Store" : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-secondary hover:underline"
            >
              {isSignUp ? "Already registered? Sign in" : "New merchant? Register your store"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 animate-fade-up-delay-2">
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

export default MerchantAuth;
