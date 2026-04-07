import { Coffee, ShoppingBag, UtensilsCrossed } from "lucide-react";

const INDUSTRIES = [
  { label: "All", value: null, icon: null },
  { label: "Coffee", value: "Coffee Shop", icon: Coffee },
  { label: "Retail", value: "Retail", icon: ShoppingBag },
  { label: "Restaurant", value: "Restaurant", icon: UtensilsCrossed },
];

interface IndustryFilterProps {
  selected: string | null;
  onChange: (value: string | null) => void;
}

const IndustryFilter = ({ selected, onChange }: IndustryFilterProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    {INDUSTRIES.map((ind) => {
      const isActive = selected === ind.value;
      const Icon = ind.icon;
      return (
        <button
          key={ind.label}
          onClick={() => onChange(ind.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {Icon && <Icon size={12} />}
          {ind.label}
        </button>
      );
    })}
  </div>
);

export default IndustryFilter;
