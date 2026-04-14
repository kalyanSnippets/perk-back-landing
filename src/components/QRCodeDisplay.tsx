import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

const QRCodeDisplay = ({ value, size = 120 }: QRCodeDisplayProps) => {
  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="transparent"
        fgColor="#0A2472"
        includeMargin={false}
      />
      <p className="text-[10px] text-muted-foreground">Scan to identify</p>
    </div>
  );
};

export default QRCodeDisplay;
