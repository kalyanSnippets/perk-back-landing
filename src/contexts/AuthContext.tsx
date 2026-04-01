import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "customer" | "merchant" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  isMerchant: boolean;
  isCustomer: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  isAdmin: false,
  isMerchant: false,
  isCustomer: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);

  const detectRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUserRole(null);
      setIsAdmin(false);
      setIsMerchant(false);
      setIsCustomer(false);
      return;
    }

    try {
      const [adminResult, merchantResult, customerResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .eq("role", "admin")
          .maybeSingle(),
        supabase
          .from("merchants")
          .select("id")
          .eq("user_id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("customers")
          .select("id")
          .eq("user_id", currentUser.id)
          .maybeSingle(),
      ]);

      setIsAdmin(!!adminResult.data);
      setIsMerchant(!!merchantResult.data);
      setIsCustomer(!!customerResult.data);

      if (merchantResult.data) {
        setUserRole("merchant");
      } else if (customerResult.data) {
        setUserRole("customer");
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.error("Role detection failed:", err);
      setUserRole(null);
      setIsAdmin(false);
      setIsMerchant(false);
      setIsCustomer(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await detectRole(newSession.user);
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setIsMerchant(false);
          setIsCustomer(false);
        }
        if (mounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await detectRole(existingSession.user);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [detectRole]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setIsAdmin(false);
    setIsMerchant(false);
    setIsCustomer(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, isAdmin, isMerchant, isCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
