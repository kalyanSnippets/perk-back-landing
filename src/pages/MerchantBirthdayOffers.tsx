import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Cake } from "lucide-react";
import Header from "@/components/Header";
import MerchantNav from "@/components/merchant/MerchantNav";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const MerchantBirthdayOffers = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <MerchantNav merchantId={merchantId} />
          <div className="flex-1 max-w-3xl">
            {!canAccess("birthday_offers") ? (
              <LockedFeature featureKey="birthday_offers" />
            ) : (
              <ScrollReveal>
                <h1 className="text-xl font-bold text-foreground mb-4">Birthday Offers</h1>
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card text-center">
                  <Cake size={40} className="mx-auto mb-3 text-secondary/40" />
                  <p className="text-sm text-muted-foreground">Birthday offers coming soon.</p>
                  <p className="text-xs text-muted-foreground mt-1">Send automatic birthday rewards to keep customers feeling special.</p>
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantBirthdayOffers;
