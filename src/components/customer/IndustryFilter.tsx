import { Coffee, ShoppingBag, UtensilsCrossed, Store } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  coffee: Coffee,
  retail: ShoppingBag,
  restaurant: UtensilsCrossed,
};

function getIcon(industry: string): React.ElementType {
  const lower = industry.toLowerCase();
  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(keyword)) return icon;
  }
  return Store;
}

interface IndustryFilterProps {
  selected: string | null;
  onChange: (value: string | null) => void;
  industries: string[];
}

const IndustryFilter = ({ selected, onChange, industries }: IndustryFilterProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    <button
      onClick={() => onChange(null)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        selected === null
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      }`}
    >
      All
    </button>
    {industries.map((ind) => {
      const isActive = selected === ind;
      const Icon = getIcon(ind);
      return (
        <button
          key={ind}
          onClick={() => onChange(ind)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Icon size={12} />
          {ind}
        </button>
      );
    })}
  </div>
);

export default IndustryFilter;
