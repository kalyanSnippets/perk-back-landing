import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useExploreData, useJoinMerchant } from '../../src/hooks/useExploreData';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

export default function JoinMerchantScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { customer } = useAuth();
  const { merchants, fallbackMerchants } = useExploreData();
  const join = useJoinMerchant(customer?.id);
  const merchantLookup = useQuery({
    queryKey: ['merchant-by-slug', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_merchant_by_slug', { _slug: slug });
      if (error || !Array.isArray(data) || !data[0]) return null;
      const row = data[0] as any;
      return {
        id: row.id,
        user_id: '',
        name: row.store_name ?? 'PerkBack Store',
        slug,
        category: row.industry_type ?? null,
        logo_url: row.logo_url ?? null,
        address: row.address ?? null,
        lat: null,
        lng: null,
        is_active: true,
      };
    },
  });
  const merchant = merchantLookup.data
    ?? [...(merchants.data ?? []), ...fallbackMerchants].find((item) => item.slug === slug || item.id === slug)
    ?? fallbackMerchants[0];

  const add = async () => {
    try {
      await join.mutateAsync({ slug: merchant.slug });
      Alert.alert('Added to wallet', `${merchant.name} is now in your wallet.`, [
        { text: 'View card', onPress: () => router.replace('/(tabs)/my-card') },
      ]);
    } catch (error) {
      Alert.alert('Could not add card', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.hero}>
          <Text style={styles.pill}>JUST JOINED</Text>
          <Text style={styles.heroTitle}>Welcome to {merchant.name} Rewards</Text>
          <Text style={styles.heroSub}>{merchant.category || 'Coffee Shop'} · {merchant.address || '237 Campbell Pde'}</Text>
          <View style={styles.logo}><Text style={styles.logoText}>{merchant.name.slice(0, 2).toUpperCase()}</Text></View>
        </LinearGradient>
        <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.card}>
          <View>
            <Text style={styles.cardLabel}>YOUR REWARD</Text>
            <Text style={styles.cardName}>{merchant.name}</Text>
            <Text style={styles.cardBalance}>50<Text style={styles.cardUnit}> pts</Text></Text>
          </View>
          <View style={styles.qr}><QRCode value={merchant.slug} size={70} color={PB.primary} backgroundColor="#fff" /></View>
        </LinearGradient>
        <Text style={styles.unlockTitle}>WHAT YOU’LL UNLOCK</Text>
        {[
          ['Free flat white', '300 pts'],
          ['Buy-1-get-1 pastry', '420 pts'],
          ['Birthday surprise', 'on us'],
        ].map(([title, pts]) => (
          <View key={title} style={styles.unlockRow}><Text style={styles.unlockIcon}>🎁</Text><Text style={styles.unlockText}>{title}</Text><Text style={styles.unlockPts}>{pts}</Text></View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.darkBtn} onPress={add}><Text style={styles.darkText}>Add to Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.blueBtn} onPress={() => router.replace('/(tabs)/my-card')}><Text style={styles.blueText}>View card</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingBottom: 120 },
  hero: { minHeight: 220, padding: 22, justifyContent: 'flex-end' },
  pill: { alignSelf: 'flex-start', color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 10, marginBottom: 12 },
  heroTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 25, letterSpacing: -0.7, maxWidth: 270 },
  heroSub: { color: 'rgba(255,255,255,.75)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 6 },
  logo: { position: 'absolute', right: 28, bottom: -26, width: 74, height: 74, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  logoText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 22 },
  card: { margin: 22, marginTop: 46, borderRadius: 22, padding: 18, minHeight: 118, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,.55)', fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 1.4 },
  cardName: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 19, marginTop: 4 },
  cardBalance: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 25, marginTop: 10 },
  cardUnit: { fontSize: 11 },
  qr: { width: 86, height: 86, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  unlockTitle: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.3, marginHorizontal: 22, marginBottom: 10 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 22, paddingVertical: 13, borderBottomWidth: 1, borderColor: PB.borderSoft },
  unlockIcon: { fontSize: 16 },
  unlockText: { flex: 1, color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  unlockPts: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, padding: 18, paddingBottom: 30, backgroundColor: 'rgba(250,251,253,.95)' },
  darkBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#0b0d12', alignItems: 'center', justifyContent: 'center' },
  blueBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  darkText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  blueText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
});
