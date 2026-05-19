import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PB, FONTS } from '../../constants/theme';

export function ScreenSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={[styles.skeleton, { width: '62%', height: 22 }]} />
      <View style={[styles.skeleton, { height: 150 }]} />
      <View style={styles.skeletonRow}>
        <View style={[styles.skeleton, styles.skeletonTile]} />
        <View style={[styles.skeleton, styles.skeletonTile]} />
      </View>
      <View style={[styles.skeleton, { height: 120 }]} />
    </View>
  );
}

export function ConnectionError({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <View style={styles.errorWrap}>
      <View style={styles.errorMark}>
        <Text style={styles.errorMarkText}>⌁</Text>
      </View>
      <Text style={styles.errorTitle}>Lost connection</Text>
      <Text style={styles.errorText}>{message || 'We could not reach PerkBack. Check your connection and try again.'}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: { gap: 14, paddingVertical: 10 },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  skeletonTile: { flex: 1, height: 112 },
  skeleton: { backgroundColor: '#e9edf5', borderRadius: 20, opacity: 0.85 },
  errorWrap: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorMark: { width: 62, height: 62, borderRadius: 22, backgroundColor: '#eef5ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorMarkText: { color: PB.primary, fontSize: 30, fontFamily: FONTS.extraBold },
  errorTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 20, marginBottom: 8 },
  errorText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 18 },
  retryBtn: { height: 44, borderRadius: 15, paddingHorizontal: 20, backgroundColor: PB.primary, justifyContent: 'center' },
  retryText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
});
