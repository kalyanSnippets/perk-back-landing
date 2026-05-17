import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Customer, Merchant } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  customer: Customer | null;
  merchant: Merchant | null;
  isLoading: boolean;
  isOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  customer: null,
  merchant: null,
  isLoading: true,
  isOnboarding: false,
  signOut: async () => {},
  refreshCustomer: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const fetchAccounts = useCallback(async (userId: string) => {
    const [customerRes, merchantRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, user_id, full_name, crn, loyalty_card_number, points_balance, date_of_birth, phone, created_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('merchants')
        .select('id, user_id, name, slug, category, logo_url, address, lat, lng, is_active')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);
    setCustomer(customerRes.data ?? null);
    setMerchant(merchantRes.data ?? null);
    setIsOnboarding(!customerRes.data && !merchantRes.data);
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (session?.user) await fetchAccounts(session.user.id);
  }, [session, fetchAccounts]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchAccounts(newSession.user.id);
        } else {
          setCustomer(null);
          setMerchant(null);
          setIsOnboarding(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchAccounts(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAccounts]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      customer,
      merchant,
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
