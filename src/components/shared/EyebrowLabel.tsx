import { cn } from "@/lib/utils";

interface EyebrowLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Small uppercase tracked label used above section titles, hero numbers,
 * stat cards, etc. Mirrors the prototype's signature eyebrow style.
 */
export const EyebrowLabel = ({ className, children, ...props }: EyebrowLabelProps) => (
  <div
    className={cn(
      "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default EyebrowLabel;
