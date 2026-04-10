import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, QrCode, Loader2, CheckCircle, WifiOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NfcTapButtonProps {
  customerId: string;
  customerCardNumber: string;
}

const NfcTapButton = ({ customerId, customerCardNumber }: NfcTapButtonProps) => {
  const [nfcSupported, setNfcSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    // Check Web NFC support (Android Chrome only)
    setNfcSupported("NDEFReader" in window);
  }, []);

  const handleNfcTap = async () => {
    if (!nfcSupported) return;
    setScanning(true);

    try {
      // @ts-ignore - Web NFC API
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener("reading", async ({ message }: any) => {
        for (const record of message.records) {
          if (record.recordType === "text") {
            const decoder = new TextDecoder();
            const token = decoder.decode(record.data);

            // Call edge function to process the tap
            const { data, error } = await supabase.functions.invoke("process-nfc-tap", {
              body: { token, customer_id: customerId },
            });

            if (error || !data?.success) {
              toast.error(data?.error || "Failed to process tap");
            } else {
              if (data.completed) {
                toast.success(`🎉 Stamp card complete! You earned ${data.bonus_points} bonus points!`);
              } else {
                toast.success(`Stamp collected! ${data.stamps_collected}/${data.stamps_required}`);
              }
            }
            setScanning(false);
            return;
          }
        }
        toast.error("Invalid NFC tag");
        setScanning(false);
      });

      // Auto-timeout after 15 seconds
      setTimeout(() => {
        setScanning(false);
      }, 15000);
    } catch (err: any) {
      toast.error(err.message || "NFC scan failed");
      setScanning(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={14} className="text-secondary" />
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-foreground">Tap to Earn</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground"><Info size={11} /></button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-[10px]">
              NFC works on Android Chrome only. Hold your phone near the merchant's NFC tag at the counter. For iOS, use the QR fallback instead.
            </TooltipContent>
          </Tooltip>
        </div>
          <p className="text-[10px] text-muted-foreground">Collect stamps at the counter</p>
        </div>
      </div>

      <div className="flex gap-2">
        {nfcSupported ? (
          <Button
            variant="hero"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleNfcTap}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Hold near NFC tag...
              </>
            ) : (
              <>
                <Smartphone size={14} />
                Tap NFC Tag
              </>
            )}
          </Button>
        ) : (
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
            <WifiOff size={14} />
            NFC not available on this device
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowQr(!showQr)}
        >
          <QrCode size={14} />
          {showQr ? "Hide" : "QR"}
        </Button>
      </div>

      {/* QR Fallback - show customer's card number as QR for merchant to scan */}
      {showQr && (
        <div className="mt-3 bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Show this to the merchant to scan</p>
          <div className="bg-background rounded-xl p-4 inline-block">
            <p className="text-2xl font-mono font-bold text-foreground tracking-wider">{customerCardNumber}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Card Number: {customerCardNumber}</p>
        </div>
      )}
    </div>
  );
};

export default NfcTapButton;
