import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";

export const PROFILE_RETURN_URL = "/customer/access-card?tab=profile";

export const useEmbeddedPublicPage = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const isEmbedded = isMobile && searchParams.get("web") === "1";

  return useMemo(
    () => ({
      isEmbedded,
      backHref: PROFILE_RETURN_URL,
    }),
    [isEmbedded],
  );
};