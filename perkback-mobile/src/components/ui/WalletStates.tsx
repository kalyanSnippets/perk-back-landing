import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PB, FONTS } from '../../constants/theme';

export function WalletSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={[styles.skeleton, styles.hero]} />
      <View style={[styles.skeleton, styles.scan]} />
      <View style={styles.row}>
        <View style={[styles.skeleton, styles.smallCard]} />
        <View style={[styles.skeleton, styles.smallCard]} />
      </View>
    </View>
  );
}

export function EmptyWalletState() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>★</Text>
      </View>
      <Text style={styles.emptyTitle}>No store cards yet</Text>
      <Text style={styles.emptyBody}>
        Join a PerkBack merchant from Explore or scan a store QR to start collecting points here.
      </Text>
    </View>
  );
}

export function WalletErrorState({ message }: { message?: string }) {
  return (
    <View style={styles.emptyCard}>
      <View style={[styles.emptyIcon, styles.errorIcon]}>
        <Text style={styles.errorIconText}>!</Text>
      </View>
      <Text style={styles.emptyTitle}>Could not load wallet</Text>
      <Text style={styles.emptyBody}>{message || 'Pull to refresh and try again.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  skeleton: { backgroundColor: '#e9edf5', borderRadius: 22, overflow: 'hidden' },
  hero: { height: 210 },
  scan: { height: 158 },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, height: 120 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PB.borderSoft,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#102a5f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#fff3d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: { color: PB.accentStrong, fontFamily: FONTS.extraBold, fontSize: 24 },
  errorIcon: { backgroundColor: '#ffe8e8' },
  errorIconText: { color: PB.danger, fontFamily: FONTS.extraBold, fontSize: 24 },
  emptyTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 6 },
  emptyBody: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
