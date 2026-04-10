import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import LockedFeature from "@/components/merchant/LockedFeature";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface ProductOffer {
  id: string;
  product_name: string;
  sku: string | null;
  category: string | null;
  discount_type: string;
  discount_value: number;
  description: string | null;
  active: boolean;
  valid_from: string | null;
  valid_to: string | null;
}

interface ProductOffersTabProps {
  merchantId: string;
}

const ProductOffersTab = ({ merchantId }: ProductOffersTabProps) => {
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { canAccess } = useMerchantSubscription(merchantId);

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  useEffect(() => {
    fetchOffers();
  }, [merchantId]);

  const fetchOffers = async () => {
    const { data } = await supabase.from("product_offers").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
    setOffers((data || []) as ProductOffer[]);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("product_offers").insert({
      merchant_id: merchantId,
      product_name: productName.trim(),
      sku: sku.trim() || null,
      category: category.trim() || null,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 10,
      description: description.trim() || null,
      valid_from: validFrom || null,
      valid_to: validTo || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product offer created");
    resetForm();
    await fetchOffers();
  };

  const resetForm = () => {
    setProductName(""); setSku(""); setCategory(""); setDiscountType("percent");
    setDiscountValue("10"); setDescription(""); setValidFrom(""); setValidTo("");
    setShowForm(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("product_offers").update({ active: !current }).eq("id", id);
    await fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    await supabase.from("product_offers").delete().eq("id", id);
    await fetchOffers();
    toast.success("Offer deleted");
  };

  if (!canAccess("product_offers")) {
    return <LockedFeature featureKey="product_offers" />;
  }

  if (loading) return <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">Loading...</p>;

  const discountLabel = (type: string, value: number) => {
    if (type === "percent") return `${value}% off`;
    if (type === "fixed") return `$${value} off`;
    return "BOGO";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Product-Level Offers</p>
        <Button variant="hero" size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Offer
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
          <Input placeholder="Product name" value={productName} onChange={e => setProductName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="SKU (optional)" value={sku} onChange={e => setSku(e.target.value)} />
            <Input placeholder="Category (optional)" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Discount Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="bogo">Buy One Get One</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
              <Input type="number" min="0" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valid From</Label>
              <Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valid To</Label>
              <Input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="hero" size="sm" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/40">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No product offers yet</p>
          </div>
        ) : (
          offers.map(o => (
            <div key={o.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">{o.product_name}</p>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {discountLabel(o.discount_type, o.discount_value)}
                  </span>
                </div>
                {o.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{o.description}</p>}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  {o.sku && <span>SKU: {o.sku}</span>}
                  {o.category && <span>· {o.category}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-3">
                <button onClick={() => toggleActive(o.id, o.active)} className="text-muted-foreground hover:text-foreground">
                  {o.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => deleteOffer(o.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductOffersTab;
