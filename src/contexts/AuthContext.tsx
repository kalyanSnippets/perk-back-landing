import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  const detectRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserRole(null);
      setIsAdmin(false);
      setIsMerchant(false);
      setIsCustomer(false);
      return;
    }

    // Check admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!adminRole);

    // Check merchant
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setIsMerchant(!!merchant);

    // Check customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setIsCustomer(!!customer);

    // Determine primary role
    if (merchant) {
      setUserRole("merchant");
    } else if (customer) {
      setUserRole("customer");
    } else {
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Use setTimeout to avoid potential deadlocks with Supabase client
        if (newSession?.user) {
          setTimeout(() => detectRole(newSession.user), 0);
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setIsMerchant(false);
          setIsCustomer(false);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        detectRole(existingSession.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
