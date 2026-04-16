import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, Lock, Store, ArrowLeft, MapPin, Phone, Upload, Briefcase } from "lucide-react";

const INDUSTRY_OPTIONS = ["Coffee Shop", "Retail", "Restaurant"];

const MerchantAuth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!agreedToTerms) { toast.error("Please agree to the Terms & Conditions"); setLoading(false); return; }
        if (!logoFile) { toast.error("Please upload your store logo"); setLoading(false); return; }
        if (!address.trim()) { toast.error("Please enter your store address"); setLoading(false); return; }
        if (!phone.trim()) { toast.error("Please enter your phone number"); setLoading(false); return; }
        if (!industryType) { toast.error("Please select your industry type"); setLoading(false); return; }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: storeName,
              role: "merchant",
              address: address.trim(),
              contact_number: phone.trim(),
              industry_type: industryType,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (authError) throw authError;

        if (authData.user) {
          // Upload logo
          const ext = logoFile.name.split(".").pop();
          const logoPath = `${authData.user.id}/logo.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("profile-images")
            .upload(logoPath, logoFile, { upsert: true });

          let logoUrl: string | null = null;
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(logoPath);
            logoUrl = urlData.publicUrl;
          }

          // Update merchant record with logo_url (created by trigger)
          await supabase
            .from("merchants")
            .update({
              logo_url: logoUrl,
              address: address.trim(),
              contact_number: phone.trim(),
              industry_type: industryType,
            })
            .eq("user_id", authData.user.id);
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

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4 animate-fade-up-delay-1">
          {isSignUp && (
            <>
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Store Logo <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border-2 border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted/40 flex items-center justify-center border-2 border-dashed border-border">
                      <Store size={24} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors">
                      <Upload size={14} /> {logoFile ? "Change Logo" : "Upload Logo"}
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input id="storeName" placeholder="My Coffee Shop" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Store Address <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input id="address" placeholder="123 Main St, Melbourne VIC" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input id="phone" type="tel" placeholder="+61 400 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Industry Type <span className="text-destructive">*</span></Label>
                <Select value={industryType} onValueChange={setIndustryType}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-muted-foreground" />
                      <SelectValue placeholder="Select industry" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input id="email" type="email" placeholder="merchant@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
            </div>
          </div>

          {isSignUp && (
            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(v === true)} className="mt-0.5" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                I agree to the <Link to="/privacy" className="text-primary hover:underline" target="_blank">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
              </label>
            </div>
          )}

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || (isSignUp && !agreedToTerms)}>
            {loading ? "Please wait..." : isSignUp ? "Register Store" : "Sign In"}
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-secondary hover:underline">
              {isSignUp ? "Already registered? Sign in" : "New merchant? Register your store"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 animate-fade-up-delay-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft size={16} /> Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MerchantAuth;
