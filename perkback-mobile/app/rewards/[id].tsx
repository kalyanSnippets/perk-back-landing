import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useRedeemReward, useRewardsData } from '../../src/hooks/useRewardsData';
import { PB, FONTS } from '../../src/constants/theme';

export default function RewardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customer } = useAuth();
  const { rewards, fallbackRewards } = useRewardsData(customer?.id);
  const redeem = useRedeemReward(customer?.id);
  const reward = useMemo(
    () => [...(rewards.data ?? []), ...fallbackRewards].find((item) => item.id === id) ?? fallbackRewards[0],
    [rewards.data, fallbackRewards, id]
  );
  const balance = Number(reward.customer_points ?? customer?.points_balance ?? 480);
  const afterClaim = Math.max(0, balance - Number(reward.points_required ?? 0));

  const claim = async () => {
    try {
      await redeem.mutateAsync(reward.id);
      router.replace({ pathname: '/rewards/active-code', params: { rewardTitle: reward.title, merchantName: reward.merchant_name ?? 'PerkBack store' } });
    } catch (error) {
      Alert.alert('Could not claim reward', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}><Text style={styles.closeText}>×</Text></TouchableOpacity>
        <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.hero}>
          <View style={styles.glow} />
          <Text style={styles.pill}>Ready to claim</Text>
        </LinearGradient>
        <Text style={styles.merchant}>{reward.merchant_name || 'Bondi Beans'}</Text>
        <Text style={styles.title}>{reward.title}</Text>
        <Text style={styles.description}>{reward.description || 'Any size, any milk. One per visit.'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>★ {reward.points_required} pts</Text>
          <Text style={styles.meta}>◷ Expires in 7 days once claimed</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>YOUR BALANCE AT {reward.merchant_name?.toUpperCase() || 'THIS STORE'}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{balance.toLocaleString()} pts</Text>
            <Text style={styles.after}>{afterClaim.toLocaleString()} pts after claim</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.claimBtn, redeem.isPending && styles.disabled]} onPress={claim} disabled={redeem.isPending}>
          <Text style={styles.claimText}>{redeem.isPending ? 'Claiming...' : `Claim for ${reward.points_required} pts`}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { padding: 20, paddingBottom: 120 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  closeText: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 24, lineHeight: 26 },
  hero: { height: 168, borderRadius: 24, padding: 16, overflow: 'hidden', justifyContent: 'flex-start', marginBottom: 18 },
  glow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -50, top: -40, backgroundColor: 'rgba(255,208,122,.35)' },
  pill: { color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 11 },
  merchant: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 28, letterSpacing: -0.8, marginTop: 5 },
  description: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21, marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 18, marginTop: 18, flexWrap: 'wrap' },
  meta: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 12 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: PB.borderSoft, marginTop: 24 },
  balanceLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.2 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 },
  balance: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 28 },
  after: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginBottom: 5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 32, backgroundColor: 'rgba(250,251,253,.95)' },
  claimBtn: { height: 54, borderRadius: 17, backgroundColor: PB.accentStrong, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.65 },
  claimText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 15 },
});
