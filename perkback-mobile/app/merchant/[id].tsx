import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useExploreData, useJoinMerchant } from '../../src/hooks/useExploreData';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { PB, FONTS } from '../../src/constants/theme';

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customer } = useAuth();
  const { merchants, fallbackMerchants } = useExploreData();
  const wallet = useCustomerWallet(customer?.id);
  const join = useJoinMerchant(customer?.id);
  const merchant = useMemo(() => [...(merchants.data ?? []), ...fallbackMerchants].find((item) => item.id === id) ?? fallbackMerchants[0], [fallbackMerchants, id, merchants.data]);
  const membership = wallet.data?.find((item) => item.merchant_id === merchant.id);

  const handleJoin = async () => {
    try {
      await join.mutateAsync({ merchantId: merchant.id });
      router.push({ pathname: '/join/[slug]', params: { slug: merchant.slug } });
    } catch (error) {
      Alert.alert('Could not join store', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.hero}>
          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}><Text style={styles.roundText}>‹</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn}><Text style={styles.roundText}>↗</Text></TouchableOpacity>
          </View>
          <View style={styles.logo}><Text style={styles.logoText}>{merchant.name.slice(0, 2).toUpperCase()}</Text></View>
          <Text style={styles.category}>{merchant.category || 'Coffee Shop'}</Text>
          <Text style={styles.name}>{merchant.name}</Text>
          <Text style={styles.address}>{merchant.address || '237 Campbell Pde, Bondi'} · {merchant.distanceLabel || '140m'}</Text>
        </LinearGradient>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statValue}>{Number(membership?.points ?? 480).toLocaleString()}</Text><Text style={styles.statLabel}>your points</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{Number(membership?.visits ?? 18).toLocaleString()}</Text><Text style={styles.statLabel}>visits</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>${Number(membership?.total_spend ?? 486).toFixed(0)}</Text><Text style={styles.statLabel}>spent</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>STAMP CARD</Text>
          <Text style={styles.cardTitle}>Buy 10 coffees, get one free</Text>
          <View style={styles.stamps}>{Array.from({ length: 10 }).map((_, index) => <View key={index} style={[styles.stamp, index < 5 && styles.stampFull]}><Text>{index < 5 ? '☕' : ''}</Text></View>)}</View>
        </View>
        <View style={styles.rewardCard}>
          <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.rewardArt}><Text style={styles.pill}>Ready to claim</Text></LinearGradient>
          <View style={styles.rewardBody}>
            <Text style={styles.rewardMerchant}>{merchant.name}</Text>
            <Text style={styles.rewardTitle}>Free Flat White</Text>
            <Text style={styles.rewardPts}>300 pts</Text>
          </View>
          <TouchableOpacity style={styles.claimBtn} onPress={() => router.push('/rewards/sample-flat-white')}><Text style={styles.claimText}>Claim reward</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={join.isPending}>
          <Text style={styles.joinText}>{membership ? 'View card' : join.isPending ? 'Joining...' : 'Join store'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingBottom: 110 },
  hero: { padding: 20, paddingTop: 12, minHeight: 238 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 42 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' },
  roundText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 24, lineHeight: 26 },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: PB.accent, fontFamily: FONTS.extraBold, fontSize: 17 },
  category: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.bold, fontSize: 11 },
  name: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 25, letterSpacing: -0.6, marginTop: 4 },
  address: { color: 'rgba(255,255,255,.72)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 3 },
  stats: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, borderBottomWidth: 1, borderColor: PB.borderSoft },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 18 },
  statLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 9, textTransform: 'uppercase', marginTop: 3 },
  card: { margin: 18, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: PB.borderSoft },
  eyebrow: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.2 },
  cardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16, marginTop: 6 },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  stamp: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#d8dee9', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  stampFull: { backgroundColor: PB.accentStrong, borderColor: PB.accentStrong },
  rewardCard: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: PB.borderSoft },
  rewardArt: { height: 108, padding: 14 },
  pill: { color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 10 },
  rewardBody: { padding: 15 },
  rewardMerchant: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase' },
  rewardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18, marginTop: 4 },
  rewardPts: { position: 'absolute', right: 14, top: 18, color: PB.primary, backgroundColor: '#eef5ff', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, fontFamily: FONTS.bold, fontSize: 11 },
  claimBtn: { height: 48, marginHorizontal: 15, marginBottom: 15, borderRadius: 16, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  claimText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: 30, backgroundColor: 'rgba(250,251,253,.95)' },
  joinBtn: { height: 54, borderRadius: 17, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  joinText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 15 },
});
