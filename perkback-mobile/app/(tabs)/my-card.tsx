import React, { useMemo } from 'react';
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LoyaltyCard } from '../../src/components/ui/LoyaltyCard';
import { MerchantWalletCard } from '../../src/components/ui/MerchantWalletCard';
import { WalletScanCard } from '../../src/components/ui/WalletScanCard';
import { EmptyWalletState, WalletErrorState, WalletSkeleton } from '../../src/components/ui/WalletStates';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { useCustomerActivity } from '../../src/hooks/useCustomerActivity';
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

function formatMemberSince(value?: string | null) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function MyCardScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const wallet = useCustomerWallet(customer?.id);
  const activity = useCustomerActivity(customer?.id);
  const [codeVisible, setCodeVisible] = React.useState(false);
  const nameParts = customer?.full_name?.split(' ') ?? ['', ''];
  const totalMerchantPoints = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.points_balance ?? item.points ?? 0), 0) ?? 0,
    [wallet.data]
  );
  const totalVisits = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.visit_count ?? item.visits ?? 0), 0) ?? 0,
    [wallet.data]
  );
  const totalSpend = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.total_spend ?? 0), 0) ?? 0,
    [wallet.data]
  );

  const handleRefresh = async () => {
    await Promise.all([refreshCustomer(), wallet.refetch(), activity.refetch()]);
  };

  const cardNumber = customer?.loyalty_card_number ?? '0000000000';
  const isRefreshing = wallet.isRefetching || activity.isRefetching;
  const recentActivity = activity.data?.slice(0, 10) ?? [];

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
            <Text style={styles.memberSince}>Member since {formatMemberSince(customer?.created_at)}</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85} onPress={() => router.push('/scan')}>
            <Text style={styles.scanBtnText}>Scan</Text>
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
              <StatCard label="visits" value={totalVisits.toLocaleString()} tone="gold" />
              <StatCard label="member since" value={formatMemberSince(customer?.created_at)} tone="green" />
            </View>

            <TouchableOpacity style={styles.showCodeBtn} activeOpacity={0.9} onPress={() => setCodeVisible(true)}>
              <Text style={styles.showCodeText}>Show loyalty code</Text>
              <Text style={styles.showCodeArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.statsGrid}>
              <StatCard label="store points" value={totalMerchantPoints.toLocaleString()} tone="blue" />
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

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Text style={styles.sectionSub}>Your latest points and visits</Text>
              </View>
            </View>

            {recentActivity.length > 0 ? (
              <View style={styles.activityCard}>
                {recentActivity.map((item) => {
                  const earned = Number(item.points_awarded ?? 0) >= 0;
                  return (
                    <View key={item.id} style={styles.activityRow}>
                      <View style={[styles.activityDot, earned ? styles.activityEarn : styles.activityRedeem]}>
                        <Text style={styles.activityDotText}>{earned ? '+' : '-'}</Text>
                      </View>
                      <View style={styles.activityCopy}>
                        <Text style={styles.activityTitle}>{item.merchant_name}</Text>
                        <Text style={styles.activityMeta}>{item.source || 'purchase'} · {formatActivityTime(item.transaction_date)}</Text>
                      </View>
                      <Text style={[styles.activityPoints, earned ? styles.pointsEarn : styles.pointsRedeem]}>
                        {earned ? '+' : ''}{Number(item.points_awarded ?? 0)} pts
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyActivityTitle}>No transactions yet</Text>
                <Text style={styles.emptyActivityText}>Scan your code at a store to start earning points.</Text>
              </View>
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
      <Modal visible={codeVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCodeVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalTop}>
            <TouchableOpacity onPress={() => setCodeVisible(false)} activeOpacity={0.8}>
              <Text style={styles.closeText}>× Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Your PerkBack Code</Text>
            <Text style={styles.modalSub}>Show this at the counter to earn points</Text>
            <WalletScanCard value={cardNumber} />
            <Text style={styles.modalCrn}>{customer?.crn ?? 'CRN pending'}</Text>
            <Text style={styles.modalHint}>Increase brightness for easier scanning</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={async () => {
                await Clipboard.setStringAsync(cardNumber);
              }}
            >
              <Text style={styles.copyText}>Copy card number</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  memberSince: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12, marginTop: 2 },
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
  showCodeBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: PB.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  showCodeText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 15 },
  showCodeArrow: { color: PB.accent, fontFamily: FONTS.extraBold, fontSize: 20 },
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
  activityCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: PB.borderSoft, overflow: 'hidden' },
  activityRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: PB.borderSoft },
  activityDot: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityEarn: { backgroundColor: '#eaf8f2' },
  activityRedeem: { backgroundColor: '#fff4d8' },
  activityDotText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 17 },
  activityCopy: { flex: 1 },
  activityTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  activityMeta: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  activityPoints: { fontFamily: FONTS.extraBold, fontSize: 13 },
  pointsEarn: { color: PB.success },
  pointsRedeem: { color: PB.accentStrong },
  emptyActivity: { backgroundColor: '#fff', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: PB.borderSoft },
  emptyActivityTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 16 },
  emptyActivityText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 4 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalTop: { paddingHorizontal: 22, paddingTop: 10 },
  closeText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 15 },
  modalBody: { flex: 1, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', gap: 18 },
  modalTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 27, letterSpacing: -0.6, textAlign: 'center' },
  modalSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', marginTop: -12 },
  modalCrn: { color: PB.primary, fontFamily: FONTS.monoMedium, fontSize: 18, letterSpacing: 2 },
  modalHint: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 12 },
  copyBtn: { height: 48, paddingHorizontal: 22, borderRadius: 16, backgroundColor: PB.primary, justifyContent: 'center' },
  copyText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
});
