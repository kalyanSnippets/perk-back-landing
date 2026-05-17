import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'perkback://reset-password',
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        {sent ? (
          <>
            <Text style={styles.emoji}>📬</Text>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.sub}>We sent a password reset link to <Text style={styles.emailText}>{email}</Text>. Tap the link to set a new password.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.btnText}>Back to sign in</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.sub}>Enter your email and we'll send a reset link.</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input} value={email} onChangeText={setEmail}
              placeholder="you@email.com" placeholderTextColor={PB.muted}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email"
            />
            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: PB.fg },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: FONTS.regular, color: PB.muted, lineHeight: 21, marginBottom: 24 },
  emailText: { fontFamily: FONTS.bold, color: PB.fg },
  label: { fontSize: 12, fontFamily: FONTS.bold, color: PB.fg, marginLeft: 4, marginBottom: 6 },
  input: { height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: PB.border, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 15, fontFamily: FONTS.regular, color: PB.fg, marginBottom: 20 },
  btn: { height: 52, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
});
