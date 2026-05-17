import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ── Onboarding slide visuals ──────────────────────────────────────────────

function VisualWalletStack() {
  const CARDS = [
    { name: 'Bondi Beans', pts: '480 pts', colors: ['#2a1a0e', '#5b3a1d'] as [string, string], rot: -9, yOff: 32 },
    { name: 'Field & Vine', pts: '980 pts', colors: ['#0f5f3d', '#3fa172'] as [string, string], rot: 0, yOff: 0 },
    { name: 'Lumen Beauty', pts: '800 pts', colors: ['#7b1f4d', '#e07ab1'] as [string, string], rot: 9, yOff: 32 },
  ];
  return (
    <View style={{ width: 280, height: 240, position: 'relative', alignSelf: 'center' }}>
      {CARDS.map((c, i) => (
        <LinearGradient
          key={i}
          colors={c.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            visualStyles.stackCard,
            {
              top: c.yOff,
              left: (280 - 200) / 2,
              transform: [{ rotate: `${c.rot}deg` }],
              zIndex: i,
              shadowOpacity: 0.4,
            },
          ]}
        >
          <Text style={visualStyles.stackCardLabel}>LOYALTY</Text>
          <Text style={visualStyles.stackCardName}>{c.name}</Text>
          <View style={visualStyles.stackCardBottom}>
            <Text style={visualStyles.stackCardMono}>•••• 7720</Text>
            <Text style={[visualStyles.stackCardMono, { fontFamily: FONTS.bold }]}>{c.pts}</Text>
          </View>
        </LinearGradient>
      ))}
    </View>
  );
}

function VisualScanEarn() {
  const corners = [
    { top: 18, left: 18, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
    { top: 18, right: 18, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
    { bottom: 18, left: 18, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
    { bottom: 18, right: 18, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  ];
  const N = 21;
  const cells: Array<{ r: number; c: number }> = [];
  const seed = 'PB-WALLET'.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const k = (r * 31 + c * 17 + seed) % 7;
      if (k < 3 && !((r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7))) {
        cells.push({ r, c });
      }
    }
  }
  const cellSize = 150 / N;

  return (
    <View style={{ width: 240, height: 240, alignSelf: 'center' }}>
      <View style={visualStyles.scanBox}>
        {/* QR-ish dots */}
        <View style={visualStyles.qrContainer}>
          {cells.slice(0, 80).map((cell, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: cell.c * cellSize + 1,
                top: cell.r * cellSize + 1,
                width: cellSize * 0.8,
                height: cellSize * 0.8,
                borderRadius: 1,
                backgroundColor: PB.primary,
              }}
            />
          ))}
          {/* Finder squares */}
          {[
            { top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 },
          ].map((pos, i) => (
            <View key={`f${i}`} style={[visualStyles.finderOuter, pos]}>
              <View style={visualStyles.finderMid}>
                <View style={visualStyles.finderInner} />
              </View>
            </View>
          ))}
          {/* Scan line */}
          <View style={visualStyles.scanLine} />
        </View>
        {/* Corner markers */}
        {corners.map((c, i) => (
          <View
            key={i}
            style={[
              { position: 'absolute', width: 30, height: 30, borderColor: PB.accentStrong, borderStyle: 'solid' },
              c,
            ]}
          />
        ))}
      </View>
      {/* +20 points badge */}
      <View style={visualStyles.pointsBadge}>
        <LinearGradient
          colors={['#ffd07a', '#f7b94a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={visualStyles.pointsBadgeGrad}
        >
          <Text style={visualStyles.pointsText}>+20 points</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

function VisualAIOffers() {
  const pins = [
    { left: 40, top: 30 }, { left: 170, top: 60 }, { left: 100, top: 150 },
    { left: 210, top: 140 }, { left: 60, top: 180 },
  ];
  return (
    <View style={visualStyles.mapBox}>
      {/* Map grid lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`h${i}`} style={[visualStyles.gridLine, { top: i * 40, left: 0, right: 0, height: 1 }]} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={`v${i}`} style={[visualStyles.gridLine, { left: i * 40, top: 0, bottom: 0, width: 1 }]} />
      ))}
      {/* Location pins */}
      {pins.map((p, i) => (
        <View key={i} style={[visualStyles.pin, { left: p.left, top: p.top }]} />
      ))}
      {/* Offer card */}
      <View style={visualStyles.offerCard}>
        <LinearGradient colors={[PB.accent, PB.accentStrong]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={visualStyles.offerIcon}>
          <Text style={{ fontSize: 14 }}>★</Text>
        </LinearGradient>
        <View>
          <Text style={visualStyles.offerTitle}>Bondi Beans</Text>
          <Text style={visualStyles.offerSub}>Double pts this weekend</Text>
        </View>
      </View>
    </View>
  );
}

// ── Slide data ────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'wallet',
    title: 'All your loyalty\ncards, unified.',
    sub: 'Every local store in one place. No more rummaging through paper punch cards.',
    visual: <VisualWalletStack />,
  },
  {
    id: 'scan',
    title: 'Scan, earn,\nrepeat.',
    sub: 'Show your QR at the till to earn points instantly — no app fumbling required.',
    visual: <VisualScanEarn />,
  },
  {
    id: 'ai',
    title: 'Smart deals\nnearby.',
    sub: 'AI-matched offers from stores around you, personalised to what you actually buy.',
    visual: <VisualAIOffers />,
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      onFinish();
    }
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.visualArea}>{item.visual}</View>
          </View>
        )}
      />

      {/* Text + controls overlay */}
      <View style={styles.bottom}>
        <Text style={styles.title}>{SLIDES[currentIndex].title}</Text>
        <Text style={styles.sub}>{SLIDES[currentIndex].sub}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} style={styles.continueBtn}>
            <LinearGradient
              colors={[PB.primary, '#1a4699']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueBtnGrad}
            >
              <Text style={styles.continueBtnText}>
                {currentIndex === SLIDES.length - 1 ? 'Get started' : 'Continue'} →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const visualStyles = StyleSheet.create({
  // Wallet stack
  stackCard: {
    position: 'absolute',
    width: 200,
    height: 124,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  stackCardLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    fontFamily: FONTS.semiBold,
  },
  stackCardName: {
    fontSize: 13,
    fontFamily: FONTS.extraBold,
    color: '#fff',
    marginTop: 4,
  },
  stackCardBottom: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stackCardMono: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  // Scan/earn
  scanBox: {
    width: 200,
    height: 200,
    borderRadius: 28,
    backgroundColor: `${PB.primary}10`,
    borderWidth: 1,
    borderColor: PB.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    overflow: 'hidden',
  },
  qrContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  finderOuter: {
    position: 'absolute',
    width: 7 * (150 / 21),
    height: 7 * (150 / 21),
    backgroundColor: PB.primary,
  },
  finderMid: {
    margin: 1,
    flex: 1,
    backgroundColor: '#fff',
    padding: 1,
  },
  finderInner: {
    flex: 1,
    backgroundColor: PB.primary,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: PB.accentStrong,
    shadowColor: PB.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    top: '50%',
  },
  pointsBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#f7b94a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsBadgeGrad: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pointsText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: PB.primary,
  },
  // AI offers / map
  mapBox: {
    width: 260,
    height: 220,
    borderRadius: 20,
    backgroundColor: PB.borderSoft,
    borderWidth: 1,
    borderColor: PB.border,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(63,122,212,0.12)',
  },
  pin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PB.accentStrong,
    shadowColor: PB.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  offerCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  offerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: PB.fg,
  },
  offerSub: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: PB.muted,
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.bg,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  sub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: PB.muted,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dfe3ec',
  },
  dotActive: {
    width: 22,
    borderRadius: 3,
    backgroundColor: PB.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  skipBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: PB.fg,
  },
  continueBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnGrad: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#fff',
  },
});
