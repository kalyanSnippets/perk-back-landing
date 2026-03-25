import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
}

const Barcode = ({ value, width = 2, height = 80 }: BarcodeProps) => {
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
          margin: 10,
          background: "transparent",
          lineColor: "#0A2472",
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} />;
};

export default Barcode;
