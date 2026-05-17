import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ── Splash phase ─────────────────────────────────────────────────────────
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

    // Auto-advance after 2.4s
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
          <Animated.View style={[splash.logoBox, { transform: [{ translateY: floatY }] }]}>
            <Text style={splash.logoLetter}>P</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center' }}>
          <Text style={splash.appName}>PerkBack</Text>
          <Text style={splash.tagline}>Earn back what you spend</Text>
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
  logoBox: { width: 88, height: 88, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 40, fontFamily: FONTS.extraBold, color: '#ffd07a' },
  appName: { fontSize: 32, fontFamily: FONTS.extraBold, color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginTop: 6, fontFamily: FONTS.regular },
});

// ── Carousel slides ───────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'wallet',
    title: 'All your loyalty\ncards, unified.',
    sub: 'Every local store in one place. No more rummaging through paper punch cards.',
    emoji: '💳',
    bg: '#f0f4ff',
  },
  {
    id: 'scan',
    title: 'Scan, earn,\nrepeat.',
    sub: 'Show your QR at the till to earn points instantly — no app fumbling required.',
    emoji: '📱',
    bg: '#fff8ed',
  },
  {
    id: 'ai',
    title: 'Smart deals\nnearby.',
    sub: 'Personalised offers from stores around you, matched to what you actually buy.',
    emoji: '✨',
    bg: '#f0fff8',
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
    <SafeAreaView style={carousel.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[carousel.slide, { width }]}>
            <View style={[carousel.visual, { backgroundColor: item.bg }]}>
              <Text style={carousel.emoji}>{item.emoji}</Text>
            </View>
          </View>
        )}
      />
      <View style={carousel.bottom}>
        <Text style={carousel.title}>{SLIDES[idx].title}</Text>
        <Text style={carousel.sub}>{SLIDES[idx].sub}</Text>
        <View style={carousel.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[carousel.dot, i === idx && carousel.dotActive]} />
          ))}
        </View>
        <Animated.View style={[carousel.actions, { opacity: btnsOpacity, transform: [{ translateY: btnsY }] }]}>
          <TouchableOpacity style={carousel.skipBtn} onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={carousel.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={carousel.nextBtn} onPress={goNext}>
            <LinearGradient colors={[PB.primary, '#1a4699']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={carousel.nextBtnGrad}>
              <Text style={carousel.nextText}>{idx === SLIDES.length - 1 ? 'Get started' : 'Continue'} →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={carousel.signInRow} onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={carousel.signInText}>Already have an account? <Text style={carousel.signInLink}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const carousel = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  slide: { alignItems: 'center', justifyContent: 'center' },
  visual: { width: width - 48, height: 260, borderRadius: 24, margin: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 80 },
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

// ── Main export ───────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const [showCarousel, setShowCarousel] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {!showCarousel && <SplashPhase onDone={() => setShowCarousel(true)} />}
      {showCarousel && <CarouselPhase />}
    </View>
  );
}
