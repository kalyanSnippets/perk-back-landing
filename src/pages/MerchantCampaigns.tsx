import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

const MerchantCampaigns = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);
      await fetchCampaigns(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchCampaigns = async (mId: string) => {
    const { data } = await supabase.from("campaigns").select("*").eq("merchant_id", mId).order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("campaigns").insert({ merchant_id: merchantId, title: title.trim(), description: description.trim() || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign created");
    setTitle(""); setDescription(""); setShowForm(false);
    await fetchCampaigns(merchantId);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("campaigns").update({ active: !current }).eq("id", id);
    if (merchantId) await fetchCampaigns(merchantId);
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    if (merchantId) await fetchCampaigns(merchantId);
    toast.success("Campaign deleted");
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  const hasAccess = canAccess("campaigns");

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchantId} />
          <div className="flex-1 max-w-3xl space-y-4">
            {!hasAccess ? (
              <LockedFeature featureKey="campaigns" />
            ) : (
              <>
                <ScrollReveal>
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
                    <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                      <Plus size={14} /> New
                    </Button>
                  </div>
                </ScrollReveal>

                {showForm && (
                  <form onSubmit={handleCreate} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                    <Input placeholder="Campaign title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" variant="hero" size="sm" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
                    </div>
                  </form>
                )}

                <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No campaigns yet</p>
                    </div>
                  ) : (
                    campaigns.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground">{c.title}</p>
                          {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-3">
                          <button onClick={() => toggleActive(c.id, c.active)} className="text-muted-foreground hover:text-foreground">
                            {c.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                          </button>
                          <button onClick={() => deleteCampaign(c.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantCampaigns;
