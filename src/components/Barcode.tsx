import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

const Barcode = ({ value, width = 1.34, height = 50, className }: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!value) {
      svg.innerHTML = "";
      return;
    }

    try {
      JsBarcode(svg, value, {
        format: "CODE128",
        width,
        height,
        displayValue: true,
        fontSize: 11,
        textMargin: 6,
        margin: 0,
        background: "#ffffff",
        lineColor: "currentColor",
      });

      const bounds = svg.getBBox();
      const nativeWidth = Math.ceil(bounds.width);
      const nativeHeight = Math.ceil(bounds.height);

      svg.setAttribute("viewBox", `0 0 ${nativeWidth} ${nativeHeight}`);
      svg.setAttribute("width", String(nativeWidth));
      svg.setAttribute("height", String(nativeHeight));
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.display = "block";
      svg.style.width = `${nativeWidth}px`;
      svg.style.height = `${nativeHeight}px`;
      svg.style.maxWidth = "100%";
      svg.style.shapeRendering = "crispEdges";
      svg.style.textRendering = "geometricPrecision";
      svg.style.overflow = "visible";
    } catch (error) {
      console.error("Barcode generation error:", error);
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className={className} role="img" aria-label="Loyalty barcode" />;
};

export default Barcode;
