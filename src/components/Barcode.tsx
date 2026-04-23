import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

const Barcode = ({ value, width = 1.6, height = 60, className }: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue: true,
          fontSize: 13,
          textMargin: 8,
          margin: 0,
          background: "transparent",
          lineColor: "currentColor",
        });

        svgRef.current.setAttribute("width", String(188));
        svgRef.current.setAttribute("height", String(height + 34));
        svgRef.current.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svgRef.current.style.display = "block";
        svgRef.current.style.shapeRendering = "crispEdges";
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className={className} role="img" aria-label="Loyalty barcode" />;
};

export default Barcode;
