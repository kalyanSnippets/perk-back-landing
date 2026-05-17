import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity, Alert, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { LoyaltyCard } from '../../src/components/ui/LoyaltyCard';
import { PB, FONTS } from '../../src/constants/theme';

const CONFETTI_COLORS = ['#ffd07a', '#f7b94a', '#3f7ad4', '#fff', '#0a2a6b', '#e07ab1'];

export default function CardRevealScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const iconScale = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(30)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(Array.from({ length: 20 }, () => ({ x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(1), rotate: new Animated.Value(0) }))).current;

  useEffect(() => {
    refreshCustomer();
    Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);
    setTimeout(() => Animated.timing(btnsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(), 600);
    setTimeout(() => {
      confettiAnims.forEach((a, i) => {
        const angle = (i / confettiAnims.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 80;
        Animated.parallel([
          Animated.timing(a.x, { toValue: Math.cos(angle) * dist, duration: 1000, useNativeDriver: true }),
          Animated.timing(a.y, { toValue: Math.sin(angle) * dist - 60, duration: 1000, useNativeDriver: true }),
          Animated.timing(a.opacity, { toValue: 0, duration: 1000, delay: 400, useNativeDriver: true }),
          Animated.timing(a.rotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]).start();
      });
    }, 500);
  }, []);

  const handleAddAppleWallet = async () => {
    if (!customer) return;
    const { data, error } = await supabase.functions.invoke('apple-wallet-pass', { body: { customer_id: customer.id } });
    if (error) { Alert.alert('Error', 'Could not generate Apple Wallet pass.'); return; }
    if (data?.url) await Linking.openURL(data.url);
  };

  const handleAddGoogleWallet = async () => {
    if (!customer) return;
    const { data, error } = await supabase.functions.invoke('google-wallet-pass', { body: { customer_id: customer.id } });
    if (error) { Alert.alert('Error', 'Could not generate Google Wallet pass.'); return; }
    if (data?.save_url) await Linking.openURL(data.save_url);
  };

  const nameParts = customer?.full_name?.split(' ') ?? ['', ''];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <LinearGradient colors={['#ffd07a', '#f7b94a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <Text style={styles.iconGlyph}>✦</Text>
            </LinearGradient>
          </Animated.View>
          {confettiAnims.map((a, i) => (
            <Animated.View key={i} style={[styles.confetti, { backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length], opacity: a.opacity, transform: [{ translateX: a.x }, { translateY: a.y }, { rotate: a.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${180 + (i % 3) * 90}deg`] }) }] }]} />
          ))}
        </View>

        <Text style={styles.title}>Your card is ready 🎉</Text>
        <Text style={styles.sub}>Add it to your wallet so you can scan at the till in one tap.</Text>

        <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }, { translateY: cardY }], width: '100%', marginBottom: 28 }}>
          <LoyaltyCard
            firstName={nameParts[0]}
            lastName={nameParts.slice(1).join(' ')}
            crn={customer?.crn ?? '—'}
            cardNumber={customer?.loyalty_card_number ?? '—— —— —— ——'}
            points={customer?.points_balance ?? 0}
          />
        </Animated.View>

        <Animated.View style={[styles.btns, { opacity: btnsOpacity }]}>
          <TouchableOpacity style={styles.appleBtn} onPress={handleAddAppleWallet} activeOpacity={0.85}>
            <Text style={styles.appleBtnText}> Add to Apple Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.googleBtn} onPress={handleAddGoogleWallet} activeOpacity={0.85}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Add to Google Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.openBtn} onPress={() => router.replace('/(onboarding)/permissions')} activeOpacity={0.85}>
            <Text style={styles.openBtnText}>Open my card →</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, alignItems: 'center' },
  iconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' },
  iconBox: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#f7b94a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 8 },
  iconGlyph: { fontSize: 30, color: PB.primary },
  confetti: { position: 'absolute', width: 8, height: 14, borderRadius: 2, top: 30, left: 30 },
  title: { fontSize: 24, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, textAlign: 'center', lineHeight: 19, marginBottom: 24, paddingHorizontal: 12 },
  btns: { width: '100%', gap: 10 },
  appleBtn: { height: 52, borderRadius: 14, backgroundColor: '#0b0d12', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  appleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
  googleBtn: { height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleG: { fontSize: 16, fontFamily: FONTS.bold, color: '#4285F4' },
  googleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: PB.fg },
  openBtn: { height: 52, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  openBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
});
