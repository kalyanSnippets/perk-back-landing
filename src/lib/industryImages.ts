// Shared industry → image mapping for cards, banners, etc.
// All URLs are royalty-free Unsplash images.

const COFFEE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop";
const RESTAURANT = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80&auto=format&fit=crop";
const RETAIL = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&auto=format&fit=crop";
const BEAUTY = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop";
const BAKERY = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80&auto=format&fit=crop";
const DEFAULT_IMG = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80&auto=format&fit=crop";

export const getIndustryImage = (industryType?: string | null): string => {
  if (!industryType) return DEFAULT_IMG;
  const t = industryType.toLowerCase();
  if (t.includes("coffee") || t.includes("cafe")) return COFFEE;
  if (t.includes("restaurant") || t.includes("food") || t.includes("dining")) return RESTAURANT;
  if (t.includes("retail") || t.includes("shop") || t.includes("store")) return RETAIL;
  if (t.includes("beauty") || t.includes("salon") || t.includes("spa")) return BEAUTY;
  if (t.includes("bakery") || t.includes("dessert")) return BAKERY;
  return DEFAULT_IMG;
};

export const getIndustryAccent = (industryType?: string | null): { from: string; to: string; badge: string } => {
  if (!industryType) return { from: "from-primary", to: "to-secondary", badge: "bg-primary/10 text-primary" };
  const t = industryType.toLowerCase();
  if (t.includes("coffee") || t.includes("cafe")) return { from: "from-amber-500", to: "to-orange-400", badge: "bg-amber-100 text-amber-700" };
  if (t.includes("restaurant") || t.includes("food")) return { from: "from-emerald-500", to: "to-teal-400", badge: "bg-emerald-100 text-emerald-700" };
  if (t.includes("retail") || t.includes("shop")) return { from: "from-blue-500", to: "to-indigo-400", badge: "bg-blue-100 text-blue-700" };
  if (t.includes("beauty") || t.includes("salon")) return { from: "from-pink-500", to: "to-rose-400", badge: "bg-pink-100 text-pink-700" };
  if (t.includes("bakery") || t.includes("dessert")) return { from: "from-yellow-500", to: "to-amber-400", badge: "bg-yellow-100 text-yellow-700" };
  return { from: "from-primary", to: "to-secondary", badge: "bg-primary/10 text-primary" };
};
