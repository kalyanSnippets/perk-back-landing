import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

// SecureStore is native-only; fall back to localStorage on web
const storage =
  Platform.OS === "web"
    ? {
        getItem: (k: string) => Promise.resolve(localStorage.getItem(k)),
        setItem: (k: string, v: string) => Promise.resolve(localStorage.setItem(k, v)),
        removeItem: (k: string) => Promise.resolve(localStorage.removeItem(k)),
      }
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
        removeItem: (k: string) => SecureStore.deleteItemAsync(k),
      };

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
