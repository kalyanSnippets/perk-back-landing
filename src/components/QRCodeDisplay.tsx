import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay = ({ value, size = 120, className }: QRCodeDisplayProps) => {
  if (!value) return null;

  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="#FFFFFF"
        fgColor="#000000"
        includeMargin={false}
      />
    </div>
  );
};

export default QRCodeDisplay;
