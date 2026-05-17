import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';

interface PermissionFrameProps {
  icon: string;
  badge?: string;
  title: string;
  sub: string;
  primaryLabel?: string;
  onAllow: () => void;
  onSkip: () => void;
}

function PermissionFrame({
  icon,
  badge,
  title,
  sub,
  primaryLabel = 'Allow',
  onAllow,
  onSkip,
}: PermissionFrameProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#ffd07a', '#f7b94a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}
          >
            <Text style={styles.iconText}>{icon}</Text>
          </LinearGradient>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>

        <View style={styles.btns}>
          <TouchableOpacity style={styles.allowBtn} onPress={onAllow} activeOpacity={0.85}>
            <LinearGradient
              colors={[PB.primary, '#1a4699']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.allowBtnGrad}
            >
              <Text style={styles.allowText}>{primaryLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── The three permission screens ─────────────────────────────────────────

interface PermProps {
  onAllow: () => void;
  onSkip: () => void;
}

export function PermNotifScreen({ onAllow, onSkip }: PermProps) {
  return (
    <PermissionFrame
      icon="🔔"
      badge="3"
      title="Never miss a perk"
      sub="Get push alerts for flash deals, redeemed rewards and points earned in real time."
      onAllow={onAllow}
      onSkip={onSkip}
    />
  );
}

export function PermLocationScreen({ onAllow, onSkip }: PermProps) {
  return (
    <PermissionFrame
      icon="📍"
      title="Discover stores nearby"
      sub="We use your location to surface rewards and promotions on the streets around you."
      onAllow={onAllow}
      onSkip={onSkip}
    />
  );
}

export function PermWalletScreen({ onAllow, onSkip }: PermProps) {
  return (
    <PermissionFrame
      icon="💳"
      title="One-tap at the till"
      sub="Add loyalty passes to Apple Wallet & Google Wallet so you can scan without opening the app."
      primaryLabel="Add to Wallet"
      onAllow={onAllow}
      onSkip={onSkip}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.bg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconWrap: {
    marginBottom: 32,
    position: 'relative',
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f7b94a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  iconText: {
    fontSize: 52,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: PB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PB.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: '#fff',
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: PB.muted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 12,
    marginBottom: 36,
  },
  btns: {
    width: '100%',
    gap: 10,
  },
  allowBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: PB.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  allowBtnGrad: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#fff',
  },
  skipBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: PB.muted,
  },
});
