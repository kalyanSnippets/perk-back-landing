import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LoyaltyCard } from '../../src/components/ui/LoyaltyCard';
import { MerchantWalletCard } from '../../src/components/ui/MerchantWalletCard';
import { WalletScanCard } from '../../src/components/ui/WalletScanCard';
import { EmptyWalletState, WalletErrorState, WalletSkeleton } from '../../src/components/ui/WalletStates';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { PB, FONTS } from '../../src/constants/theme';

function formatCurrency(value?: number) {
  return `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'gold' | 'green' }) {
  const toneStyle = tone === 'gold' ? styles.statGold : tone === 'green' ? styles.statGreen : styles.statBlue;
  return (
    <View style={[styles.statCard, toneStyle]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function MyCardScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const wallet = useCustomerWallet(customer?.id);
  const nameParts = customer?.full_name?.split(' ') ?? ['', ''];
  const totalMerchantPoints = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.points ?? 0), 0) ?? 0,
    [wallet.data]
  );
  const totalVisits = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.visits ?? 0), 0) ?? 0,
    [wallet.data]
  );
  const totalSpend = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.total_spend ?? 0), 0) ?? 0,
    [wallet.data]
  );

  const handleRefresh = async () => {
    await Promise.all([refreshCustomer(), wallet.refetch()]);
  };

  const cardNumber = customer?.loyalty_card_number ?? '0000000000';
  const isRefreshing = wallet.isRefetching;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={PB.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>PerkBack Wallet</Text>
            <Text style={styles.heading}>My Card</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.scanBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {wallet.isLoading ? (
          <WalletSkeleton />
        ) : (
          <>
            <View style={styles.heroWrap}>
              <LoyaltyCard
                firstName={nameParts[0]}
                lastName={nameParts.slice(1).join(' ')}
                crn={customer?.crn ?? '—'}
                cardNumber={cardNumber}
                points={customer?.points_balance ?? 0}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="global points" value={(customer?.points_balance ?? 0).toLocaleString()} tone="blue" />
              <StatCard label="store points" value={totalMerchantPoints.toLocaleString()} tone="gold" />
              <StatCard label="visits" value={totalVisits.toLocaleString()} tone="green" />
            </View>

            <WalletScanCard value={cardNumber} />

            <LinearGradient colors={['#fff7e8', '#eef6ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryEyebrow}>Wallet summary</Text>
                <Text style={styles.summaryTitle}>{wallet.data?.length ?? 0} joined stores</Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summarySpend}>{formatCurrency(totalSpend)}</Text>
                <Text style={styles.summaryLabel}>tracked spend</Text>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Store cards</Text>
                <Text style={styles.sectionSub}>Swipe through your joined merchants</Text>
              </View>
            </View>

            {wallet.isError ? (
              <WalletErrorState message={wallet.error instanceof Error ? wallet.error.message : undefined} />
            ) : wallet.data && wallet.data.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.merchantList}>
                {wallet.data.map((item, index) => (
                  <MerchantWalletCard key={item.id} item={item} index={index} />
                ))}
              </ScrollView>
            ) : (
              <EmptyWalletState />
            )}

            <View style={styles.helperCard}>
              <View style={styles.helperIcon}>
                <Text style={styles.helperIconText}>i</Text>
              </View>
              <View style={styles.helperCopy}>
                <Text style={styles.helperTitle}>One customer number everywhere</Text>
                <Text style={styles.helperText}>
                  Your PerkBack CRN and loyalty card number stay the same. Points and visits are tracked separately for each merchant.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  kicker: {
    color: PB.accentStrong,
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  heading: { fontSize: 31, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.8 },
  scanBtn: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 13 },
  heroWrap: { marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PB.borderSoft,
  },
  statBlue: { backgroundColor: '#eef5ff' },
  statGold: { backgroundColor: '#fff4d8' },
  statGreen: { backgroundColor: '#eaf8f2' },
  statValue: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, letterSpacing: -0.4 },
  statLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.7 },
  summaryCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: PB.borderSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryEyebrow: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  summaryTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, marginTop: 3 },
  summaryRight: { alignItems: 'flex-end' },
  summarySpend: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 20 },
  summaryLabel: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11 },
  sectionHeader: { marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 21, letterSpacing: -0.4 },
  sectionSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, marginTop: 2 },
  merchantList: { paddingRight: 20, paddingBottom: 4 },
  helperCard: {
    flexDirection: 'row',
    gap: 13,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: PB.borderSoft,
  },
  helperIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#e9f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperIconText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 18 },
  helperCopy: { flex: 1 },
  helperTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14, marginBottom: 3 },
  helperText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18 },
});
