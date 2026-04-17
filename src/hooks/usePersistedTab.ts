import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps the active tab in sync with the URL `?tab=` param AND localStorage,
 * so merchants land on their last-used tab across reloads.
 *
 * Priority on mount: URL param > localStorage > defaultTab.
 */
export const usePersistedTab = (storageKey: string, defaultTab: string) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get("tab");
  const storedTab =
    typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
  const activeTab = urlTab || storedTab || defaultTab;

  // Ensure URL reflects the resolved tab on first load (when only stored value exists)
  useEffect(() => {
    if (!urlTab && storedTab && storedTab !== defaultTab) {
      setSearchParams({ tab: storedTab }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = useCallback(
    (value: string) => {
      setSearchParams({ tab: value });
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        /* ignore quota / privacy mode errors */
      }
    },
    [setSearchParams, storageKey]
  );

  return { activeTab, setTab };
};
