import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay = ({ value, size = 112, className }: QRCodeDisplayProps) => {
  if (!value) return null;

  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="transparent"
        fgColor="currentColor"
        includeMargin={false}
        style={{ display: "block", height: size, width: size, shapeRendering: "crispEdges" }}
      />
    </div>
  );
};

export default QRCodeDisplay;
