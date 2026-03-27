import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, LayoutDashboard } from "lucide-react";

const ChooseRole = () => {
  const navigate = useNavigate();
  const { isCustomer, isMerchant } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Choose your dashboard
          </h1>
          <p className="text-muted-foreground mb-8">
            You have both a customer and merchant account. Where would you like to go?
          </p>

          <div className="grid gap-4">
            {isCustomer && (
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
                onClick={() => navigate("/customer/access-card")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="text-primary" size={24} />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-foreground text-lg">Continue as Customer</h2>
                    <p className="text-sm text-muted-foreground">View your loyalty card, points & transactions</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isMerchant && (
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
                onClick={() => navigate("/merchant/dashboard")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="text-secondary" size={24} />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-foreground text-lg">Continue as Merchant</h2>
                    <p className="text-sm text-muted-foreground">Manage your store, transactions & settings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseRole;
