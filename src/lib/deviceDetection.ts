export const getDeviceType = (): "ios" | "android" | "desktop" => {
  const ua = navigator.userAgent || navigator.vendor || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

export const isIOS = () => getDeviceType() === "ios";
export const isAndroid = () => getDeviceType() === "android";

export const isStandaloneDisplayMode = () => {
  if (typeof window === "undefined") return false;

  const mediaStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return mediaStandalone || iosStandalone;
};

export const isMobileAppContext = () => {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return params.get("app") === "1" || isStandaloneDisplayMode();
};
