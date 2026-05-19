import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useRewardsData, RewardWithMeta } from '../../src/hooks/useRewardsData';
import { ConnectionError, ScreenSkeleton } from '../../src/components/ui/AppStates';
import { PB, FONTS } from '../../src/constants/theme';

function RewardCard({
  reward,
  balance,
  merchantName,
  onPress,
}: {
  reward: RewardWithMeta;
  balance: number;
  merchantName: string;
  onPress: () => void;
}) {
  const ready = balance >= Number(reward.points_required ?? 0);
  const needed = Math.max(0, Number(reward.points_required ?? 0) - balance);
  return (
    <TouchableOpacity style={styles.rewardCard} onPress={onPress} activeOpacity={0.86}>
      <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.rewardArt}>
        <Text style={styles.readyPill}>{ready ? 'Ready to claim' : `${needed} pts to go`}</Text>
      </LinearGradient>
      <View style={styles.rewardBody}>
        <Text style={styles.rewardMerchant}>{merchantName}</Text>
        <Text style={styles.rewardTitle}>{reward.title}</Text>
        <Text style={styles.rewardSub} numberOfLines={2}>{reward.description || 'Merchant reward'}</Text>
        <View style={styles.rewardMeta}>
          <Text style={styles.rewardMetaText}>{reward.points_required} pts</Text>
          <Text style={[styles.rewardStatus, ready ? styles.readyText : styles.lockedText]}>{ready ? 'Claim' : 'Locked'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RewardsScreen() {
  const router = useRouter();
  const { customer } = useAuth();
  const { rewards, redemptions, stamps, wallet } = useRewardsData(customer?.id);
  const [merchantFilter, setMerchantFilter] = useState('all');

  const groups = useMemo(() => {
    const cards = wallet.data ?? [];
    const rewardMerchantIds = [...new Set((rewards.data ?? []).map((reward) => reward.merchant_id).filter(Boolean))];
    return rewardMerchantIds.map((merchantId) => {
      const card = cards.find((item) => item.merchant_id === merchantId) ?? null;
      const merchantRewards = (rewards.data ?? []).filter((reward) => reward.merchant_id === merchantId);
      const firstReward = merchantRewards[0];
      return {
        membership: card,
        merchant_id: merchantId,
        merchant: card?.merchant ?? firstReward?.merchants ?? null,
        merchantName: card?.merchant?.name ?? firstReward?.merchant_name ?? 'Merchant',
        merchantCategory: card?.merchant?.category ?? firstReward?.merchant_category ?? 'Local rewards',
        rewards: merchantRewards,
        stamps: (stamps.data ?? []).filter((stamp) => stamp.merchant_id === merchantId),
      };
    });
  }, [rewards.data, stamps.data, wallet.data]);

  const visibleGroups = merchantFilter === 'all'
    ? groups
    : groups.filter((group) => group.merchant_id === merchantFilter);

  const activeRedemptions = redemptions.data?.filter((item) => ['active', 'pending'].includes(item.status)) ?? [];
  const isLoading = rewards.isLoading || wallet.isLoading;
  const isRefreshing = rewards.isRefetching || redemptions.isRefetching || stamps.isRefetching || wallet.isRefetching;

  const refresh = () => {
    rewards.refetch();
    redemptions.refetch();
    stamps.refetch();
    wallet.refetch();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={PB.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Merchant rewards</Text>
            <Text style={styles.title}>Rewards</Text>
            <Text style={styles.sub}>Rewards are shown under the merchant that created them.</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? <ScreenSkeleton /> : rewards.isError ? (
          <ConnectionError onRetry={refresh} message={rewards.error instanceof Error ? rewards.error.message : undefined} />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <TouchableOpacity style={[styles.chip, merchantFilter === 'all' && styles.chipActive]} onPress={() => setMerchantFilter('all')}>
                <Text style={[styles.chipText, merchantFilter === 'all' && styles.chipTextActive]}>All cards</Text>
              </TouchableOpacity>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.merchant_id}
                  style={[styles.chip, merchantFilter === group.merchant_id && styles.chipActive]}
                  onPress={() => setMerchantFilter(group.merchant_id)}
                >
                  <Text style={[styles.chipText, merchantFilter === group.merchant_id && styles.chipTextActive]}>{group.merchantName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeRedemptions.length > 0 ? (
              <TouchableOpacity style={styles.activeCard} activeOpacity={0.86} onPress={() => router.push('/rewards/active-code')}>
                <View style={styles.ticketIcon}><Text style={styles.ticketIconText}>▣</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeLabel}>Active vouchers</Text>
                  <Text style={styles.activeTitle}>{activeRedemptions.length} reward {activeRedemptions.length === 1 ? 'code' : 'codes'} ready</Text>
                  <Text style={styles.activeSub}>Show codes at the relevant merchant till.</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ) : null}

            {visibleGroups.length > 0 ? visibleGroups.map((group) => {
              const balance = Number(group.membership?.points_balance ?? group.membership?.points ?? 0);
              const joined = Boolean(group.membership);
              return (
                <View key={group.merchant_id} style={styles.group}>
                  <TouchableOpacity style={styles.groupHeader} onPress={() => router.push(`/merchant/${group.merchant_id}`)}>
                    <View style={styles.groupAvatar}>
                      <Text style={styles.groupAvatarText}>{group.merchantName.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitle}>{group.merchantName}</Text>
                      <Text style={styles.groupSub}>{joined ? `${balance.toLocaleString()} pts · ${Number(group.membership?.visit_count ?? 0)} visits` : `${group.merchantCategory} · join to earn points`}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  {group.rewards.length > 0 ? group.rewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      balance={balance}
                      merchantName={group.merchantName}
                      onPress={() => router.push(`/rewards/${reward.id}`)}
                    />
                  )) : (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyTitle}>No rewards from this merchant yet</Text>
                      <Text style={styles.emptyText}>When the merchant creates rewards in their dashboard, they will appear here.</Text>
                    </View>
                  )}
                </View>
              );
            }) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No merchant cards yet</Text>
                <Text style={styles.emptyText}>Scan a merchant QR to join their loyalty programme and unlock their rewards.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/scan')}>
                  <Text style={styles.emptyBtnText}>Scan merchant QR</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  kicker: { color: PB.accentStrong, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 31, letterSpacing: -0.9, marginTop: 2 },
  sub: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, lineHeight: 17, marginTop: 3, maxWidth: 260 },
  scanBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  scanText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { height: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, justifyContent: 'center' },
  chipActive: { backgroundColor: PB.primary, borderColor: PB.primary },
  chipText: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  activeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff4d8', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#ffe3a7', marginVertical: 10 },
  ticketIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ticketIconText: { color: PB.primary, fontFamily: FONTS.bold },
  activeLabel: { color: PB.accentStrong, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  activeTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16, marginTop: 2 },
  activeSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 1 },
  group: { marginTop: 14 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 10 },
  groupAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  groupAvatarText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 13 },
  groupTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  groupSub: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, marginTop: 2 },
  chevron: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 24 },
  rewardCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 12 },
  rewardArt: { height: 92, padding: 12, justifyContent: 'flex-start', alignItems: 'flex-start' },
  readyPill: { color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 10 },
  rewardBody: { padding: 14 },
  rewardMerchant: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rewardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17, marginTop: 3 },
  rewardSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 3, lineHeight: 17 },
  rewardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rewardMetaText: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 12 },
  rewardStatus: { fontFamily: FONTS.extraBold, fontSize: 12 },
  readyText: { color: PB.success },
  lockedText: { color: PB.muted },
  emptyBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 12 },
  emptyTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 15 },
  emptyText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  emptyBtn: { alignSelf: 'flex-start', height: 42, borderRadius: 15, backgroundColor: PB.primary, paddingHorizontal: 14, justifyContent: 'center', marginTop: 14 },
  emptyBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 12 },
});
