import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PrototypeDevice, PrototypeFlow } from "@/lib/prototypeScreens";

interface PrototypeControlsProps {
  device: PrototypeDevice;
  flow: PrototypeFlow;
  onFlowChange: (flow: PrototypeFlow) => void;
}

const flows: { key: PrototypeFlow; label: string; device: PrototypeDevice; icon: typeof Smartphone }[] = [
  { key: "customer-mobile", label: "Customer Mobile", device: "mobile", icon: Smartphone },
  { key: "merchant-tablet", label: "Merchant Tablet", device: "tablet", icon: Tablet },
  { key: "merchant-desktop", label: "Merchant Desktop", device: "desktop", icon: Monitor },
  { key: "marketing-desktop", label: "Marketing Desktop", device: "desktop", icon: Monitor },
];

export const PrototypeControls = ({ device, flow, onFlowChange }: PrototypeControlsProps) => (
  <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {flows.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.key}
            type="button"
            size="sm"
            variant={flow === item.key ? "default" : "outline"}
            className={cn("min-h-11 rounded-full px-3", device === item.device && flow !== item.key && "border-primary/40")}
            onClick={() => onFlowChange(item.key)}
          >
            <Icon className="h-4 w-4" /> {item.label}
          </Button>
        );
      })}
    </div>
  </div>
);
