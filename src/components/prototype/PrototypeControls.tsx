import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PrototypeDevice, PrototypeFlow } from "@/lib/prototypeScreens";

interface PrototypeControlsProps {
  device: PrototypeDevice;
  flow: PrototypeFlow;
  onDeviceChange: (device: PrototypeDevice) => void;
  onFlowChange: (flow: PrototypeFlow) => void;
}

const flows: { key: PrototypeFlow; label: string; devices: PrototypeDevice[] }[] = [
  { key: "customer", label: "Customer", devices: ["mobile"] },
  { key: "merchant", label: "Merchant", devices: ["mobile"] },
  { key: "marketing", label: "SaaS Desktop", devices: ["desktop"] },
];

export const PrototypeControls = ({ device, flow, onDeviceChange, onFlowChange }: PrototypeControlsProps) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
    <div className="flex rounded-full bg-muted p-1">
      <Button type="button" size="sm" variant={device === "mobile" ? "default" : "ghost"} className="rounded-full" onClick={() => onDeviceChange("mobile")}>
        <Smartphone className="h-4 w-4" /> Mobile
      </Button>
      <Button type="button" size="sm" variant={device === "desktop" ? "default" : "ghost"} className="rounded-full" onClick={() => onDeviceChange("desktop")}>
        <Monitor className="h-4 w-4" /> Desktop
      </Button>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {flows.map((item) => (
        <Button
          key={item.key}
          type="button"
          size="sm"
          variant={flow === item.key ? "secondary" : "outline"}
          className={cn("rounded-full px-3", !item.devices.includes(device) && "opacity-60")}
          onClick={() => {
            if (!item.devices.includes(device)) onDeviceChange(item.devices[0]);
            onFlowChange(item.key);
          }}
        >
          {item.label}
        </Button>
      ))}
    </div>
  </div>
);
