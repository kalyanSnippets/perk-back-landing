import { useMemo, useState } from "react";
import { DesktopDashboardPrototype } from "@/components/prototype/DesktopDashboardPrototype";
import { DesktopMarketingPrototype } from "@/components/prototype/DesktopMarketingPrototype";
import { MerchantTabletPrototype } from "@/components/prototype/MerchantTabletPrototype";
import { MobileCustomerPrototype } from "@/components/prototype/MobileCustomerPrototype";
import { PrototypeShell } from "@/components/prototype/PrototypeShell";
import { getPrototypeScreenById, getPrototypeScreens, type PrototypeDevice, type PrototypeFlow } from "@/lib/prototypeScreens";

const flowDefaults: Record<PrototypeFlow, string> = {
  "customer-mobile": "customer-invite",
  "merchant-tablet": "merchant-tablet-counter",
  "merchant-desktop": "merchant-desktop-dashboard",
  "marketing-desktop": "marketing-home",
};

const flowDevices: Record<PrototypeFlow, PrototypeDevice> = {
  "customer-mobile": "mobile",
  "merchant-tablet": "tablet",
  "merchant-desktop": "desktop",
  "marketing-desktop": "desktop",
};

const Prototype = () => {
  const [flow, setFlow] = useState<PrototypeFlow>("customer-mobile");
  const device = flowDevices[flow];
  const [activeScreenId, setActiveScreenId] = useState(flowDefaults[flow]);

  const screens = useMemo(() => getPrototypeScreens(device, flow), [device, flow]);
  const activeScreen = getPrototypeScreenById(activeScreenId) ?? screens[0];

  const handleFlowChange = (nextFlow: PrototypeFlow) => {
    setFlow(nextFlow);
    setActiveScreenId(flowDefaults[nextFlow]);
  };

  const renderScreen = () => {
    if (flow === "customer-mobile") return <MobileCustomerPrototype screenId={activeScreen.id} />;
    if (flow === "merchant-tablet") return <MerchantTabletPrototype screenId={activeScreen.id} />;
    if (flow === "merchant-desktop") return <DesktopDashboardPrototype screenId={activeScreen.id} />;
    return <DesktopMarketingPrototype screenId={activeScreen.id} />;
  };

  return (
    <PrototypeShell
      device={device}
      flow={flow}
      screens={screens}
      activeScreen={activeScreen}
      onFlowChange={handleFlowChange}
      onScreenChange={setActiveScreenId}
    >
      {renderScreen()}
    </PrototypeShell>
  );
};

export default Prototype;
