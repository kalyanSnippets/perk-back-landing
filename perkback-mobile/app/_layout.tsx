import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

function RootLayoutNav() {
  const { session, isLoading, isOnboarding, customer, merchant } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const routeKey = segments.join('/');

  useEffect(() => {
    if (isLoading) return;
    const [root, child] = segments as string[];
    const inAuthGroup = root === '(auth)';
    const inOnboarding = root === '(onboarding)';
    const inTabs = root === '(tabs)';
    const inMerchant = root === '(merchant)';
    const inCustomerFlow = ['rewards', 'scan', 'join', 'merchant'].includes(String(root));
    const onChooseAccount = inOnboarding && child === 'choose-account';

    if (!session) {
      if (root === 'join' && child) {
        SecureStore.setItemAsync('pending_merchant_slug', child);
      }
      // Not signed in → auth
      if (!inAuthGroup) router.replace('/(auth)/welcome');
    } else if (isOnboarding) {
      // Brand new user — no accounts yet
      if (!inOnboarding) router.replace('/(onboarding)/choose-role');
    } else if (customer && merchant && !inTabs && !inMerchant && !inCustomerFlow && !onChooseAccount) {
      // Both roles → user chooses a dashboard
      router.replace('/(onboarding)/choose-account');
    } else if (merchant && !customer && !inMerchant) {
      // Merchant only → merchant dashboard
      router.replace('/(merchant)/dashboard');
    } else if (customer && !inTabs && !inCustomerFlow) {
      // Customer only → go straight to app
      router.replace('/(tabs)/my-card');
    }
  }, [session, isLoading, isOnboarding, customer, merchant, routeKey, router]);

  useEffect(() => {
    if (isLoading || !session || !customer) return;
    let active = true;
    const [root, child] = segments as string[];

    SecureStore.getItemAsync('pending_merchant_slug').then((slug) => {
      if (!active || !slug) return;
      if (root === 'join' && child === slug) return;
      SecureStore.deleteItemAsync('pending_merchant_slug');
      router.replace(`/join/${slug}`);
    });

    return () => {
      active = false;
    };
  }, [session, customer?.id, isLoading, routeKey, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(merchant)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="join/[slug]" />
      <Stack.Screen name="merchant/[id]" />
      <Stack.Screen name="rewards/[id]" />
      <Stack.Screen name="rewards/active-code" />
      <Stack.Screen name="rewards/marketplace" />
      <Stack.Screen name="rewards/spin" />
      <Stack.Screen name="scan/index" />
      <Stack.Screen name="scan/success" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
