import { cn } from "@/lib/utils";
import type { PrototypeDevice } from "@/lib/prototypeScreens";

interface DeviceFrameProps {
  device: PrototypeDevice;
  children: React.ReactNode;
  className?: string;
}

export const DeviceFrame = ({ device, children, className }: DeviceFrameProps) => {
  if (device === "desktop") {
    return (
      <section className={cn("w-full overflow-hidden rounded-2xl border border-border bg-card shadow-hero", className)}>
        <div className="flex h-9 items-center gap-2 border-b border-border bg-muted/60 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-flash" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          <span className="ml-4 h-4 w-64 max-w-[45%] rounded-full bg-background" />
        </div>
        <div className="min-h-[680px] bg-background">{children}</div>
      </section>
    );
  }

  if (device === "tablet") {
    return (
      <section className={cn("mx-auto w-full max-w-[900px] rounded-[2rem] border border-border bg-card p-4 shadow-hero", className)}>
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-background">
          <div className="absolute left-1/2 top-3 z-10 h-2 w-24 -translate-x-1/2 rounded-full bg-foreground/80" />
          <div className="min-h-[680px] pt-6">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("mx-auto w-full max-w-[390px] rounded-[2.5rem] border border-border bg-card p-3 shadow-hero", className)}>
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-foreground/90" />
        <div className="min-h-[760px] pt-8">{children}</div>
      </div>
    </section>
  );
};
