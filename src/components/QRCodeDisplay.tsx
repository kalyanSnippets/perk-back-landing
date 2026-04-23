import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay = ({ value, size = 112, className }: QRCodeDisplayProps) => {
  const tileSize = size + 18;

  if (!value) {
    return (
      <div
        className={className}
        style={{ width: tileSize, height: tileSize, flex: "0 0 auto", transform: "translateZ(0)" }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] border border-border/50 bg-background px-3 text-center shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">QR unavailable</span>
          <span className="mt-1 text-[11px] leading-tight text-muted-foreground">Card is still loading</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: tileSize, height: tileSize, flex: "0 0 auto", transform: "translateZ(0)" }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[18px] border border-border/50 bg-background shadow-sm">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="hsl(var(--background))"
          fgColor="hsl(var(--foreground))"
          includeMargin={false}
          style={{
            display: "block",
            width: size,
            height: size,
            shapeRendering: "crispEdges",
            flex: "0 0 auto",
            color: "hsl(var(--foreground))",
            transform: "translateZ(0)",
          }}
        />
      </div>
    </div>
  );
};

export default QRCodeDisplay;
