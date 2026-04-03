import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Lock, Building2, User, Save, Eye, EyeOff,
  Phone, MapPin, Briefcase, Upload, Wifi, CreditCard, Check
} from "lucide-react";
import PosTab from "@/components/merchant/PosTab";
import ScrollReveal from "@/components/ScrollReveal";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import PlanBadge from "@/components/merchant/PlanBadge";
import LockedFeature from "@/components/merchant/LockedFeature";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { FEATURE_CATALOG, planLabel } from "@/lib/features";

interface MerchantData {
  id: string;
  store_name: string;
  address: string | null;
  contact_number: string | null;
  industry_type: string | null;
  profile_image_url: string | null;
}

const MerchantSettings = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"password" | "business" | "profile" | "pos" | "subscription">("business");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [bizForm, setBizForm] = useState({ store_name: "", address: "", contact_number: "", industry_type: "" });
  const [savingBiz, setSavingBiz] = useState(false);

  const [uploading, setUploading] = useState(false);

  const { plan, status, canAccess, loading: subLoading } = useMerchantSubscription(merchant?.id);

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/get-started"); return; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id, store_name, address, contact_number, industry_type, profile_image_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!m) { navigate("/get-started"); return; }
    setMerchant(m);
    setBizForm({
      store_name: m.store_name || "",
      address: m.address || "",
      contact_number: m.contact_number || "",
      industry_type: m.industry_type || "",
    });
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchMerchant(); }, [fetchMerchant]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !bizForm.store_name.trim()) { toast.error("Store name is required"); return; }

    setSavingBiz(true);
    const { error } = await supabase
      .from("merchants")
      .update({
        store_name: bizForm.store_name.trim(),
        address: bizForm.address.trim() || null,
        contact_number: bizForm.contact_number.trim() || null,
        industry_type: bizForm.industry_type.trim() || null,
      })
      .eq("id", merchant.id);

    setSavingBiz(false);
    if (error) { toast.error(error.message); return; }
    setMerchant((prev) => prev ? { ...prev, ...bizForm } : prev);
    toast.success("Business info updated");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchant) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${merchant.id}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); toast.error("Upload failed"); return; }

    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);

    const { error: updateError } = await supabase.from("merchants").update({ profile_image_url: urlData.publicUrl }).eq("id", merchant.id);
    setUploading(false);
    if (updateError) { toast.error("Failed to save image URL"); return; }
    setMerchant((prev) => prev ? { ...prev, profile_image_url: urlData.publicUrl } : prev);
    toast.success("Profile image updated");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading settings...</p></div>;
  }

  if (!merchant) return null;

  const tabs = [
    { id: "business" as const, label: "Business", icon: Building2 },
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "pos" as const, label: "POS", icon: Wifi },
    { id: "subscription" as const, label: "Plan", icon: CreditCard },
    { id: "password" as const, label: "Password", icon: Lock },
  ];

  const includedFeatures = FEATURE_CATALOG.filter((f) => canAccess(f.key));
  const lockedFeatures = FEATURE_CATALOG.filter((f) => !canAccess(f.key) && f.minimumPlan !== "free");

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <BackToDashboard />
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-foreground">Settings</span>
          </div>

          <ScrollReveal>
            <div className="flex gap-1 bg-card rounded-xl p-1.5 border border-border/50 shadow-card overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200 whitespace-nowrap min-w-0 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {activeTab === "business" && (
            <ScrollReveal>
              <form onSubmit={handleBusinessSave} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Building2 size={18} className="text-secondary" /> Business Information
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input id="store_name" value={bizForm.store_name} onChange={(e) => setBizForm((p) => ({ ...p, store_name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5"><MapPin size={12} /> Address</Label>
                  <Input id="address" value={bizForm.address} onChange={(e) => setBizForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_number" className="flex items-center gap-1.5"><Phone size={12} /> Contact Number</Label>
                  <Input id="contact_number" value={bizForm.contact_number} onChange={(e) => setBizForm((p) => ({ ...p, contact_number: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry_type" className="flex items-center gap-1.5"><Briefcase size={12} /> Industry Type</Label>
                  <Input id="industry_type" value={bizForm.industry_type} onChange={(e) => setBizForm((p) => ({ ...p, industry_type: e.target.value }))} />
                </div>
                <Button type="submit" variant="hero" className="w-full gap-2" disabled={savingBiz}>
                  <Save size={16} /> {savingBiz ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </ScrollReveal>
          )}

          {activeTab === "profile" && (
            <ScrollReveal>
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <User size={18} className="text-secondary" /> Profile
                </h2>
                <div className="flex flex-col items-center gap-4">
                  {merchant.profile_image_url ? (
                    <img src={merchant.profile_image_url} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-secondary/15 flex items-center justify-center">
                      <User size={32} className="text-secondary" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors">
                      <Upload size={14} />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </div>
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{merchant.store_name}</p>
                  <p className="text-xs text-muted-foreground">{merchant.industry_type || "Business"}</p>
                </div>
              </div>
            </ScrollReveal>
          )}

          {activeTab === "pos" && (
            <ScrollReveal>
              {canAccess("pos_integration") ? (
                <PosTab merchantId={merchant.id} />
              ) : (
                <LockedFeature featureKey="pos_integration" />
              )}
            </ScrollReveal>
          )}

          {activeTab === "subscription" && !subLoading && (
            <ScrollReveal>
              <div className="space-y-4">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <CreditCard size={18} className="text-secondary" /> Your Plan
                    </h2>
                    <PlanBadge plan={plan} status={status} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included Features</h3>
                    <div className="space-y-1.5">
                      {includedFeatures.map((f) => (
                        <div key={f.key} className="flex items-center gap-2 text-sm text-foreground">
                          <Check size={14} className="text-green-500" />
                          {f.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  {lockedFeatures.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked Features</h3>
                      <div className="space-y-1.5">
                        {lockedFeatures.map((f) => (
                          <div key={f.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock size={14} />
                            <span>{f.name}</span>
                            <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {planLabel(f.minimumPlan)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {plan !== "pro" && (
                  <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 text-center space-y-3">
                    <p className="text-sm font-semibold text-foreground">Want to unlock more features?</p>
                    <p className="text-xs text-muted-foreground">Contact your admin to upgrade your plan.</p>
                    <Button variant="hero" size="sm" className="gap-1.5">Request Upgrade</Button>
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          {activeTab === "password" && (
            <ScrollReveal>
              <form onSubmit={handlePasswordChange} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Lock size={18} className="text-secondary" /> Change Password
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full gap-2" disabled={savingPassword}>
                  <Lock size={16} /> {savingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantSettings;
