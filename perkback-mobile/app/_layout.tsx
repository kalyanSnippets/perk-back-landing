import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
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

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';
    const inMerchant = segments[0] === '(merchant)';
    const inCustomerFlow = ['rewards', 'scan', 'join', 'merchant'].includes(String(segments[0]));
    const onChooseAccount = inOnboarding && (segments as string[])[1] === 'choose-account';

    if (!session) {
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
  }, [session, isLoading, isOnboarding, customer, merchant, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(merchant)" />
      <Stack.Screen name="(tabs)" />
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
