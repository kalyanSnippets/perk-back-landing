import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddressSuggestion {
  display_name: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** Show MapPin icon inside the input on the left */
  withIcon?: boolean;
}

const AddressAutocomplete = ({
  id,
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address…",
  required,
  className,
  withIcon = true,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const lastFetchedRef = useRef<string>("");
  const justSelectedRef = useRef(false);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (query === lastFetchedRef.current) return;
    lastFetchedRef.current = query;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-address", {
        body: { address: query, mode: "suggest" },
      });
      if (error) throw error;
      const list: AddressSuggestion[] = (data as any)?.suggestions || [];
      setSuggestions(list);
      setOpen(list.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(value);
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  const handleSelect = (s: AddressSuggestion) => {
    justSelectedRef.current = true;
    onChange(s.display_name);
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {withIcon && (
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" size={18} />
      )}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        className={cn(withIcon && "pl-10", "pr-9")}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={16} />
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={`${s.display_name}-${i}`}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 text-xs flex items-start gap-2 transition-colors border-b border-border/30 last:border-b-0",
                activeIndex === i ? "bg-muted text-foreground" : "hover:bg-muted/50 text-foreground/80"
              )}
            >
              <MapPin size={12} className="mt-0.5 shrink-0 text-secondary" />
              <span className="break-words">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
