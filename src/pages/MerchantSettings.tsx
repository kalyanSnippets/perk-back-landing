import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Lock, Building2, User, Save, Eye, EyeOff,
  Phone, MapPin, Upload, CreditCard, Check, Trash2, ArrowUpRight, AlertTriangle, Image, QrCode,
} from "lucide-react";
import CounterQrPoster from "@/components/merchant/CounterQrPoster";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import PosTab from "@/components/merchant/PosTab";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import PlanBadge from "@/components/merchant/PlanBadge";
import LockedFeature from "@/components/merchant/LockedFeature";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { FEATURE_CATALOG, planLabel } from "@/lib/features";

const INDUSTRY_OPTIONS = ["Coffee Shop", "Retail", "Restaurant"];

interface MerchantData {
  id: string;
  store_name: string;
  address: string | null;
  contact_number: string | null;
  industry_type: string | null;
  profile_image_url: string | null;
  logo_url: string | null;
  slug: string | null;
}

const MerchantSettings = () => {
  const navigate = useNavigate();
  const { activeTab, setTab } = usePersistedTab("merchant.settings.tab", "business");

  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [bizForm, setBizForm] = useState({ store_name: "", address: "", contact_number: "", industry_type: "" });
  const [bizCoords, setBizCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [savingBiz, setSavingBiz] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteSubDialog, setShowDeleteSubDialog] = useState(false);
  const [deletingSub, setDeletingSub] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const { plan, status, canAccess, loading: subLoading } = useMerchantSubscription(merchant?.id);

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/get-started"); return; }

    const { data: m } = await supabase
      .from("merchants")
      .select("id, store_name, address, contact_number, industry_type, profile_image_url, logo_url, slug")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!m) { navigate("/get-started"); return; }
    setMerchant(m as MerchantData);
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
    toast.success("Password updated"); setNewPassword(""); setConfirmPassword("");
  };

  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !bizForm.store_name.trim()) { toast.error("Store name is required"); return; }
    if (bizForm.contact_number.trim()) {
      const AU_PHONE_REGEX = /^(?:\+?61|0)[2-478](?:[ -]?\d){8}$/;
      const normalized = bizForm.contact_number.replace(/[\s\-()]/g, "");
      if (!AU_PHONE_REGEX.test(normalized)) {
        toast.error("Enter a valid Australian phone (e.g. +61 400 000 000 or 0400 000 000)");
        return;
      }
    }
    setSavingBiz(true);
    const payload: Record<string, unknown> = {
      store_name: bizForm.store_name.trim(),
      address: bizForm.address.trim() || null,
      contact_number: bizForm.contact_number.trim() || null,
      industry_type: bizForm.industry_type || null,
    };
    if (bizCoords.lat != null && bizCoords.lng != null) {
      payload.latitude = bizCoords.lat;
      payload.longitude = bizCoords.lng;
    }
    const { error } = await supabase.from("merchants").update(payload as any).eq("id", merchant.id);
    if (error) { setSavingBiz(false); toast.error(error.message); return; }
    setMerchant((prev) => prev ? { ...prev, ...bizForm } : prev);
    toast.success("Business info updated");

    // Fallback: if user typed but didn't pick a suggestion, try geocoding the raw text
    if (bizForm.address.trim() && (bizCoords.lat == null || bizCoords.lng == null)) {
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
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) { setUploading(false); toast.error("Not authenticated"); return; }
    const path = `${userId}/profile.${ext}`;
    const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    const { error: updateError } = await supabase.from("merchants").update({ profile_image_url: urlData.publicUrl }).eq("id", merchant.id);
    setUploading(false);
    if (updateError) { toast.error("Failed to save"); return; }
    setMerchant((prev) => prev ? { ...prev, profile_image_url: urlData.publicUrl } : prev);
    toast.success("Profile image updated");
  };

  const handleDeletePhoto = async () => {
    if (!merchant) return;
    const { error } = await supabase.from("merchants").update({ profile_image_url: null } as any).eq("id", merchant.id);
    if (error) { toast.error("Failed to delete"); return; }
    setMerchant(prev => prev ? { ...prev, profile_image_url: null } : prev);
    toast.success("Profile photo removed");
  };

  const handleDeleteLogo = async () => {
    if (!merchant) return;
    const { error } = await supabase.from("merchants").update({ logo_url: null } as any).eq("id", merchant.id);
    if (error) { toast.error("Failed to delete"); return; }
    setMerchant(prev => prev ? { ...prev, logo_url: null } : prev);
    toast.success("Logo removed");
  };

  const handleDeleteSubscription = async () => {
    if (!merchant) return;
    setDeletingSub(true);
    const { error } = await supabase
      .from("merchant_subscriptions")
      .update({ current_plan: "free", status: "active", stripe_subscription_id: null, stripe_customer_id: null })
      .eq("merchant_id", merchant.id);
    setDeletingSub(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Subscription cancelled. You're now on the Free plan.");
    setShowDeleteSubDialog(false);
    window.location.reload();
  };

  const handleTabChange = setTab;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading settings...</p></div>;
  }
  if (!merchant) return null;

  const includedFeatures = FEATURE_CATALOG.filter((f) => canAccess(f.key));
  const lockedFeatures = FEATURE_CATALOG.filter((f) => !canAccess(f.key) && f.minimumPlan !== "free");

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchant.id} />
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Settings</h1>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="qr">Counter QR</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="pos">POS</TabsTrigger>
                <TabsTrigger value="subscription">Plan</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              {/* Business */}
              <TabsContent value="business">
                <form onSubmit={handleBusinessSave} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Building2 size={18} className="text-secondary" /> Business Information</h2>
                  <div className="space-y-2"><Label htmlFor="store_name">Store Name</Label><Input id="store_name" value={bizForm.store_name} onChange={(e) => setBizForm((p) => ({ ...p, store_name: e.target.value }))} required /></div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5"><MapPin size={12} /> Address</Label>
                    <AddressAutocomplete
                      id="address"
                      value={bizForm.address}
                      onChange={(v) => { setBizForm((p) => ({ ...p, address: v })); setBizCoords({ lat: null, lng: null }); }}
                      onSelect={(s) => { setBizForm((p) => ({ ...p, address: s.display_name })); setBizCoords({ lat: s.latitude, lng: s.longitude }); }}
                      placeholder="Start typing your address…"
                      withIcon={false}
                    />
                    <p className="text-[10px] text-muted-foreground">Pick a suggestion so customers can find you on the map.</p>
                  </div>
                  <div className="space-y-2"><Label htmlFor="contact_number" className="flex items-center gap-1.5"><Phone size={12} /> Contact Number</Label><Input id="contact_number" type="tel" inputMode="tel" placeholder="0400 000 000 or +61 400 000 000" value={bizForm.contact_number} onChange={(e) => setBizForm((p) => ({ ...p, contact_number: e.target.value }))} /><p className="text-[10px] text-muted-foreground">Australian numbers only.</p></div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Building2 size={12} /> Industry Type</Label>
                    <Select value={bizForm.industry_type} onValueChange={(v) => setBizForm((p) => ({ ...p, industry_type: v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" variant="hero" className="w-full gap-2" disabled={savingBiz}><Save size={16} /> {savingBiz ? "Saving..." : "Save Changes"}</Button>
                </form>
              </TabsContent>

              {/* Profile */}
              <TabsContent value="profile">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2"><User size={18} className="text-secondary" /> Profile</h2>
                  
                  {/* Profile Photo */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Image size={14} className="text-muted-foreground" />
                      <Label className="text-sm font-semibold">Profile Photo</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recommended: 400×400px, square, JPG/PNG, max 2MB</p>
                    <div className="flex items-center gap-4">
                      {merchant.profile_image_url ? (
                        <img src={merchant.profile_image_url} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-secondary/15 flex items-center justify-center"><User size={32} className="text-secondary" /></div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors">
                            <Upload size={14} />{uploading ? "Uploading..." : "Upload Photo"}
                          </div>
                        </label>
                        {merchant.profile_image_url && (
                          <button onClick={handleDeletePhoto} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 size={12} /> Delete Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Logo */}
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <Label className="text-sm font-semibold">Business Logo</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recommended: 200×200px, square with transparent background, PNG, max 2MB. Appears on dashboard banner and customer cards.</p>
                    <div className="flex items-center gap-4">
                      {merchant.logo_url ? (
                        <img src={merchant.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain border border-border bg-background p-1" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted/40 flex items-center justify-center border border-border/50"><Building2 size={24} className="text-muted-foreground/40" /></div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file || !merchant) return;
                            if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
                            setUploading(true); const ext = file.name.split(".").pop();
                            const userId = (await supabase.auth.getUser()).data.user?.id;
                            if (!userId) { setUploading(false); toast.error("Not authenticated"); return; }
                            const path = `${userId}/logo.${ext}`;
                            const { error: upErr } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
                            if (upErr) { setUploading(false); toast.error("Upload failed"); return; }
                            const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
                            await supabase.from("merchants").update({ logo_url: urlData.publicUrl } as any).eq("id", merchant.id);
                            setMerchant(prev => prev ? { ...prev, logo_url: urlData.publicUrl } : prev);
                            setUploading(false); toast.success("Logo uploaded");
                          }} />
                          <div className="flex items-center gap-2 text-sm text-secondary font-semibold hover:text-secondary/80 transition-colors">
                            <Upload size={14} />{uploading ? "Uploading..." : "Upload Logo"}
                          </div>
                        </label>
                        {merchant.logo_url && (
                          <button onClick={handleDeleteLogo} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 size={12} /> Delete Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center border-t border-border/50 pt-4">
                    <p className="text-sm font-semibold text-foreground">{merchant.store_name}</p>
                    <p className="text-xs text-muted-foreground">{merchant.industry_type || "Business"}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Counter QR */}
              <TabsContent value="qr">
                <CounterQrPoster storeName={merchant.store_name} slug={merchant.slug} logoUrl={merchant.logo_url} />
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

                    {/* Plan Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="hero" className="flex-1 gap-2" onClick={() => navigate("/pricing")}>
                        <ArrowUpRight size={16} /> Change Plan
                      </Button>
                      {plan !== "free" && (
                        <Button variant="outline" className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setShowDeleteSubDialog(true)}>
                          <Trash2 size={16} /> Cancel Subscription
                        </Button>
                      )}
                    </div>

                    {plan === "free" && (
                      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 text-center space-y-3">
                        <p className="text-sm font-semibold text-foreground">Unlock more features with Growth or Pro</p>
                        <p className="text-xs text-muted-foreground">Campaigns, rewards, analytics, and more.</p>
                        <Button variant="hero" size="sm" className="gap-1.5" onClick={() => navigate("/pricing")}>
                          <ArrowUpRight size={14} /> View Plans
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Account */}
              <TabsContent value="account">
                <div className="bg-card rounded-2xl p-6 shadow-card border-2 border-destructive/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-destructive" />
                    <h2 className="text-base font-bold text-destructive">Danger Zone</h2>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Delete account</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently delete your merchant account, all customer relationships, transactions, campaigns, and rewards.
                      Your active subscription will be cancelled. This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowDeleteAccountDialog(true)}
                  >
                    <Trash2 size={14} /> Delete my account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Subscription Confirmation */}
      <Dialog open={showDeleteSubDialog} onOpenChange={setShowDeleteSubDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle size={18} className="text-destructive" /> Cancel Subscription</DialogTitle>
            <DialogDescription>Are you sure you want to cancel? You'll be downgraded to the Free plan. Your data won't be deleted, but you'll lose access to premium features.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteSubDialog(false)}>Keep Plan</Button>
            <Button variant="destructive" className="flex-1 gap-1.5" onClick={handleDeleteSubscription} disabled={deletingSub}>
              {deletingSub ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account (with friction) */}
      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        accountType="merchant"
      />
    </div>
  );
};

export default MerchantSettings;
