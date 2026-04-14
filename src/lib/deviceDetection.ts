export const getDeviceType = (): "ios" | "android" | "desktop" => {
  const ua = navigator.userAgent || navigator.vendor || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

export const isIOS = () => getDeviceType() === "ios";
export const isAndroid = () => getDeviceType() === "android";
