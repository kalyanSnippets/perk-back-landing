import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PrototypeScreen } from "@/lib/prototypeScreens";

interface PrototypeScreenCardProps {
  screen: PrototypeScreen;
  active: boolean;
  onSelect: (screenId: string) => void;
}

export const PrototypeScreenCard = ({ screen, active, onSelect }: PrototypeScreenCardProps) => {
  const Icon = screen.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(screen.id)}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition-all duration-200 ease-apple",
        active ? "border-primary bg-primary/10 shadow-card" : "border-border bg-card hover:border-primary/50 hover:shadow-card",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Step {screen.step}</div>
          <div className="truncate text-sm font-bold text-foreground">{screen.title}</div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{screen.description}</p>
      {screen.ctaTarget && active && <Button type="button" size="sm" className="mt-3 w-full rounded-full">{screen.ctaLabel ?? "Continue"}</Button>}
    </button>
  );
};
