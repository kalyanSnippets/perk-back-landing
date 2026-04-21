import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import perkbackLogo from "@/assets/perkback-logo-224.webp";

interface CounterQrPosterProps {
  storeName: string;
  slug: string | null;
  logoUrl: string | null;
}

const CounterQrPoster = ({ storeName, slug, logoUrl }: CounterQrPosterProps) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const joinUrl = slug ? `${window.location.origin}/join/${slug}` : "";

  const handleDownload = async () => {
    if (!slug) {
      toast.error("Save your business info first to generate a poster");
      return;
    }
    setDownloading(true);
    try {
      // Render the SVG-based poster to PNG via canvas
      const node = posterRef.current;
      if (!node) throw new Error("Poster not ready");
      const svg = node.querySelector("svg");
      if (!svg) throw new Error("QR not ready");

      const W = 1200;
      const H = 1600;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#0A2472");
      g.addColorStop(1, "#1E3A8A");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // White card
      const cardX = 80, cardY = 200, cardW = W - 160, cardH = H - 360;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, cardX, cardY, cardW, cardH, 56);
      ctx.fill();

      // Eyebrow
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 36px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("POWERED BY PERKBACK", W / 2, cardY + 110);

      // Headline
      ctx.fillStyle = "#0A2472";
      ctx.font = "900 96px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("Scan to join", W / 2, cardY + 230);
      ctx.fillText(storeName.length > 22 ? storeName.slice(0, 22) + "…" : storeName, W / 2, cardY + 340);

      // Render QR SVG → image
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const qrImg = await loadImage(svgUrl);
      const qrSize = 720;
      const qrX = (W - qrSize) / 2;
      const qrY = cardY + 400;
      // White rounded panel behind QR
      ctx.fillStyle = "#F1F5F9";
      roundRect(ctx, qrX - 32, qrY - 32, qrSize + 64, qrSize + 64, 32);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // Footer copy
      ctx.fillStyle = "#0A2472";
      ctx.font = "bold 42px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("Earn rewards on every visit", W / 2, qrY + qrSize + 120);
      ctx.fillStyle = "#64748B";
      ctx.font = "32px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("Point your camera • Tap the link • Done", W / 2, qrY + qrSize + 175);

      // Bottom URL bar
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(joinUrl.replace(/^https?:\/\//, ""), W / 2, H - 80);

      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `perkback-counter-poster-${slug}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Poster downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate poster");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-5">
      <div className="flex items-center gap-2">
        <QrCode size={18} className="text-secondary" />
        <h2 className="text-base font-bold text-foreground">Counter QR Poster</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Print this and place it at your counter. Customers scan to instantly join your loyalty program.
      </p>

      {/* On-screen preview */}
      <div ref={posterRef} className="mx-auto w-full max-w-xs rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-hero">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-primary-foreground/70">
          Powered by PerkBack
        </p>
        <h3 className="mt-2 text-center text-2xl font-black leading-tight">
          Scan to join<br />{storeName}
        </h3>
        <div className="mt-4 mx-auto w-fit rounded-2xl bg-card p-4">
          {joinUrl ? (
            <QRCodeSVG value={joinUrl} size={200} level="M" fgColor="#0A2472" bgColor="#ffffff" includeMargin={false} />
          ) : (
            <div className="h-[200px] w-[200px] flex items-center justify-center text-xs text-muted-foreground">No slug yet</div>
          )}
        </div>
        <p className="mt-3 text-center text-xs font-bold">Earn rewards on every visit</p>
        <p className="mt-1 text-center text-[10px] text-primary-foreground/70 font-mono break-all">
          {joinUrl.replace(/^https?:\/\//, "") || "—"}
        </p>
      </div>

      <Button onClick={handleDownload} variant="hero" className="w-full gap-2" disabled={downloading || !slug}>
        <Download size={16} /> {downloading ? "Generating…" : "Download printable PNG"}
      </Button>
      {!slug && (
        <p className="text-[11px] text-muted-foreground text-center">
          Save your business info first to activate your join link.
        </p>
      )}
    </div>
  );
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export default CounterQrPoster;
