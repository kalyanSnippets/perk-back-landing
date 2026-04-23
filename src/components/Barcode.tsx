import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

const Barcode = ({ value, width = 1.34, height = 50, className }: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!value) {
      svg.innerHTML = "";
      setHasError(false);
      return;
    }

    try {
      setHasError(false);
      JsBarcode(svg, value, {
        format: "CODE128",
        width,
        height,
        displayValue: true,
        fontSize: 11,
        textMargin: 6,
        margin: 8,
        background: "hsl(var(--background))",
        lineColor: "hsl(var(--foreground))",
      });

      const nativeWidth = Math.max(Math.round(value.length * width * 15 + 32), 168);
      const nativeHeight = Math.round(height + 34);

      svg.setAttribute("viewBox", `0 0 ${nativeWidth} ${nativeHeight}`);
      svg.setAttribute("width", String(nativeWidth));
      svg.setAttribute("height", String(nativeHeight));
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.display = "block";
      svg.style.width = "100%";
      svg.style.height = `${nativeHeight}px`;
      svg.style.shapeRendering = "crispEdges";
      svg.style.textRendering = "geometricPrecision";
      svg.style.overflow = "hidden";
      svg.style.transform = "translateZ(0)";
    } catch (error) {
      svg.innerHTML = "";
      setHasError(true);
    }
  }, [value, width, height]);

  if (!value || hasError) {
    return (
      <div className={className} role="img" aria-label="Loyalty barcode unavailable">
        <div className="flex h-[84px] w-full flex-col items-center justify-center rounded-[14px] bg-background px-3 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Barcode unavailable</span>
          <span className="mt-1 text-[11px] leading-tight text-muted-foreground">Card is still loading</span>
        </div>
      </div>
    );
  }

  return <svg ref={svgRef} className={className} role="img" aria-label="Loyalty barcode" />;
};

export default Barcode;
