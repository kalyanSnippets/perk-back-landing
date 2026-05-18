import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BrandLogo } from '../../src/components/BrandLogo';
import { PB, FONTS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ── Splash ────────────────────────────────────────────────────────────────
function SplashPhase({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(12)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringRotateRev = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 350);
    Animated.loop(Animated.timing(ringRotate, { toValue: 1, duration: 18000, useNativeDriver: true, isInteraction: false })).start();
    Animated.loop(Animated.timing(ringRotateRev, { toValue: -1, duration: 22000, useNativeDriver: true, isInteraction: false })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -8, duration: 1700, useNativeDriver: true, isInteraction: false }),
      Animated.timing(floatY, { toValue: 0, duration: 1700, useNativeDriver: true, isInteraction: false }),
    ])).start();
    setTimeout(onDone, 2400);
  }, []);

  const ringSpin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringSpinRev = ringRotateRev.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[PB.primary, '#071f50']} style={StyleSheet.absoluteFill} />
      <View style={splash.haloTop} />
      <View style={splash.haloBottom} />
      <View style={splash.center}>
        <Animated.View style={[splash.logoWrap, { opacity, transform: [{ scale }] }]}>
          <Animated.View style={[splash.ringOuter, { transform: [{ rotate: ringSpin }] }]} />
          <Animated.View style={[splash.ringInner, { transform: [{ rotate: ringSpinRev }] }]} />
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <BrandLogo variant="mark" width={106} height={106} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center' }}>
          <Text style={splash.appName}>PerkBack</Text>
          <Text style={splash.tagline}>Every visit, rewarded</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const splash = StyleSheet.create({
  haloTop: { position: 'absolute', width: 560, height: 560, borderRadius: 280, backgroundColor: 'rgba(255,208,122,0.4)', top: -180, left: -80 },
  haloBottom: { position: 'absolute', width: 480, height: 480, borderRadius: 240, backgroundColor: 'rgba(63,122,212,0.45)', bottom: -160, right: -120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 148, height: 148, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ringOuter: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 2, borderColor: 'rgba(255,208,122,0.7)', borderStyle: 'dashed' },
  ringInner: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  appName: { fontSize: 32, fontFamily: FONTS.extraBold, color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, marginTop: 6, fontFamily: FONTS.regular },
});

// ── Slide visuals ─────────────────────────────────────────────────────────
function WhiteLabelVisual() {
  const cards = [
    { bg: '#7c3aed', name: 'Luna Café', rotate: '-11deg', tx: -18, ty: -14 },
    { bg: '#0a2a6b', name: 'PerkBack HQ', rotate: '1deg', tx: 2, ty: 8 },
    { bg: '#be185d', name: 'Bloom Florist', rotate: '12deg', tx: 20, ty: -10 },
  ];
  return (
    <View style={{ width: 240, height: 170, alignItems: 'center', justifyContent: 'center' }}>
      {cards.map((c, i) => (
        <View key={i} style={[wlv.card, {
          backgroundColor: c.bg,
          transform: [{ rotate: c.rotate }, { translateX: c.tx }, { translateY: c.ty }],
          zIndex: i,
        }]}>
          <Text style={wlv.cardLabel}>LOYALTY</Text>
          <Text style={wlv.cardName}>{c.name}</Text>
          <View style={wlv.cardDot} />
          <View style={wlv.cardChip} />
        </View>
      ))}
    </View>
  );
}

const wlv = StyleSheet.create({
  card: { position: 'absolute', width: 188, height: 108, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
  cardLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 7, letterSpacing: 2, fontFamily: FONTS.bold },
  cardName: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold, marginTop: 6 },
  cardDot: { position: 'absolute', bottom: 12, right: 14, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
  cardChip: { position: 'absolute', bottom: 14, left: 14, width: 28, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,208,122,0.5)' },
});

function ScanVisual() {
  const dots = Array(25).fill(0).map((_, i) => i % 3 !== 1);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={scv.card}>
        <View style={scv.qrWrap}>
          {/* Corners */}
          {[{ t: 0, l: 0 }, { t: 0, r: 0 }, { b: 0, l: 0 }].map((pos, i) => (
            <View key={i} style={[scv.corner, pos as any]} />
          ))}
          {/* QR dot grid */}
          <View style={scv.grid}>
            {dots.map((filled, i) => (
              <View key={i} style={[scv.dot, { backgroundColor: filled ? PB.primary : 'transparent' }]} />
            ))}
          </View>
        </View>
        {/* Scan line */}
        <View style={scv.scanLine} />
        {/* Gold tick */}
        <View style={scv.tick}>
          <Text style={{ fontSize: 13, color: PB.primary }}>✓</Text>
        </View>
      </View>
      <View style={scv.badge}>
        <Text style={scv.badgeStar}>✦</Text>
        <Text style={scv.badgeText}>+25 points earned!</Text>
      </View>
    </View>
  );
}

const scv = StyleSheet.create({
  card: { width: 150, height: 150, borderRadius: 22, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eef0f6' },
  qrWrap: { width: 100, height: 100, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: PB.primary, borderRadius: 4, borderWidth: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 60, height: 60, gap: 3 },
  dot: { width: 9, height: 9, borderRadius: 2 },
  scanLine: { position: 'absolute', left: 20, right: 20, height: 2, backgroundColor: '#ffd07a', opacity: 0.9 },
  tick: { position: 'absolute', top: -10, right: -10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffd07a', alignItems: 'center', justifyContent: 'center', shadowColor: '#f7b94a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  badge: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PB.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeStar: { color: '#ffd07a', fontSize: 12 },
  badgeText: { color: '#fff', fontSize: 13, fontFamily: FONTS.bold },
});

function NearbyVisual() {
  const pins = [
    { top: 14, left: 18, label: '☕ Coffee', color: '#f7b94a' },
    { top: 60, right: 16, label: '🍜 Lunch', color: '#0a2a6b' },
    { top: 100, left: 54, label: '🥐 Bakery', color: '#be185d' },
    { top: 32, left: 118, label: '2× pts', color: '#059669' },
  ];
  return (
    <View style={nbv.map}>
      {[38, 76, 114].map(y => <View key={y} style={[nbv.gridLine, { top: y }]} />)}
      {[55, 110, 165].map(x => <View key={x} style={[nbv.gridLineV, { left: x }]} />)}
      {pins.map((p, i) => (
        <View key={i} style={[nbv.pinWrap, { top: p.top, left: (p as any).left, right: (p as any).right }]}>
          <View style={[nbv.pin, { backgroundColor: p.color }]}>
            <Text style={nbv.pinText}>{p.label}</Text>
          </View>
          <View style={[nbv.pinTail, { backgroundColor: p.color }]} />
        </View>
      ))}
      <View style={nbv.youDot}>
        <View style={nbv.youInner} />
      </View>
    </View>
  );
}

const nbv = StyleSheet.create({
  map: { width: 220, height: 150, borderRadius: 20, backgroundColor: '#eef2ff', overflow: 'hidden', position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#d4daf7' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#d4daf7' },
  pinWrap: { position: 'absolute', alignItems: 'center' },
  pin: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  pinText: { color: '#fff', fontSize: 10, fontFamily: FONTS.bold },
  pinTail: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  youDot: { position: 'absolute', bottom: 24, left: 90, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(63,122,212,0.2)', alignItems: 'center', justifyContent: 'center' },
  youInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PB.secondary, borderWidth: 2, borderColor: '#fff' },
});

// ── Carousel ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'whitelabel',
    title: 'Built around\nyour brand.',
    sub: 'Every local store gets a fully branded loyalty card — their colours, their name, their perks.',
    bg: '#f0eeff',
    Visual: WhiteLabelVisual,
  },
  {
    id: 'scan',
    title: 'Scan, earn,\nrepeat.',
    sub: 'Show your QR at the till to earn points instantly — no app fumbling required.',
    bg: '#fff8ed',
    Visual: ScanVisual,
  },
  {
    id: 'nearby',
    title: 'Smart deals\nnearby.',
    sub: 'Personalised offers from stores around you, matched to what you actually buy.',
    bg: '#f0f4ff',
    Visual: NearbyVisual,
  },
];

function CarouselPhase() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList>(null);
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const btnsY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(btnsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnsY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const goNext = () => {
    if (idx < SLIDES.length - 1) {
      const next = idx + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIdx(next);
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  return (
    <SafeAreaView style={car.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[car.slide, { width }]}>
            <View style={[car.visual, { backgroundColor: item.bg }]}>
              <item.Visual />
            </View>
          </View>
        )}
      />
      <View style={car.bottom}>
        <Text style={car.title}>{SLIDES[idx].title}</Text>
        <Text style={car.sub}>{SLIDES[idx].sub}</Text>
        <View style={car.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[car.dot, i === idx && car.dotActive]} />
          ))}
        </View>
        <Animated.View style={[car.actions, { opacity: btnsOpacity, transform: [{ translateY: btnsY }] }]}>
          <TouchableOpacity style={car.skipBtn} onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={car.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={car.nextBtn} onPress={goNext}>
            <LinearGradient colors={[PB.primary, '#1a4699']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={car.nextBtnGrad}>
              <Text style={car.nextText}>{idx === SLIDES.length - 1 ? 'Get started' : 'Continue'} →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={car.signInRow} onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={car.signInText}>Already have an account? <Text style={car.signInLink}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const car = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  slide: { alignItems: 'center', justifyContent: 'center' },
  visual: { width: width - 48, height: 240, borderRadius: 24, margin: 24, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 28, paddingBottom: 24 },
  title: { fontSize: 28, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, lineHeight: 34 },
  sub: { fontSize: 14, fontFamily: FONTS.regular, color: PB.muted, lineHeight: 21, marginTop: 10, marginBottom: 22 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dfe3ec' },
  dotActive: { width: 22, borderRadius: 3, backgroundColor: PB.primary },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  skipBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: FONTS.bold, fontSize: 14, color: PB.fg },
  nextBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  nextBtnGrad: { height: 50, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
  signInRow: { alignItems: 'center', paddingVertical: 4 },
  signInText: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
  signInLink: { fontFamily: FONTS.bold, color: PB.secondary, textDecorationLine: 'underline' },
});

// ── Root export ───────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const [showCarousel, setShowCarousel] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      {!showCarousel && <SplashPhase onDone={() => setShowCarousel(true)} />}
      {showCarousel && <CarouselPhase />}
    </View>
  );
}
