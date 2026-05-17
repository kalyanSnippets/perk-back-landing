import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Customer } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  isOnboarding: boolean; // true if no customers row yet
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  customer: null,
  isLoading: true,
  isOnboarding: false,
  signOut: async () => {},
  refreshCustomer: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const fetchCustomer = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('id, user_id, full_name, crn, loyalty_card_number, points_balance, date_of_birth, phone, created_at')
      .eq('user_id', userId)
      .maybeSingle();
    setCustomer(data);
    setIsOnboarding(!data);
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (session?.user) await fetchCustomer(session.user.id);
  }, [session, fetchCustomer]);

  useEffect(() => {
    // Set up listener BEFORE getSession (per handoff spec)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchCustomer(newSession.user.id);
        } else {
          setCustomer(null);
          setIsOnboarding(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchCustomer(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCustomer]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      customer,
      isLoading,
      isOnboarding,
      signOut,
      refreshCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
