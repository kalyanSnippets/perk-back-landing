import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, CreditCard, Smartphone } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import { getDeviceType } from "@/lib/deviceDetection";

const CustomerConfirmation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [walletLoading, setWalletLoading] = useState<string | null>(null);
  const deviceType = getDeviceType();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/customer/auth");
      return;
    }
    // Check if already has card
    const { data: customer } = await supabase
      .from("customers")
      .select("loyalty_card_number")
      .eq("user_id", user.id)
      .maybeSingle();
    if (customer?.loyalty_card_number) {
      navigate("/customer/access-card");
      return;
    }
    setChecking(false);
  };

  const generateUniqueNumber = async (length: number, field: "crn" | "loyalty_card_number"): Promise<string> => {
    let unique = false;
    let number = "";
    while (!unique) {
      number = Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq(field, number)
        .maybeSingle();
      if (!data) unique = true;
    }
    return number;
  };

  const handleGenerateCard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check again if already has card
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("loyalty_card_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingCustomer?.loyalty_card_number) {
        navigate("/customer/access-card");
        return;
      }

      const crn = await generateUniqueNumber(5, "crn");
      const loyaltyCardNumber = await generateUniqueNumber(10, "loyalty_card_number");

      const { error } = await supabase
        .from("customers")
        .update({
          crn,
          loyalty_card_number: loyaltyCardNumber,
          card_issued_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        // Unique constraint violation — card already generated (race condition)
        if (error.code === "23505") {
          navigate("/customer/access-card");
          return;
        }
        throw error;
      }

      toast.success("Your loyalty card has been generated!");
      navigate("/customer/access-card");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate card");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-accent to-gold flex items-center justify-center animate-fade-up">
          <Sparkles className="text-accent-foreground" size={40} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up-delay-1">
          Welcome to <img src={perkbackLogo} alt="Perk Back" className="h-8 sm:h-9 w-auto inline" />!
        </h1>
        <p className="text-lg text-muted-foreground mb-10 animate-fade-up-delay-2">
          Your loyalty journey starts now. Generate your digital loyalty card to start earning
          points, stamps, and exclusive rewards.
        </p>
        <div className="animate-fade-up-delay-3">
          <Button
            variant="hero"
            size="xl"
            onClick={handleGenerateCard}
            disabled={loading}
            className="gap-3"
          >
            <CreditCard size={22} />
            {loading ? "Generating..." : "Generate My Loyalty Card"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerConfirmation;
