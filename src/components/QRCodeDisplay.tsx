import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay = ({ value, size = 112, className }: QRCodeDisplayProps) => {
  if (!value) return null;

  const tileSize = size + 18;

  return (
    <div
      className={className}
      style={{ width: tileSize, height: tileSize, flex: "0 0 auto" }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[18px] border border-border/50 bg-card shadow-sm">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="currentColor"
          includeMargin={false}
          style={{
            display: "block",
            width: size,
            height: size,
            shapeRendering: "crispEdges",
            flex: "0 0 auto",
          }}
        />
      </div>
    </div>
  );
};

export default QRCodeDisplay;
