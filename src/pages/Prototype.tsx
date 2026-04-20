import { useMemo, useState } from "react";
import { DesktopDashboardPrototype } from "@/components/prototype/DesktopDashboardPrototype";
import { DesktopMarketingPrototype } from "@/components/prototype/DesktopMarketingPrototype";
import { MobileCustomerPrototype } from "@/components/prototype/MobileCustomerPrototype";
import { MobileMerchantPrototype } from "@/components/prototype/MobileMerchantPrototype";
import { PrototypeShell } from "@/components/prototype/PrototypeShell";
import { getPrototypeScreenById, getPrototypeScreens, type PrototypeDevice, type PrototypeFlow } from "@/lib/prototypeScreens";

const flowDefaults: Record<PrototypeFlow, string> = {
  customer: "customer-splash",
  merchant: "merchant-login",
  marketing: "marketing-home",
};

const Prototype = () => {
  const [device, setDevice] = useState<PrototypeDevice>("mobile");
  const [flow, setFlow] = useState<PrototypeFlow>("customer");
  const [activeScreenId, setActiveScreenId] = useState(flowDefaults.customer);

  const screens = useMemo(() => getPrototypeScreens(device, flow), [device, flow]);
  const activeScreen = getPrototypeScreenById(activeScreenId) ?? screens[0];

  const handleDeviceChange = (nextDevice: PrototypeDevice) => {
    const nextFlow = nextDevice === "desktop" ? "marketing" : flow === "marketing" ? "customer" : flow;
    setDevice(nextDevice);
    setFlow(nextFlow);
    setActiveScreenId(flowDefaults[nextFlow]);
  };

  const handleFlowChange = (nextFlow: PrototypeFlow) => {
    setFlow(nextFlow);
    setDevice(nextFlow === "marketing" ? "desktop" : "mobile");
    setActiveScreenId(flowDefaults[nextFlow]);
  };

  const renderScreen = () => {
    if (flow === "customer") return <MobileCustomerPrototype screenId={activeScreen.id} />;
    if (flow === "merchant") return <MobileMerchantPrototype screenId={activeScreen.id} />;
    if (["desktop-merchant", "desktop-analytics", "desktop-admin"].includes(activeScreen.id)) return <DesktopDashboardPrototype screenId={activeScreen.id} />;
    return <DesktopMarketingPrototype screenId={activeScreen.id} />;
  };

  return (
    <PrototypeShell
      device={device}
      flow={flow}
      screens={screens}
      activeScreen={activeScreen}
      onDeviceChange={handleDeviceChange}
      onFlowChange={handleFlowChange}
      onScreenChange={setActiveScreenId}
    >
      {renderScreen()}
    </PrototypeShell>
  );
};

export default Prototype;
