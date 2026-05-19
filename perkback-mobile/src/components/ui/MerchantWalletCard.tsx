import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';
import { WalletMerchant } from '../../hooks/useCustomerWallet';

const FALLBACK_THEMES = [
  ['#2a1a0e', '#7b4f2d', '#ffd07a'],
  ['#0a1020', '#101830', '#2af0a5'],
  ['#0a2a6b', '#3f7ad4', '#ffd07a'],
  ['#3a0b1e', '#7b1f4d', '#ffcce0'],
  ['#0f5f3d', '#3fa172', '#ffd07a'],
] as const;

function getInitials(name?: string | null) {
  if (!name) return 'PB';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getTheme(item: WalletMerchant, index: number) {
  const fallback = FALLBACK_THEMES[index % FALLBACK_THEMES.length];
  return {
    primary: item.cardDesign?.primary_color || item.cardDesign?.background_color || fallback[0],
    secondary: item.cardDesign?.secondary_color || fallback[1],
    accent: item.cardDesign?.accent_color || fallback[2],
    text: item.cardDesign?.text_color || '#ffffff',
  };
}

export function MerchantWalletCard({ item, index }: { item: WalletMerchant; index: number }) {
  const merchant = item.merchant;
  const theme = getTheme(item, index);
  const spend = Number(item.total_spend ?? 0);

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={[styles.glow, { backgroundColor: theme.accent }]} />
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={styles.avatarText}>{getInitials(merchant?.name)}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{merchant?.is_active === false ? 'Paused' : 'Joined'}</Text>
        </View>
      </View>

      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {merchant?.name ?? 'PerkBack merchant'}
      </Text>
      <Text style={styles.category} numberOfLines={1}>
        {merchant?.category || merchant?.address || 'Local rewards'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Number(item.points ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Number(item.visits ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>visits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>${spend.toFixed(0)}</Text>
          <Text style={styles.statLabel}>spent</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 286,
    minHeight: 198,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#0a2a6b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.35,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 15 },
  statusPill: {
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statusText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 11 },
  name: { fontFamily: FONTS.extraBold, fontSize: 22, letterSpacing: -0.4 },
  category: { color: 'rgba(255,255,255,0.72)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  stat: { flex: 1 },
  statValue: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.62)', fontFamily: FONTS.medium, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: 10 },
});
