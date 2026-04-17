import { useState } from "react";
import { MapPin } from "lucide-react";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

/**
 * Computes OpenStreetMap tile coordinates (Slippy Map) for a lat/lng + zoom.
 * Returns the URL of a single 256x256 PNG tile centered approximately on the location.
 */
const getTileUrl = (lat: number, lng: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

const MapPreview = ({ latitude, longitude, zoom = 15, className = "" }: MapPreviewProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const url = getTileUrl(latitude, longitude, zoom);

  return (
    <div className={`relative overflow-hidden bg-muted/40 ${className}`}>
      {!errored && (
        <img
          src={url}
          alt="Map location preview"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {(!loaded || errored) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <MapPin size={16} className="text-muted-foreground/60" />
        </div>
      )}
      {/* Pin marker overlay */}
      {loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-md" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping opacity-50" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPreview;
