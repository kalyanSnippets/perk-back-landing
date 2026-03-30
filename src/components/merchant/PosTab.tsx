import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Wifi, WifiOff, ExternalLink, Trash2, Loader2, RefreshCw, FlaskConical, Clock, Send } from "lucide-react";

interface PosConnection {
  id: string;
  provider: string;
  is_active: boolean;
  location_id: string | null;
  connected_at: string | null;
  provider_account_id: string | null;
}

interface PosTabProps {
  merchantId: string;
}

const PosTab = ({ merchantId }: PosTabProps) => {
  const [connection, setConnection] = useState<PosConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testCardNumber, setTestCardNumber] = useState("");
  const [testAmount, setTestAmount] = useState("");
  const [testSubmitting, setTestSubmitting] = useState(false);

  useEffect(() => {
    fetchConnection();
    const params = new URLSearchParams(window.location.search);
    if (params.get("pos_connected") === "true") {
      toast.success("Square POS connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
      fetchConnection();
    }
    const posError = params.get("pos_error");
    if (posError) {
      const messages: Record<string, string> = {
        missing_params: "Missing authorization parameters",
        server_config: "Server configuration error",
        token_exchange_failed: "Failed to connect with Square",
        db_error: "Failed to save connection",
        unexpected: "An unexpected error occurred",
      };
      toast.error(messages[posError] || `Connection error: ${posError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [merchantId]);

  const fetchConnection = async () => {
    const { data } = await supabase
      .from("pos_connections")
      .select("id, provider, is_active, location_id, connected_at, provider_account_id")
      .eq("merchant_id", merchantId)
      .eq("provider", "square")
      .maybeSingle();
    setConnection(data);
    setLoading(false);

    // Fetch last Square transaction sync time
    if (data?.is_active) {
      const { data: lastTx } = await supabase
        .from("transactions")
        .select("transaction_date")
        .eq("merchant_id", merchantId)
        .eq("source", "square")
        .order("transaction_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastSyncTime(lastTx?.transaction_date || null);
    }
  };

  const handleConnect = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/square-oauth-callback`;
    const initiateUrl = `https://${projectId}.supabase.co/functions/v1/square-oauth-callback?initiate=true&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.open(initiateUrl, "_blank");
  };

  const handleReconnect = () => {
    handleConnect();
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setDisconnecting(true);
    const { error } = await supabase
      .from("pos_connections")
      .delete()
      .eq("id", connection.id);
    setDisconnecting(false);
    if (error) {
      toast.error("Failed to disconnect");
      return;
    }
    setConnection(null);
    setLastSyncTime(null);
    toast.success("Square POS disconnected");
  };

  const handleTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCardNumber.trim() || !testAmount) return;

    setTestSubmitting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/pos-webhook`;

      const simulatedPayload = {
        type: "payment.completed",
        merchant_id: connection?.provider_account_id || null,
        data: {
          object: {
            payment: {
              id: `test_${Date.now()}`,
              location_id: connection?.location_id || "test_location",
              amount_money: {
                amount: Math.round(parseFloat(testAmount) * 100),
                currency: "AUD",
              },
              status: "COMPLETED",
              note: testCardNumber.trim(),
              customer_id: null,
            },
          },
        },
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedPayload),
      });

      const result = await response.json();

      if (result.matched) {
        toast.success(`Test successful! Awarded ${result.points_awarded} points for $${result.purchase_amount}`);
        setTestCardNumber("");
        setTestAmount("");
        fetchConnection();
      } else if (result.skipped && result.reason === "duplicate") {
        toast.info("Duplicate transaction — already processed");
      } else {
        toast.error(`Test result: ${result.reason || "Unknown issue"}`);
      }
    } catch (err) {
      toast.error("Failed to send test webhook");
    } finally {
      setTestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          {connection?.is_active ? (
            <Wifi size={18} className="text-green-500" />
          ) : (
            <WifiOff size={18} className="text-secondary" />
          )}
          POS Integration
        </h2>

        {connection?.is_active ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Square POS Connected
                </span>
              </div>
              {connection.location_id && (
                <p className="text-xs text-muted-foreground">
                  Location: {connection.location_id}
                </p>
              )}
              {connection.provider_account_id && (
                <p className="text-xs text-muted-foreground">
                  Square Merchant: {connection.provider_account_id}
                </p>
              )}
              {connection.connected_at && (
                <p className="text-xs text-muted-foreground">
                  Connected: {new Date(connection.connected_at).toLocaleDateString()}
                </p>
              )}
              {lastSyncTime && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  Last sync: {new Date(lastSyncTime).toLocaleString()}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Customer purchases through Square will automatically award loyalty points.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                className="gap-2"
              >
                <RefreshCw size={14} />
                Reconnect
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="gap-2"
              >
                <Trash2 size={14} />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Connect your Square POS
              </p>
              <p className="text-xs text-muted-foreground">
                Automatically award loyalty points when customers make purchases through your Square terminal.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                How it works
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Click "Connect Square" to authorize PerkBack</li>
                <li>Select your Square location</li>
                <li>Customer purchases will auto-sync points</li>
              </ol>
            </div>

            <Button
              variant="hero"
              className="w-full gap-2"
              onClick={handleConnect}
            >
              <ExternalLink size={16} />
              Connect Square
            </Button>
          </div>
        )}
      </div>

      {/* Test Mode Section */}
      {connection?.is_active && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FlaskConical size={16} className="text-secondary" />
              Test Mode
            </h3>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          {testMode && (
            <form onSubmit={handleTestWebhook} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Simulate a Square payment to test the loyalty points flow without a real transaction.
              </p>
              <div className="space-y-2">
                <Label htmlFor="testCard" className="text-xs">Loyalty Card Number</Label>
                <Input
                  id="testCard"
                  placeholder="Enter 10-digit card number"
                  value={testCardNumber}
                  onChange={(e) => setTestCardNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testAmount" className="text-xs">Purchase Amount ($)</Label>
                <Input
                  id="testAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10.50"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  required
                />
              </div>

              {testAmount && parseFloat(testAmount) > 0 && (
                <div className="bg-accent/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Points to award</p>
                  <p className="text-xl font-bold text-accent-foreground">
                    {Math.floor(parseFloat(testAmount))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">1 point per $1 spent</p>
                </div>
              )}

              <Button
                type="submit"
                size="sm"
                className="w-full gap-2"
                disabled={testSubmitting}
              >
                <Send size={14} />
                {testSubmitting ? "Sending..." : "Send Test Transaction"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PosTab;
