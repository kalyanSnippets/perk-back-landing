import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ArrowLeft } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    if (hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery") {
      setIsRecovery(true);
      setChecking(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    // Fallback: if a session already exists from the recovery link, allow reset.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsRecovery(true);
      setChecking(false);
    }, 1500);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password updated. Please sign in with your new password.");
      navigate("/get-started");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Checking your reset link…</p>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Invalid or expired reset link.</p>
          <Button variant="hero" asChild>
            <Link to="/get-started">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center animate-fade-up">
          <Link to="/" className="inline-block mb-4">
            <img src={perkbackLogo} alt="Perk Back" className="h-10 sm:h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 shadow-card space-y-4 animate-fade-up-delay-1">
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input id="new-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={8} />
            </div>
            <p className="text-[10px] text-muted-foreground">At least 8 characters. Avoid common or breached passwords.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input id="confirm-pass" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required minLength={8} />
            </div>
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <div className="text-center mt-5">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/get-started"><ArrowLeft size={16} /> Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
