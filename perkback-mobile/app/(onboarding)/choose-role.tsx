import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { PB, FONTS } from '../../src/constants/theme';

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { user, refreshCustomer } = useAuth();
  const [selected, setSelected] = useState<'customer' | 'merchant'>('customer');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (selected === 'merchant') {
      Alert.alert('Use the web app', 'Merchant accounts are managed at perkback.com.au');
      return;
    }
    if (!user) return;
    setLoading(true);
    // Check if customers row already created by trigger
    const { data } = await supabase.from('customers').select('id').eq('user_id', user.id).maybeSingle();
    if (data) {
      await refreshCustomer();
      router.replace('/(onboarding)/card-reveal');
    } else {
      // Trigger may not have run yet (e.g. OAuth without metadata) — let next screen handle it
      router.replace('/(onboarding)/card-reveal');
    }
    setLoading(false);
  };

  const ROLES = [
    { id: 'customer' as const, emoji: '☕', title: "I'm a customer", sub: 'Earn points and rewards at local stores.' },
    { id: 'merchant' as const, emoji: '🏪', title: "I'm a merchant", sub: 'Run loyalty for your store. Use the web app.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.logoRow}><Text style={styles.logoName}>PerkBack</Text></View>
      <View style={styles.body}>
        <Text style={styles.title}>How will you use PerkBack?</Text>
        <Text style={styles.sub}>Pick the path — you can switch later.</Text>
        <View style={styles.cards}>
          {ROLES.map(r => {
            const sel = selected === r.id;
            return (
              <TouchableOpacity key={r.id} style={[styles.card, sel && styles.cardSelected]} onPress={() => setSelected(r.id)} activeOpacity={0.8}>
                <View style={[styles.roleEmoji, { backgroundColor: sel ? PB.primary : PB.borderSoft }]}>
                  <Text style={styles.emojiText}>{r.emoji}</Text>
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{r.title}</Text>
                  <Text style={styles.roleSub}>{r.sub}</Text>
                </View>
                <View style={[styles.radio, sel && styles.radioSelected]}>
                  {sel && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.6 }]} onPress={handleContinue} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{loading ? 'Setting up…' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  logoRow: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  logoName: { fontSize: 20, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.3 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, lineHeight: 32 },
  sub: { fontSize: 14, fontFamily: FONTS.regular, color: PB.muted, marginTop: 8, marginBottom: 24 },
  cards: { gap: 12, marginBottom: 28 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: PB.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: PB.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardSelected: { borderColor: PB.primary, borderWidth: 2 },
  roleEmoji: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 15, fontFamily: FONTS.bold, color: PB.fg },
  roleSub: { fontSize: 12, fontFamily: FONTS.regular, color: PB.muted, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: PB.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: PB.primary, backgroundColor: PB.primary },
  checkmark: { fontSize: 11, color: '#fff', fontFamily: FONTS.bold },
  cta: { height: 52, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
});
