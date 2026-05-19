import React, { useState } from 'react';
import { Alert, Linking, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { PB, FONTS } from '../../constants/theme';
import { WalletMerchant } from '../../hooks/useCustomerWallet';
import { supabase } from '../../lib/supabase';

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

export function MerchantWalletCard({
  item,
  index,
  onPress,
  compact = false,
}: {
  item: WalletMerchant;
  index: number;
  onPress?: () => void;
  compact?: boolean;
}) {
  const merchant = item.merchant;
  const theme = getTheme(item, index);
  const spend = Number(item.total_spend ?? 0);
  const [flipped, setFlipped] = useState(false);
  const cardNumber = `${item.customer_id.slice(0, 8).toUpperCase()}-${item.merchant_id.slice(0, 8).toUpperCase()}`;

  const copyCardNumber = async () => {
    await Clipboard.setStringAsync(cardNumber);
    Alert.alert('Copied', 'Card number copied.');
  };

  const addWallet = async (walletType: 'apple' | 'google') => {
    const functionName = walletType === 'apple' ? 'apple-wallet-pass' : 'google-wallet-pass';
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { customer_id: item.customer_id, merchant_id: item.merchant_id },
    });
    if (error) {
      Alert.alert('Wallet unavailable', error.message);
      return;
    }
    const url = (data as any)?.url ?? (data as any)?.save_url;
    if (url) Linking.openURL(url);
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => setFlipped((value) => !value)}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <View style={[styles.glow, { backgroundColor: theme.accent }]} />
        {!flipped ? (
          <>
            <View style={styles.topRow}>
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{getInitials(merchant?.name)}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{merchant?.is_active === false ? 'Paused' : 'Joined'}</Text>
              </View>
            </View>

            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {merchant?.name ?? 'Merchant details unavailable'}
            </Text>
            <Text style={styles.category} numberOfLines={1}>
              {merchant?.category || merchant?.address || 'Local rewards'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{Number(item.points_balance ?? item.points ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{Number(item.visit_count ?? item.visits ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>visits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>${spend.toFixed(0)}</Text>
                <Text style={styles.statLabel}>spent</Text>
              </View>
            </View>
            <Text style={styles.tapHint}>Tap card to show QR and barcode</Text>
          </>
        ) : (
          <View style={styles.backContent}>
            <View style={styles.backTop}>
              <View>
                <Text style={styles.backLabel}>SCAN AT TILL</Text>
                <Text style={styles.backName} numberOfLines={1}>{merchant?.name ?? 'Merchant card'}</Text>
              </View>
              <View style={styles.qrBox}>
                <QRCode value={cardNumber} size={70} color={PB.primary} backgroundColor="#fff" />
              </View>
            </View>
            <View style={styles.barcode}>
              {Array.from({ length: 34 }).map((_, barIndex) => (
                <View
                  key={barIndex}
                  style={[
                    styles.bar,
                    { height: 24 + ((barIndex * 7) % 18), width: barIndex % 4 === 0 ? 3 : 2 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.cardNumber}>{cardNumber}</Text>
            <View style={styles.backActions}>
              <TouchableOpacity style={styles.backAction} onPress={copyCardNumber}>
                <Text style={styles.backActionText}>Copy number</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backAction} onPress={onPress}>
                <Text style={styles.backActionText}>View rewards</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.walletRow}>
              <TouchableOpacity style={styles.walletButton} onPress={() => addWallet('apple')}>
                <Text style={styles.walletText}>Apple Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletButton} onPress={() => addWallet('google')}>
                <Text style={styles.walletText}>Google Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
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
  cardCompact: {
    width: '100%',
    marginRight: 0,
    marginBottom: 14,
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
  tapHint: { color: 'rgba(255,255,255,0.58)', fontFamily: FONTS.medium, fontSize: 10, marginTop: 10 },
  backContent: { flex: 1 },
  backTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backLabel: { color: 'rgba(255,255,255,0.62)', fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 1.2 },
  backName: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 17, marginTop: 3, maxWidth: 160 },
  qrBox: { width: 84, height: 84, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  barcode: { height: 58, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 13 },
  bar: { backgroundColor: PB.primary, borderRadius: 1 },
  cardNumber: { color: '#fff', fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1.2, textAlign: 'center', marginTop: 9 },
  backActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  backAction: { flex: 1, height: 34, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backActionText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 11 },
  walletRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  walletButton: { flex: 1, height: 34, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  walletText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 11 },
});
