import { useState, useEffect } from "react";

/** Haversine distance in km between two lat/lng points */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format distance for display */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

/** Hook to get the user's current location */
export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({
    latitude: null, longitude: null, loading: true, error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ latitude: null, longitude: null, loading: false, error: "Geolocation not supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setLocation({
          latitude: null, longitude: null, loading: false,
          error: err.code === 1 ? "Permission denied" : "Unable to get location",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return location;
}
