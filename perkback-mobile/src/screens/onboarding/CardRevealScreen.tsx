import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';
import { LoyaltyCard } from '../../components/ui/LoyaltyCard';
import { Button } from '../../components/ui/Button';

const CONFETTI_COLORS = ['#ffd07a', '#f7b94a', '#3f7ad4', '#fff', '#0a2a6b', '#e07ab1'];

interface CardRevealScreenProps {
  user?: {
    firstName: string;
    lastName: string;
    crn: string;
    cardNumber: string;
  };
  onAddAppleWallet: () => void;
  onAddGoogleWallet: () => void;
  onOpenCard: () => void;
}

export function CardRevealScreen({
  user = { firstName: 'Alex', lastName: 'Park', crn: '40231', cardNumber: '8821 0034 7720' },
  onAddAppleWallet,
  onAddGoogleWallet,
  onOpenCard,
}: CardRevealScreenProps) {
  const cardScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;

  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Icon pop
    Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start();

    // Text
    setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 200);

    // Card
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);

    // Buttons
    setTimeout(() => {
      Animated.timing(btnsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);

    // Confetti burst
    setTimeout(() => {
      confettiAnims.forEach((anim, i) => {
        const angle = (i / confettiAnims.length) * Math.PI * 2;
        const distance = 80 + Math.random() * 80;
        Animated.parallel([
          Animated.timing(anim.x, { toValue: Math.cos(angle) * distance, duration: 1000, useNativeDriver: true }),
          Animated.timing(anim.y, { toValue: Math.sin(angle) * distance - 60, duration: 1000, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0, duration: 1000, delay: 400, useNativeDriver: true }),
          Animated.timing(anim.rotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]).start();
      });
    }, 500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon with confetti */}
        <View style={styles.iconWrap}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <LinearGradient
              colors={['#ffd07a', '#f7b94a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Text style={styles.iconEmoji}>✦</Text>
            </LinearGradient>
          </Animated.View>

          {/* Confetti pieces */}
          {confettiAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  opacity: anim.opacity,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${180 + (i % 3) * 90}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.title}>Your card is ready 🎉</Text>
          <Text style={styles.sub}>
            Add it to your wallet so you can scan at the till in one tap.
          </Text>
        </Animated.View>

        {/* Loyalty card */}
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }, { translateY: cardY }],
            },
          ]}
        >
          <LoyaltyCard
            firstName={user.firstName}
            lastName={user.lastName}
            crn={user.crn}
            cardNumber={user.cardNumber}
          />
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.btns, { opacity: btnsOpacity }]}>
          {/* Apple Wallet */}
          <TouchableOpacity
            style={[styles.walletBtn, styles.appleBtn]}
            onPress={onAddAppleWallet}
            activeOpacity={0.85}
          >
            <Text style={styles.appleBtnIcon}></Text>
            <Text style={styles.appleText}>Add to Apple Wallet</Text>
          </TouchableOpacity>

          {/* Google Wallet */}
          <TouchableOpacity
            style={[styles.walletBtn, styles.googleBtn]}
            onPress={onAddGoogleWallet}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Add to Google Wallet</Text>
          </TouchableOpacity>

          <Button kind="primary" onPress={onOpenCard} style={styles.openBtn}>
            Open my card →
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f7b94a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 30,
    color: PB.primary,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 14,
    borderRadius: 2,
    top: 30,
    left: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: PB.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  cardWrap: {
    width: '100%',
    marginBottom: 28,
  },
  btns: {
    width: '100%',
    gap: 10,
  },
  walletBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleBtn: { backgroundColor: '#0b0d12' },
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
  },
  appleBtnIcon: { fontSize: 17, color: '#fff' },
  appleText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
  googleG: { fontSize: 15, fontFamily: FONTS.bold, color: '#4285F4' },
  googleText: { fontFamily: FONTS.bold, fontSize: 14, color: PB.fg },
  openBtn: { width: '100%', marginTop: 4 },
});
