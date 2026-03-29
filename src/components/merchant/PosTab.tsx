import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wifi, WifiOff, ExternalLink, Trash2, Loader2 } from "lucide-react";

interface PosConnection {
  id: string;
  provider: string;
  is_active: boolean;
  location_id: string | null;
  connected_at: string | null;
}

interface PosTabProps {
  merchantId: string;
}

const PosTab = ({ merchantId }: PosTabProps) => {
  const [connection, setConnection] = useState<PosConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchConnection();
    // Check URL params for connection result
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
      .select("id, provider, is_active, location_id, connected_at")
      .eq("merchant_id", merchantId)
      .eq("provider", "square")
      .maybeSingle();
    setConnection(data);
    setLoading(false);
  };

  const handleConnect = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/square-oauth-callback`;
    // Redirect to an edge function that constructs the proper Square OAuth URL using server-side secrets
    const initiateUrl = `https://${projectId}.supabase.co/functions/v1/square-oauth-callback?initiate=true&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.open(initiateUrl, "_blank");
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
    toast.success("Square POS disconnected");
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
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
            {connection.connected_at && (
              <p className="text-xs text-muted-foreground">
                Connected: {new Date(connection.connected_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Customer purchases through Square will automatically award loyalty points.
          </p>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="gap-2"
          >
            <Trash2 size={14} />
            {disconnecting ? "Disconnecting..." : "Disconnect Square"}
          </Button>
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
  );
};

export default PosTab;
