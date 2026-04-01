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
  logout: () => Promise<void>;
}

const CACHE_KEY = "perkback_role";

const defaultRoles: RoleState = { isAdmin: false, isMerchant: false, isCustomer: false, userRole: null };

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
        // Skip the initial event — getSession already handled it
        if (!bootstrapped.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        await detectRole(newSession?.user ?? null);
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
