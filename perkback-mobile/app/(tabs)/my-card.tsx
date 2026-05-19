import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { MerchantWalletCard } from '../../src/components/ui/MerchantWalletCard';
import { EmptyWalletState, WalletErrorState, WalletSkeleton } from '../../src/components/ui/WalletStates';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { useCustomerActivity } from '../../src/hooks/useCustomerActivity';
import { PB, FONTS } from '../../src/constants/theme';

function formatCurrency(value?: number) {
  return `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function MyCardScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const wallet = useCustomerWallet(customer?.id);
  const activity = useCustomerActivity(customer?.id);

  const totals = useMemo(() => {
    const cards = wallet.data ?? [];
    return {
      cards: cards.length,
      points: cards.reduce((sum, item) => sum + Number(item.points_balance ?? item.points ?? 0), 0),
      visits: cards.reduce((sum, item) => sum + Number(item.visit_count ?? item.visits ?? 0), 0),
      spend: cards.reduce((sum, item) => sum + Number(item.total_spend ?? 0), 0),
    };
  }, [wallet.data]);

  const handleRefresh = async () => {
    await Promise.all([refreshCustomer(), wallet.refetch(), activity.refetch()]);
  };

  const isRefreshing = wallet.isRefetching || activity.isRefetching;
  const recentActivity = activity.data?.slice(0, 6) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={PB.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Customer wallet</Text>
            <Text style={styles.heading}>My loyalty cards</Text>
            <Text style={styles.sub}>All merchant programmes linked to your PerkBack account.</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')} activeOpacity={0.86}>
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#eef5ff', '#fff7e8']} style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totals.cards}</Text>
            <Text style={styles.summaryLabel}>cards</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totals.points.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>merchant pts</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totals.visits}</Text>
            <Text style={styles.summaryLabel}>visits</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Joined merchants</Text>
          <Text style={styles.sectionSub}>{formatCurrency(totals.spend)} tracked spend</Text>
        </View>

        {wallet.isLoading ? (
          <WalletSkeleton />
        ) : wallet.isError ? (
          <WalletErrorState message={wallet.error instanceof Error ? wallet.error.message : undefined} />
        ) : wallet.data && wallet.data.length > 0 ? (
          <View>
            {wallet.data.map((item, index) => (
              <MerchantWalletCard
                key={item.id}
                item={item}
                index={index}
                compact
                onPress={() => router.push(`/merchant/${item.merchant_id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyWalletState />
        )}

        <View style={styles.joinCard}>
          <View style={styles.joinCopy}>
            <Text style={styles.joinTitle}>Join another store</Text>
            <Text style={styles.joinText}>Scan a merchant QR at the counter to add their loyalty card here.</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.joinBtnText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent merchant activity</Text>
          <Text style={styles.sectionSub}>Points are always merchant-specific</Text>
        </View>

        {recentActivity.length > 0 ? (
          <View style={styles.activityCard}>
            {recentActivity.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={styles.activityDot}><Text style={styles.activityDotText}>+</Text></View>
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{item.merchant_name}</Text>
                  <Text style={styles.activityMeta}>{formatTime(item.transaction_date)} · {formatCurrency(item.purchase_amount)}</Text>
                </View>
                <Text style={styles.activityPoints}>+{Number(item.points_awarded ?? 0)} pts</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyTitle}>No merchant activity yet</Text>
            <Text style={styles.emptyText}>Once a merchant awards points, it will appear here under that merchant.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 14 },
  kicker: { color: PB.accentStrong, fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1.3 },
  heading: { fontSize: 30, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.8, marginTop: 2 },
  sub: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, lineHeight: 17, marginTop: 4, maxWidth: 260 },
  scanBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  scanText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  summary: { flexDirection: 'row', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: PB.borderSoft, marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 21 },
  summaryLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(10,42,107,.12)' },
  sectionHeader: { marginTop: 12, marginBottom: 12 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, letterSpacing: -0.4 },
  sectionSub: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, marginTop: 2 },
  joinCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: PB.borderSoft, marginTop: 4 },
  joinCopy: { flex: 1 },
  joinTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  joinText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  joinBtn: { height: 42, paddingHorizontal: 14, borderRadius: 15, backgroundColor: PB.accentStrong, justifyContent: 'center' },
  joinBtnText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 12 },
  activityCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: PB.borderSoft, overflow: 'hidden' },
  activityRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: PB.borderSoft },
  activityDot: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#eaf8f2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityDotText: { color: PB.success, fontFamily: FONTS.extraBold, fontSize: 16 },
  activityCopy: { flex: 1 },
  activityTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  activityMeta: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
  activityPoints: { color: PB.success, fontFamily: FONTS.extraBold, fontSize: 13 },
  emptyActivity: { backgroundColor: '#fff', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: PB.borderSoft },
  emptyTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  emptyText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
