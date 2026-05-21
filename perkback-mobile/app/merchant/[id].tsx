import React, { useMemo } from 'react';
import { Alert, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useExploreData, useJoinMerchant } from '../../src/hooks/useExploreData';
import { useMerchantLoyalty } from '../../src/hooks/useMerchantLoyalty';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function stampCount(stamp: any) {
  return Number(stamp?.stamps_count ?? stamp?.stamp_count ?? stamp?.current_stamps ?? 0);
}

function stampTotal(stamp: any) {
  return Number(stamp?.total_stamps ?? stamp?.stamps_required ?? stamp?.required_stamps ?? 10);
}

function formatCurrency(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customer } = useAuth();
  const { merchants, fallbackMerchants } = useExploreData();
  const join = useJoinMerchant(customer?.id);
  const loyalty = useMerchantLoyalty(customer?.id, id);
  const merchant = useMemo(() => {
    const walletMerchant = loyalty.membership?.merchant;
    const exploreMerchant = [...(merchants.data ?? []), ...fallbackMerchants].find((item) => item.id === id);
    return walletMerchant ?? exploreMerchant ?? null;
  }, [fallbackMerchants, id, loyalty.membership?.merchant, merchants.data]);
  const membership = loyalty.membership;
  const stamp = loyalty.stamps.data?.[0];
  const joined = Boolean(membership);
  const points = Number(membership?.points_balance ?? 0);
  const visits = Number(membership?.visit_count ?? 0);
  const spend = Number(membership?.total_spend ?? 0);

  if (!merchant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.missingState}>
          <Text style={styles.emptyTitle}>Merchant details unavailable</Text>
          <Text style={styles.emptyText}>This card is linked, but the merchant profile is not readable from Supabase yet. Ask Lovable to expose this merchant through merchants_public or the customer wallet relationship.</Text>
          <TouchableOpacity style={styles.joinInlineBtn} onPress={() => router.replace('/(tabs)/my-card')}>
            <Text style={styles.joinInlineText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const refresh = async () => {
    await Promise.all([loyalty.wallet.refetch(), loyalty.rewards.refetch(), loyalty.campaigns.refetch(), loyalty.stamps.refetch(), loyalty.activity.refetch()]);
  };

  const handleJoin = async () => {
    try {
      await join.mutateAsync({ merchantId: merchant.id });
      await refresh();
      Alert.alert('Joined', `${merchant.name} has been added to your wallet.`);
    } catch (error) {
      Alert.alert('Could not join store', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const addWallet = async (walletType: 'apple' | 'google') => {
    if (!customer?.id) return;
    const functionName = walletType === 'apple' ? 'apple-wallet-pass' : 'google-wallet-pass';
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { customer_id: customer.id, merchant_id: merchant.id },
    });
    if (error) {
      Alert.alert('Wallet unavailable', error.message);
      return;
    }
    const url = (data as any)?.url ?? (data as any)?.save_url;
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loyalty.rewards.isRefetching} onRefresh={refresh} tintColor={PB.primary} />}
      >
        <LinearGradient colors={['#2a1a0e', '#7b4f2d']} style={styles.hero}>
          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}><Text style={styles.roundText}>‹</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={() => merchant.address && Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(merchant.address)}`)}>
              <Text style={styles.shareText}>↗</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logo}>
            {merchant.logo_url ? <Image source={{ uri: merchant.logo_url }} style={styles.logoImage} /> : <Text style={styles.logoText}>{merchant.name.slice(0, 2).toUpperCase()}</Text>}
          </View>
          <Text style={styles.category}>{merchant.category || 'Local rewards'}</Text>
          <Text style={styles.name}>{merchant.name}</Text>
          <Text style={styles.address}>{merchant.address || 'Merchant loyalty programme'}</Text>
        </LinearGradient>

        {joined ? (
          <>
            <View style={styles.memberCard}>
              <View style={styles.memberCardTop}>
                <View>
                  <Text style={styles.cardEyebrow}>MERCHANT LOYALTY CARD</Text>
                  <Text style={styles.cardName}>{merchant.name}</Text>
                  <Text style={styles.cardCustomer}>{customer?.full_name ?? 'PerkBack member'}</Text>
                </View>
                <View style={styles.qrBox}>
                  <QRCode value={`${customer?.loyalty_card_number ?? customer?.crn ?? customer?.id}:${merchant.id}`} size={72} color={PB.primary} backgroundColor="#fff" />
                </View>
              </View>
              <View style={styles.cardNumberRow}>
                <Text style={styles.cardNumberLabel}>Card number</Text>
                <Text style={styles.cardNumber}>{customer?.loyalty_card_number ?? customer?.crn ?? customer?.id?.slice(0, 12).toUpperCase()}</Text>
              </View>
              <View style={styles.walletActions}>
                <TouchableOpacity style={styles.walletBtnDark} onPress={() => addWallet('apple')}><Text style={styles.walletDarkText}>Add to Apple Wallet</Text></TouchableOpacity>
                <TouchableOpacity style={styles.walletBtnLight} onPress={() => addWallet('google')}><Text style={styles.walletLightText}>Add to Google Wallet</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.stats}>
              <Stat label="points" value={points.toLocaleString()} />
              <Stat label="visits" value={visits.toLocaleString()} />
              <Stat label="spent" value={formatCurrency(spend)} />
            </View>
          </>
        ) : (
          <View style={styles.joinPrompt}>
            <Text style={styles.joinTitle}>Join this merchant</Text>
            <Text style={styles.joinText}>Add {merchant.name} to your wallet to collect its points, stamp card and rewards.</Text>
            <TouchableOpacity style={styles.joinInlineBtn} onPress={handleJoin} disabled={join.isPending}>
              <Text style={styles.joinInlineText}>{join.isPending ? 'Joining...' : 'Join loyalty programme'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Stamp card</Text>
            {stamp ? <Text style={styles.sectionMeta}>{stampCount(stamp)} / {stampTotal(stamp)}</Text> : null}
          </View>
          {stamp ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{(stamp as any).reward_name ?? (stamp as any).stamp_reward ?? 'Merchant stamp reward'}</Text>
              <View style={styles.stamps}>
                {Array.from({ length: stampTotal(stamp) }).map((_, index) => (
                  <View key={index} style={[styles.stamp, index < stampCount(stamp) && styles.stampFull]}>
                    <Text style={styles.stampText}>{index < stampCount(stamp) ? '✓' : ''}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No stamp card yet</Text>
              <Text style={styles.emptyText}>When {merchant.name} enables stamp cards, your progress will appear here.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <Text style={styles.sectionMeta}>{(loyalty.rewards.data ?? []).length} active</Text>
          </View>
          {(loyalty.rewards.data ?? []).length > 0 ? (
            loyalty.rewards.data?.map((reward) => {
              const canClaim = points >= Number(reward.points_required ?? 0);
              const remaining = Math.max(0, Number(reward.points_required ?? 0) - points);
              return (
                <TouchableOpacity key={reward.id} style={styles.rewardCard} onPress={() => router.push(`/rewards/${reward.id}`)} activeOpacity={0.86}>
                  <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.rewardArt}>
                    <Text style={styles.pill}>{canClaim ? 'Ready to claim' : `${remaining} pts to go`}</Text>
                  </LinearGradient>
                  <View style={styles.rewardBody}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDesc}>{reward.description || 'Tap for details'}</Text>
                    <Text style={styles.rewardPts}>{reward.points_required} pts</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No rewards yet</Text>
              <Text style={styles.emptyText}>Rewards created by this merchant will appear here automatically.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaigns & offers</Text>
          {(loyalty.campaigns.data ?? []).length > 0 ? (
            loyalty.campaigns.data?.map((campaign) => (
              <LinearGradient key={campaign.id} colors={['#eef5ff', '#fff7e8']} style={styles.campaignCard}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <Text style={styles.campaignText}>{campaign.description || 'Merchant campaign'}</Text>
              </LinearGradient>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No active campaigns</Text>
              <Text style={styles.emptyText}>Merchant campaigns will show here when they are published.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionMeta}>{merchant.name}</Text>
          </View>
          {(loyalty.activity.data ?? []).length > 0 ? (
            <View style={styles.activityCard}>
              {loyalty.activity.data?.map((item) => (
                <View key={item.id} style={styles.activityRow}>
                  <View style={styles.activityDot}><Text style={styles.activityDotText}>+</Text></View>
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{formatCurrency(item.purchase_amount)}</Text>
                    <Text style={styles.activityMeta}>{formatTime(item.transaction_date)}</Text>
                  </View>
                  <Text style={styles.activityPoints}>+{Number(item.points_awarded ?? 0)} pts</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No visits recorded yet</Text>
              <Text style={styles.emptyText}>When {merchant.name} awards points, activity will appear here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  shareText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 18 },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoImage: { width: 52, height: 52, borderRadius: 16 },
  logoText: { color: PB.accent, fontFamily: FONTS.extraBold, fontSize: 17 },
  category: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.bold, fontSize: 11 },
  name: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 25, letterSpacing: -0.6, marginTop: 4 },
  address: { color: 'rgba(255,255,255,.72)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 3 },
  memberCard: { margin: 18, marginTop: -34, backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: PB.borderSoft, shadowColor: '#0a2a6b', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  memberCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  cardEyebrow: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.2 },
  cardName: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, marginTop: 4 },
  cardCustomer: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, marginTop: 4 },
  qrBox: { width: 88, height: 88, borderRadius: 18, borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  cardNumberRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: PB.borderSoft },
  cardNumberLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  cardNumber: { color: PB.primary, fontFamily: FONTS.monoMedium, fontSize: 13, letterSpacing: 0.7, marginTop: 3 },
  walletActions: { gap: 10, marginTop: 14 },
  walletBtnDark: { height: 44, borderRadius: 15, backgroundColor: '#0b0d12', alignItems: 'center', justifyContent: 'center' },
  walletBtnLight: { height: 44, borderRadius: 15, backgroundColor: '#f7f9fd', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  walletDarkText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  walletLightText: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 13 },
  stats: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: PB.borderSoft },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 18 },
  statLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 9, textTransform: 'uppercase', marginTop: 3 },
  joinPrompt: { margin: 18, marginTop: -34, backgroundColor: '#fff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: PB.borderSoft },
  joinTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18 },
  joinText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  joinInlineBtn: { height: 48, borderRadius: 16, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  joinInlineText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 14 },
  section: { marginHorizontal: 18, marginTop: 22 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, marginBottom: 12, letterSpacing: -0.4 },
  sectionMeta: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 11 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: PB.borderSoft },
  cardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  stamp: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#d8dee9', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  stampFull: { backgroundColor: PB.accentStrong, borderColor: PB.accentStrong },
  stampText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 13 },
  rewardCard: { backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 12 },
  rewardArt: { height: 96, padding: 14 },
  pill: { color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, fontFamily: FONTS.bold, fontSize: 10 },
  rewardBody: { padding: 15 },
  rewardTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18 },
  rewardDesc: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 4 },
  rewardPts: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 13, marginTop: 10 },
  campaignCard: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 10 },
  campaignTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  campaignText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: PB.borderSoft },
  emptyTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 15 },
  emptyText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  activityCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: PB.borderSoft, overflow: 'hidden' },
  activityRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: PB.borderSoft },
  activityDot: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#eaf8f2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityDotText: { color: PB.success, fontFamily: FONTS.extraBold, fontSize: 15 },
  activityCopy: { flex: 1 },
  activityTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  activityMeta: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
  activityPoints: { color: PB.success, fontFamily: FONTS.extraBold, fontSize: 13 },
  missingState: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 },
});
