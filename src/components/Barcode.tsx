import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

const Barcode = ({ value, width = 2, height = 80, className }: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue: true,
          fontSize: 14,
          margin: 12,
          background: "#FFFFFF",
          lineColor: "#000000",
        });

        svgRef.current.setAttribute("width", "100%");
        svgRef.current.setAttribute("height", String(height + 44));
        svgRef.current.setAttribute("preserveAspectRatio", "xMidYMid meet");
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className={className} role="img" aria-label="Loyalty barcode" />;
};

export default Barcode;
