import { type ElementType } from "react";
import { cn } from "@/lib/utils";

export interface FloatingBottomNavItem<K extends string = string> {
  key: K;
  label: string;
  icon: ElementType;
  onClick?: () => void;
  href?: string;
}

interface FloatingBottomNavProps<K extends string = string> {
  items: FloatingBottomNavItem<K>[];
  activeKey: K;
  onChange?: (key: K) => void;
  className?: string;
  /** When true, renders inline at bottom of layout instead of fixed pill. */
  inline?: boolean;
}

/**
 * Signature floating pill bottom-nav from the PerkBack prototype.
 * Rounded card, shadow-floating-nav, animated active pill behind icon+label.
 * Respects iOS safe-area via env(safe-area-inset-bottom).
 */
export function FloatingBottomNav<K extends string = string>({
  items,
  activeKey,
  onChange,
  className,
  inline = false,
}: FloatingBottomNavProps<K>) {
  return (
    <nav
      className={cn(
        !inline && "fixed left-1/2 -translate-x-1/2 z-40 w-[min(94vw,28rem)]",
        !inline && "bottom-3",
        "rounded-full bg-card/95 backdrop-blur-md border border-border/60 shadow-floating-nav",
        className,
      )}
      style={!inline ? { marginBottom: "env(safe-area-inset-bottom)" } : undefined}
      aria-label="Primary"
    >
      <ul className="flex items-center justify-between p-1">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  item.onClick?.();
                  onChange?.(item.key);
                }}
                className={cn(
                  "w-full h-12 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all duration-300 ease-apple",
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-button"
                    : "text-muted-foreground hover:text-foreground active:scale-95",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-[17px] h-[17px]" />
                <span className={cn("transition-all", isActive ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0 overflow-hidden")}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default FloatingBottomNav;
