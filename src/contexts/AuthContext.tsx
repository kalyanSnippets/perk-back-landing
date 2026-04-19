import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "customer" | "merchant" | "admin" | null;

interface RoleState {
  isAdmin: boolean;
  isMerchant: boolean;
  isCustomer: boolean;
  userRole: UserRole;
}

interface AuthContextType extends RoleState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  logout: () => Promise<void>;
}

const CACHE_KEY = "perkback_role";

const defaultRoles: RoleState = { isAdmin: false, isMerchant: false, isCustomer: false, userRole: null };

// Routes where we defer Supabase auth bootstrap until idle to keep
// the public marketing pages free of network/JS work on first paint.
const PUBLIC_DEFERRED_ROUTES = new Set<string>([
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/testimonials",
  "/privacy",
  "/blog",
]);

function isDeferrableRoute(pathname: string): boolean {
  if (PUBLIC_DEFERRED_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/blog/")) return true;
  return false;
}

function cacheRoles(roles: RoleState) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(roles));
  } catch { /* quota errors are fine to ignore */ }
}

function readCachedRoles(): RoleState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as RoleState;
  } catch { /* ignore */ }
  return null;
}

function clearCachedRoles() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  authReady: false,
  ...defaultRoles,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const cached = readCachedRoles();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleState>(cached ?? defaultRoles);

  const bootstrapped = useRef(false);

  const detectRole = useCallback(async (currentUser: User | null): Promise<RoleState> => {
    if (!currentUser) {
      const empty = { ...defaultRoles };
      setRoles(empty);
      clearCachedRoles();
      return empty;
    }

    try {
      const [adminResult, merchantResult, customerResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", currentUser.id).eq("role", "admin").maybeSingle(),
        supabase.from("merchants").select("id").eq("user_id", currentUser.id).maybeSingle(),
        supabase.from("customers").select("id").eq("user_id", currentUser.id).maybeSingle(),
      ]);

      const isAdmin = !!adminResult.data;
      const isMerchant = !!merchantResult.data;
      const isCustomer = !!customerResult.data;
      const userRole: UserRole = isMerchant ? "merchant" : isCustomer ? "customer" : null;

      const result: RoleState = { isAdmin, isMerchant, isCustomer, userRole };
      setRoles(result);
      cacheRoles(result);
      return result;
    } catch (err) {
      console.error("Role detection failed:", err);
      const empty = { ...defaultRoles };
      setRoles(empty);
      clearCachedRoles();
      return empty;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    let unsubscribe: (() => void) | undefined;

    const bootstrap = () => {
      if (!mounted || bootstrapped.current) return;

      // 1. Primary bootstrap via getSession
      supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
        if (!mounted) return;
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        await detectRole(existingSession?.user ?? null);
        bootstrapped.current = true;
        if (mounted) setLoading(false);
      });

      // 2. Listen for subsequent auth changes only
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mounted) return;
          if (!bootstrapped.current) return;

          setSession(newSession);
          setUser(newSession?.user ?? null);
          await detectRole(newSession?.user ?? null);
          if (mounted) setLoading(false);
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    };

    // On public marketing routes, defer auth bootstrap until the browser
    // is idle so it never competes with first paint or LCP.
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    if (isDeferrableRoute(path)) {
      // Optimistically clear loading so consumers (e.g. Header) render the
      // signed-out CTA immediately. If a session exists, it will hydrate shortly.
      setLoading(false);

      const idle = (window as any).requestIdleCallback as undefined |
        ((cb: () => void, opts?: { timeout: number }) => number);
      if (typeof idle === "function") {
        idleHandle = idle(() => bootstrap(), { timeout: 2000 });
      } else {
        timeoutHandle = window.setTimeout(bootstrap, 1200);
      }
    } else {
      bootstrap();
    }

    return () => {
      mounted = false;
      if (idleHandle !== undefined && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
      unsubscribe?.();
    };
  }, [detectRole]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles({ ...defaultRoles });
    clearCachedRoles();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, ...roles, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
