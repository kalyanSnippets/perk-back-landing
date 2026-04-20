import type { PrototypeScreen } from "@/lib/prototypeScreens";
import { PrototypeScreenCard } from "./PrototypeScreenCard";

interface PrototypeNavProps {
  screens: PrototypeScreen[];
  activeScreenId: string;
  onSelect: (screenId: string) => void;
}

export const PrototypeNav = ({ screens, activeScreenId, onSelect }: PrototypeNavProps) => (
  <aside className="space-y-3 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
    <div>
      <p className="eyebrow">Prototype flow</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">Clickable screens</h2>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {screens.map((screen) => (
        <PrototypeScreenCard key={screen.id} screen={screen} active={screen.id === activeScreenId} onSelect={onSelect} />
      ))}
    </div>
  </aside>
);
