import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

const { width, height } = Dimensions.get('window');

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  top: `${10 + (i * 53) % 80}%` as const,
  left: `${(i * 37) % 92}%` as const,
  size: 5 + (i % 3) * 2,
  isGold: i % 2 === 0,
  delay: (i * 0.2) % 2,
}));

interface SplashScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function SplashScreen({ onGetStarted, onSignIn }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringRotateRev = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(12)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const btnsY = useRef(new Animated.Value(20)).current;

  const particleAnims = useRef(
    PARTICLES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Logo pop-in
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Text rise
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);

    // Buttons
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btnsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(btnsY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 600);

    // Ring rotations
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 18000, useNativeDriver: true, isInteraction: false })
    ).start();
    Animated.loop(
      Animated.timing(ringRotateRev, { toValue: -1, duration: 22000, useNativeDriver: true, isInteraction: false })
    ).start();

    // Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1700, useNativeDriver: true, isInteraction: false }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1700, useNativeDriver: true, isInteraction: false }),
      ])
    ).start();

    // Particles float
    particleAnims.forEach((anim, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(anim, { toValue: -8, duration: 2600 + (i % 5) * 400, useNativeDriver: true, isInteraction: false, delay: (i * 200) % 2000 }),
          Animated.timing(anim, { toValue: 0, duration: 2600 + (i % 5) * 400, useNativeDriver: true, isInteraction: false }),
        ]).start(loop);
      };
      loop();
    });
  }, []);

  const ringSpin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringSpinRev = ringRotateRev.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PB.primary} />
      <LinearGradient
        colors={[PB.primary, '#071f50']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow halos */}
      <View style={styles.haloTop} />
      <View style={styles.haloBottom} />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              top: parseFloat(p.top) * height / 100,
              left: parseFloat(p.left) * width / 100,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.isGold ? '#ffd07a' : 'rgba(255,255,255,0.5)',
              transform: [{ translateY: particleAnims[i] }],
            },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safeArea}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Animated.View
            style={[
              styles.logoWrap,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* Outer dashed ring */}
            <Animated.View
              style={[styles.ring, styles.ringOuter, { transform: [{ rotate: ringSpin }] }]}
            />
            {/* Inner ring */}
            <Animated.View
              style={[styles.ring, styles.ringInner, { transform: [{ rotate: ringSpinRev }] }]}
            />
            {/* Logo box */}
            <Animated.View style={[styles.logoBox, { transform: [{ translateY: floatAnim }] }]}>
              <Text style={styles.logoText}>P</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
            <Text style={styles.appName}>PerkBack</Text>
            <Text style={styles.tagline}>Earn back what you spend</Text>
          </Animated.View>

          {/* Loading dots */}
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        translateY: particleAnims[i] || new Animated.Value(0),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Headline + CTAs */}
        <Animated.View
          style={[
            styles.bottom,
            { opacity: btnsOpacity, transform: [{ translateY: btnsY }] },
          ]}
        >
          <Text style={styles.headline}>Earn back what{'\n'}you spend.</Text>
          <Text style={styles.subHeadline}>
            Loyalty rewards from your favourite local stores — one card, one app.
          </Text>
          <View style={styles.btns}>
            <Button kind="gold" onPress={onGetStarted} style={styles.btn}>
              Get started
            </Button>
            <Button
              kind="glass"
              onPress={onSignIn}
              style={styles.btn}
              textStyle={{ color: '#fff' }}
            >
              I have an account
            </Button>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.primary,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  haloTop: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: 'rgba(255,208,122,0.4)',
    top: -180,
    left: -80,
  },
  haloBottom: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(63,122,212,0.45)',
    bottom: -160,
    right: -120,
  },
  particle: {
    position: 'absolute',
    opacity: 0.7,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  logoWrap: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  ringOuter: {
    inset: 0,
    width: 148,
    height: 148,
    borderWidth: 2,
    borderColor: 'rgba(255,208,122,0.7)',
    borderStyle: 'dashed',
  },
  ringInner: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontFamily: FONTS.extraBold,
    color: '#ffd07a',
  },
  appName: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headline: {
    fontSize: 34,
    fontFamily: FONTS.extraBold,
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 12,
  },
  subHeadline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    fontFamily: FONTS.regular,
    marginBottom: 24,
  },
  btns: {
    gap: 10,
  },
  btn: {
    width: '100%',
  },
});
