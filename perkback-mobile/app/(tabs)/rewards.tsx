import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useRewardsData } from '../../src/hooks/useRewardsData';
import { ConnectionError, ScreenSkeleton } from '../../src/components/ui/AppStates';
import { PB, FONTS } from '../../src/constants/theme';

function RewardCard({ reward, onPress }: { reward: any; onPress: () => void }) {
  const ready = Number(reward.customer_points ?? 0) >= Number(reward.points_required ?? 0);
  return (
    <TouchableOpacity style={styles.rewardCard} onPress={onPress} activeOpacity={0.86}>
      <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.rewardArt}>
        <Text style={styles.readyPill}>{ready ? 'Ready to claim' : `${reward.points_required} pts`}</Text>
      </LinearGradient>
      <View style={styles.rewardBody}>
        <Text style={styles.rewardMerchant}>{reward.merchant_name || 'PerkBack store'}</Text>
        <Text style={styles.rewardTitle}>{reward.title}</Text>
        <Text style={styles.rewardSub} numberOfLines={1}>{reward.description || 'Tap for details'}</Text>
        <View style={styles.rewardMeta}>
          <Text style={styles.rewardMetaText}>★ {reward.points_required} pts</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RewardsScreen() {
  const router = useRouter();
  const { customer } = useAuth();
  const { rewards, redemptions, stamps, wallet } = useRewardsData(customer?.id);
  const activeRedemption = redemptions.data?.find((item) => item.status === 'active');
  const totalStorePoints = wallet.data?.reduce((sum, item) => sum + Number(item.points ?? 0), 0) ?? 0;
  const firstReward = rewards.data?.[0];
  const stampCount = useMemo(() => {
    const stamp = stamps.data?.[0];
    return Number(stamp?.stamps_count ?? stamp?.stamp_count ?? stamp?.total_stamps ?? 4);
  }, [stamps.data]);
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
          <View style={styles.avatar}><Text style={styles.avatarText}>{customer?.full_name?.[0] || 'A'}</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>{customer?.full_name?.split(' ')[0] || 'Alex'}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/scan')}><Text style={styles.iconText}>⌗</Text></TouchableOpacity>
        </View>

        {isLoading ? <ScreenSkeleton /> : rewards.isError ? (
          <ConnectionError onRetry={refresh} message={rewards.error instanceof Error ? rewards.error.message : undefined} />
        ) : (
          <>
            <LinearGradient colors={['#071f50', '#0a2a6b', '#3f7ad4']} style={styles.pointsHero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <Text style={styles.memberPill}>★ Gold member</Text>
                <Text style={styles.heroLabel}>TOTAL POINTS</Text>
              </View>
              <Text style={styles.pointsValue}>{(customer?.points_balance ?? totalStorePoints).toLocaleString()}<Text style={styles.pointsUnit}> pts</Text></Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '72%' }]} /></View>
              <View style={styles.heroFoot}>
                <Text style={styles.heroFootText}>Ready to claim now</Text>
                <Text style={styles.heroFootText}>{firstReward?.points_required ?? 300} pts</Text>
              </View>
            </LinearGradient>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/scan')}><Text style={styles.quickText}>⌗ Scan at till</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/rewards/active-code')}><Text style={styles.quickText}>▦ Show code</Text></TouchableOpacity>
            </View>

            {activeRedemption || firstReward ? (
              <TouchableOpacity
                style={styles.activeCard}
                activeOpacity={0.86}
                onPress={() => router.push(activeRedemption ? '/rewards/active-code' : `/rewards/${firstReward?.id}`)}
              >
                <View style={styles.ticketIcon}><Text style={styles.ticketIconText}>⌘</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeLabel}>{activeRedemption ? 'Active code' : 'Ready to claim'}</Text>
                  <Text style={styles.activeTitle}>{activeRedemption?.rewards?.title || firstReward?.title || 'Free Flat White'}</Text>
                  <Text style={styles.activeSub}>{firstReward?.merchant_name || 'Bondi Beans'} · expires today 5pm</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {['All stores', 'Bondi Beans', 'Maison Patisserie', 'Field & Vine'].map((chip, index) => (
                <View key={chip} style={[styles.chip, index === 0 && styles.chipActive]}>
                  <Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{chip}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.tierCard}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionEyebrow}>TIER STATUS</Text>
                <Text style={styles.tierBadge}>Gold</Text>
              </View>
              <Text style={styles.tierTitle}>Gold · 520 to Platinum</Text>
              <View style={styles.tierLine}>
                {[0, 1, 2, 3].map((i) => <View key={i} style={[styles.tierDot, i < 3 && styles.tierDotFilled]} />)}
              </View>
              <View style={styles.tierLabels}>
                {['Bronze', 'Silver', 'Gold', 'Platinum'].map((label) => <Text key={label} style={styles.tierLabel}>{label}</Text>)}
              </View>
            </View>

            <View style={styles.stampCard}>
              <Text style={styles.sectionEyebrow}>STAMP CARD</Text>
              <Text style={styles.tierTitle}>Buy 10 coffees, get one free</Text>
              <View style={styles.stamps}>
                {Array.from({ length: 10 }).map((_, index) => (
                  <View key={index} style={[styles.stamp, index < stampCount && styles.stampFilled]}>
                    <Text style={styles.stampText}>{index < stampCount ? '☕' : ''}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rewards marketplace</Text>
              <TouchableOpacity onPress={() => router.push('/rewards/marketplace')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>

            {(rewards.data ?? []).slice(0, 4).map((reward) => (
              <RewardCard key={reward.id} reward={reward} onPress={() => router.push(`/rewards/${reward.id}`)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  headerCopy: { flex: 1, marginLeft: 10 },
  greeting: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12 },
  name: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 18 },
  pointsHero: { borderRadius: 22, padding: 16, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -38, top: -34, backgroundColor: 'rgba(255,208,122,.25)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberPill: { color: PB.primary, backgroundColor: PB.accent, overflow: 'hidden', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 5, fontFamily: FONTS.bold, fontSize: 11 },
  heroLabel: { color: 'rgba(255,255,255,.58)', fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 1.7 },
  pointsValue: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 40, marginTop: 12, letterSpacing: -1.3 },
  pointsUnit: { fontSize: 12, fontFamily: FONTS.bold },
  progressTrack: { height: 7, backgroundColor: 'rgba(255,255,255,.22)', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 7, backgroundColor: PB.accent, borderRadius: 4 },
  heroFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroFootText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 11 },
  quickActions: { flexDirection: 'row', marginVertical: 12, gap: 10 },
  quickAction: { flex: 1, height: 42, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  quickText: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 12 },
  activeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff4d8', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#ffe3a7' },
  ticketIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ticketIconText: { color: PB.primary, fontFamily: FONTS.bold },
  activeLabel: { color: PB.accentStrong, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  activeTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16, marginTop: 2 },
  activeSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 1 },
  chevron: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 24 },
  chips: { gap: 8, paddingVertical: 14 },
  chip: { height: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, justifyContent: 'center' },
  chipActive: { backgroundColor: PB.primary, borderColor: PB.primary },
  chipText: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  tierCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.3 },
  tierBadge: { color: PB.primary, backgroundColor: '#fff3d8', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, fontFamily: FONTS.bold, fontSize: 11 },
  tierTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 15, marginTop: 7 },
  tierLine: { height: 4, backgroundColor: '#eef1f6', borderRadius: 3, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#d8dee9' },
  tierDotFilled: { backgroundColor: PB.accentStrong },
  tierLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  tierLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 9, textTransform: 'uppercase' },
  stampCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: PB.borderSoft },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  stamp: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#d8dee9', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  stampFilled: { backgroundColor: PB.accentStrong, borderColor: PB.accentStrong },
  stampText: { fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20 },
  seeAll: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 12 },
  rewardCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 12 },
  rewardArt: { height: 96, padding: 12, justifyContent: 'flex-start', alignItems: 'flex-start' },
  readyPill: { color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 10 },
  rewardBody: { padding: 14 },
  rewardMerchant: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rewardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17, marginTop: 3 },
  rewardSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 3 },
  rewardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rewardMetaText: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 12 },
});
