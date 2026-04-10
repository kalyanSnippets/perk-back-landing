import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Lock, Building2, User, Save, Eye, EyeOff,
  Phone, MapPin, Briefcase, Upload, CreditCard, Check,
  Stamp, Flame, Trophy
} from "lucide-react";
import PosTab from "@/components/merchant/PosTab";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import PlanBadge from "@/components/merchant/PlanBadge";
import LockedFeature from "@/components/merchant/LockedFeature";
import StampQrScanner from "@/components/merchant/StampQrScanner";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { FEATURE_CATALOG, planLabel } from "@/lib/features";

interface MerchantData {
  id: string;
  store_name: string;
  address: string | null;
  contact_number: string | null;
  industry_type: string | null;
  profile_image_url: string | null;
  logo_url: string | null;
}

const MerchantSettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "business";

  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [bizForm, setBizForm] = useState({ store_name: "", address: "", contact_number: "", industry_type: "" });
  const [savingBiz, setSavingBiz] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { plan, status, canAccess, loading: subLoading } = useMerchantSubscription(merchant?.id);

  // Gamification state
  const [stampEnabled, setStampEnabled] = useState(false);
  const [stampsRequired, setStampsRequired] = useState("10");
  const [stampReward, setStampReward] = useState("Free item");
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [streakThreshold, setStreakThreshold] = useState("5");
  const [streakReward, setStreakReward] = useState("Bonus points");
  const [levelsEnabled, setLevelsEnabled] = useState(false);
  const [savingGamification, setSavingGamification] = useState(false);
  const [stampStats, setStampStats] = useState({ active: 0, completed: 0 });

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/get-started"); return; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id, store_name, address, contact_number, industry_type, profile_image_url, logo_url")
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

    // Fetch gamification settings + stamp stats in parallel
    const [gamRes, activeRes, completedRes] = await Promise.all([
      supabase.from("gamification_settings").select("*").eq("merchant_id", m.id).maybeSingle(),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", m.id).eq("completed", false),
      supabase.from("customer_stamps").select("id", { count: "exact" }).eq("merchant_id", m.id).eq("completed", true),
    ]);

    if (gamRes.data) {
      const s = gamRes.data;
      setStampEnabled(s.stamp_card_enabled); setStampsRequired(String(s.stamps_required));
      setStampReward(s.stamp_reward || "Free item"); setStreakEnabled(s.visit_streak_enabled);
      setStreakThreshold(String(s.streak_threshold)); setStreakReward(s.streak_reward || "Bonus points");
      setLevelsEnabled(s.levels_enabled);
    }
    setStampStats({ active: activeRes.data?.length || 0, completed: completedRes.data?.length || 0 });

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
    toast.success("Password updated"); setNewPassword(""); setConfirmPassword("");
  };

  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !bizForm.store_name.trim()) { toast.error("Store name is required"); return; }
    setSavingBiz(true);
    const { error } = await supabase.from("merchants").update({
      store_name: bizForm.store_name.trim(), address: bizForm.address.trim() || null,
      contact_number: bizForm.contact_number.trim() || null, industry_type: bizForm.industry_type.trim() || null,
    }).eq("id", merchant.id);
    if (error) { setSavingBiz(false); toast.error(error.message); return; }
    setMerchant((prev) => prev ? { ...prev, ...bizForm } : prev);
    toast.success("Business info updated");
    if (bizForm.address.trim()) {
      try {
        const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-address", { body: { address: bizForm.address.trim() } });
        if (!geoError && geoData?.latitude != null && geoData?.longitude != null) {
          await supabase.from("merchants").update({ latitude: geoData.latitude, longitude: geoData.longitude } as any).eq("id", merchant.id);
        }
      } catch {}
    }
    setSavingBiz(false);
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
    if (updateError) { toast.error("Failed to save"); return; }
    setMerchant((prev) => prev ? { ...prev, profile_image_url: urlData.publicUrl } : prev);
    toast.success("Profile image updated");
  };

  const saveGamification = async () => {
    if (!merchant) return;
    setSavingGamification(true);
    const { error } = await supabase.from("gamification_settings").upsert({
      merchant_id: merchant.id, stamp_card_enabled: stampEnabled, stamps_required: parseInt(stampsRequired) || 10,
      stamp_reward: stampReward.trim() || "Free item", visit_streak_enabled: streakEnabled,
      streak_threshold: parseInt(streakThreshold) || 5, streak_reward: streakReward.trim() || "Bonus points", levels_enabled: levelsEnabled,
    }, { onConflict: "merchant_id" });
    setSavingGamification(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gamification settings saved");
  };

  const handleTabChange = (value: string) => setSearchParams({ tab: value });

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading settings...</p></div>;
  }
  if (!merchant) return null;

  const includedFeatures = FEATURE_CATALOG.filter((f) => canAccess(f.key));
  const lockedFeatures = FEATURE_CATALOG.filter((f) => !canAccess(f.key) && f.minimumPlan !== "free");

  const levels = [
    { name: "Bronze", points: "0+", color: "bg-amber-700/20 text-amber-700" },
    { name: "Silver", points: "500+", color: "bg-slate-400/20 text-slate-500" },
    { name: "Gold", points: "1,500+", color: "bg-yellow-500/20 text-yellow-600" },
    { name: "VIP", points: "5,000+", color: "bg-purple-500/20 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchant.id} />
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Settings</h1>

            <Tabs value={defaultTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="pos">POS</TabsTrigger>
                <TabsTrigger value="gamification">Gamification</TabsTrigger>
                <TabsTrigger value="subscription">Plan</TabsTrigger>
              </TabsList>

              {/* Business */}
              <TabsContent value="business">
                <form onSubmit={handleBusinessSave} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Building2 size={18} className="text-secondary" /> Business Information</h2>
                  <div className="space-y-2"><Label htmlFor="store_name">Store Name</Label><Input id="store_name" value={bizForm.store_name} onChange={(e) => setBizForm((p) => ({ ...p, store_name: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label htmlFor="address" className="flex items-center gap-1.5"><MapPin size={12} /> Address</Label><Input id="address" value={bizForm.address} onChange={(e) => setBizForm((p) => ({ ...p, address: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="contact_number" className="flex items-center gap-1.5"><Phone size={12} /> Contact Number</Label><Input id="contact_number" value={bizForm.contact_number} onChange={(e) => setBizForm((p) => ({ ...p, contact_number: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="industry_type" className="flex items-center gap-1.5"><Briefcase size={12} /> Industry Type</Label><Input id="industry_type" value={bizForm.industry_type} onChange={(e) => setBizForm((p) => ({ ...p, industry_type: e.target.value }))} /></div>
                  <Button type="submit" variant="hero" className="w-full gap-2" disabled={savingBiz}><Save size={16} /> {savingBiz ? "Saving..." : "Save Changes"}</Button>
                </form>
              </TabsContent>

              {/* Profile */}
              <TabsContent value="profile">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2"><User size={18} className="text-secondary" /> Profile</h2>
                  <div className="flex flex-col items-center gap-4">
                    {merchant.profile_image_url ? (
                      <img src={merchant.profile_image_url} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-secondary/15 flex items-center justify-center"><User size={32} className="text-secondary" /></div>
                    )}
                    <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors"><Upload size={14} />{uploading ? "Uploading..." : "Upload Photo"}</div>
                    </label>
                  </div>
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Business Logo</h3>
                    <div className="flex items-center gap-4">
                      {merchant.logo_url ? (
                        <img src={merchant.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain border border-border bg-background p-1" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted/40 flex items-center justify-center border border-border/50"><Building2 size={24} className="text-muted-foreground/40" /></div>
                      )}
                      <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file || !merchant) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
                        setUploading(true); const ext = file.name.split(".").pop(); const path = `${merchant.id}-logo.${ext}`;
                        const { error: upErr } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
                        if (upErr) { setUploading(false); toast.error("Upload failed"); return; }
                        const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
                        await supabase.from("merchants").update({ logo_url: urlData.publicUrl } as any).eq("id", merchant.id);
                        setMerchant(prev => prev ? { ...prev, logo_url: urlData.publicUrl } : prev);
                        setUploading(false); toast.success("Logo uploaded");
                      }} /><div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors"><Upload size={14} />{uploading ? "Uploading..." : "Upload Logo"}</div></label>
                    </div>
                  </div>
                  <div className="text-center"><p className="text-sm font-semibold text-foreground">{merchant.store_name}</p><p className="text-xs text-muted-foreground">{merchant.industry_type || "Business"}</p></div>
                </div>
              </TabsContent>

              {/* Password */}
              <TabsContent value="password">
                <form onSubmit={handlePasswordChange} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Lock size={18} className="text-secondary" /> Change Password</h2>
                  <div className="space-y-2"><Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} /></div>
                  <Button type="submit" variant="hero" className="w-full gap-2" disabled={savingPassword}><Lock size={16} /> {savingPassword ? "Updating..." : "Update Password"}</Button>
                </form>
              </TabsContent>

              {/* POS */}
              <TabsContent value="pos">
                {canAccess("pos_integration") ? <PosTab merchantId={merchant.id} /> : <LockedFeature featureKey="pos_integration" />}
              </TabsContent>

              {/* Gamification */}
              <TabsContent value="gamification" className="space-y-4">
                {!canAccess("gamification") ? <LockedFeature featureKey="gamification" /> : (
                  <>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Stamp size={20} className="text-primary" /><div><p className="text-sm font-semibold text-foreground">Stamp Card</p><p className="text-xs text-muted-foreground">Reward customers after purchases</p></div></div>
                        <Switch checked={stampEnabled} onCheckedChange={setStampEnabled} />
                      </div>
                      {stampEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Stamps Required</Label><Input type="number" min="2" max="50" value={stampsRequired} onChange={e => setStampsRequired(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward</Label><Input value={stampReward} onChange={e => setStampReward(e.target.value)} /></div>
                        </div>
                      )}
                    </div>
                    {stampEnabled && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card text-center"><p className="text-2xl font-bold text-foreground">{stampStats.active}</p><p className="text-[11px] text-muted-foreground">Active Cards</p></div>
                          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card text-center"><p className="text-2xl font-bold text-foreground">{stampStats.completed}</p><p className="text-[11px] text-muted-foreground">Completed Cards</p></div>
                        </div>
                        <StampQrScanner merchantId={merchant.id} />
                      </>
                    )}
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Flame size={20} className="text-orange-500" /><div><p className="text-sm font-semibold text-foreground">Visit Streaks</p><p className="text-xs text-muted-foreground">Bonus for consecutive visits</p></div></div>
                        <Switch checked={streakEnabled} onCheckedChange={setStreakEnabled} />
                      </div>
                      {streakEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Threshold</Label><Input type="number" min="2" max="30" value={streakThreshold} onChange={e => setStreakThreshold(e.target.value)} /></div>
                          <div><Label className="text-xs text-muted-foreground mb-1 block">Reward</Label><Input value={streakReward} onChange={e => setStreakReward(e.target.value)} /></div>
                        </div>
                      )}
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Trophy size={20} className="text-yellow-500" /><div><p className="text-sm font-semibold text-foreground">Customer Levels</p><p className="text-xs text-muted-foreground">Tiered levels based on points</p></div></div>
                        <Switch checked={levelsEnabled} onCheckedChange={setLevelsEnabled} />
                      </div>
                      {levelsEnabled && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {levels.map(l => (<div key={l.name} className={`rounded-xl p-3 text-center ${l.color}`}><p className="text-xs font-bold">{l.name}</p><p className="text-[10px] mt-0.5">{l.points} pts</p></div>))}
                        </div>
                      )}
                    </div>
                    <Button variant="hero" size="sm" className="gap-1.5" onClick={saveGamification} disabled={savingGamification}><Save size={14} /> {savingGamification ? "Saving..." : "Save Settings"}</Button>
                  </>
                )}
              </TabsContent>

              {/* Subscription */}
              <TabsContent value="subscription">
                {!subLoading && (
                  <div className="space-y-4">
                    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2"><CreditCard size={18} className="text-secondary" /> Your Plan</h2>
                        <PlanBadge plan={plan} status={status} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included Features</h3>
                        <div className="space-y-1.5">{includedFeatures.map((f) => (<div key={f.key} className="flex items-center gap-2 text-sm text-foreground"><Check size={14} className="text-green-500" />{f.name}</div>))}</div>
                      </div>
                      {lockedFeatures.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked Features</h3>
                          <div className="space-y-1.5">{lockedFeatures.map((f) => (<div key={f.key} className="flex items-center gap-2 text-sm text-muted-foreground"><Lock size={14} /><span>{f.name}</span><span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{planLabel(f.minimumPlan)}</span></div>))}</div>
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
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantSettings;
