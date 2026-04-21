import { ArrowRight, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceFrame } from "./DeviceFrame";
import { PrototypeControls } from "./PrototypeControls";
import { PrototypeNav } from "./PrototypeNav";
import type { PrototypeDevice, PrototypeFlow, PrototypeScreen } from "@/lib/prototypeScreens";

interface PrototypeShellProps {
  device: PrototypeDevice;
  flow: PrototypeFlow;
  screens: PrototypeScreen[];
  activeScreen: PrototypeScreen;
  onFlowChange: (flow: PrototypeFlow) => void;
  onScreenChange: (screenId: string) => void;
  children: React.ReactNode;
}

const flowLabels: Record<PrototypeFlow, string> = {
  "customer-join": "Customer First-Touch",
  "customer-mobile": "Customer Mobile",
  "merchant-tablet": "Merchant Tablet",
  "merchant-desktop": "Merchant Desktop",
  "marketing-desktop": "Marketing Desktop",
};

export const PrototypeShell = ({ device, flow, screens, activeScreen, onFlowChange, onScreenChange, children }: PrototypeShellProps) => (
  <main className="min-h-screen overflow-hidden bg-background">
    <section className="relative border-b border-border bg-gradient-to-br from-background via-muted/40 to-background px-4 py-6 lg:px-8">
      <div className="gradient-blob -left-24 -top-24 h-72 w-72 bg-primary/20" />
      <div className="gradient-blob -right-24 top-10 h-80 w-80 bg-accent/20" />
      <div className="relative mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground shadow-card">
              <Sparkles className="h-3.5 w-3.5 text-accent-deep" /> High-fidelity prototype
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">PerkBack customer wallet and merchant OS</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">Customer mobile journeys, merchant tablet counter flows, and desktop command-centre screens.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <a href="/perkback-saas-loyalty-prototypes.pdf" onClick={(event) => event.preventDefault()} aria-disabled="true">
              <Download className="h-4 w-4" /> Boards pending
            </a>
          </Button>
        </div>
        <PrototypeControls device={device} flow={flow} onFlowChange={onFlowChange} />
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_1fr] lg:px-8">
      <PrototypeNav screens={screens} activeScreenId={activeScreen.id} onSelect={onScreenChange} />
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">{device} · {flowLabels[flow]}</p>
            <h2 className="text-2xl font-black text-foreground">{activeScreen.title}</h2>
            <p className="text-sm text-muted-foreground">{activeScreen.description}</p>
          </div>
          {activeScreen.ctaTarget && (
            <Button type="button" className="rounded-full" onClick={() => onScreenChange(activeScreen.ctaTarget!)}>
              {activeScreen.ctaLabel ?? "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DeviceFrame device={device}>{children}</DeviceFrame>
      </div>
    </section>
  </main>
);
