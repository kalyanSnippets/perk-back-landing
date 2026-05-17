import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Sign-in failed', error.message);
    // AuthContext onAuthStateChange handles redirect
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'perkback://auth/callback' },
    });
    if (error) Alert.alert(`${provider} sign-in failed`, error.message);
  };

  const inputStyle = (field: string) => [
    styles.input,
    focused === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.logoName}>PerkBack</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your account.</Text>

          {/* OAuth */}
          <View style={styles.oauthSection}>
            <TouchableOpacity
              style={styles.appleBtn}
              onPress={() => handleOAuth('apple')}
              activeOpacity={0.85}
            >
              <Text style={styles.appleBtnText}> Continue with Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => handleOAuth('google')}
              activeOpacity={0.85}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={inputStyle('email')}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@email.com"
                placeholderTextColor={PB.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={inputStyle('password')}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                placeholderTextColor={PB.muted}
                secureTextEntry
                autoComplete="password"
              />
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end' }}
            >
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.6 }]}
            onPress={handleEmailSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpRow}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.signUpText}>
              No account?{' '}
              <Text style={styles.signUpLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: PB.fg },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  logoBox: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: PB.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: PB.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 24, fontFamily: FONTS.extraBold, color: '#ffd07a' },
  logoName: { fontSize: 18, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.3 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: FONTS.regular, color: PB.muted, marginBottom: 24 },
  oauthSection: { gap: 10, marginBottom: 16 },
  appleBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#0b0d12',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  appleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
  googleBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: PB.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  googleG: { fontSize: 16, fontFamily: FONTS.bold, color: '#4285F4' },
  googleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: PB.fg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: PB.border },
  dividerText: { fontSize: 11, fontFamily: FONTS.medium, color: PB.muted },
  fields: { gap: 14, marginBottom: 20 },
  label: { fontSize: 12, fontFamily: FONTS.bold, color: PB.fg, marginLeft: 4, marginBottom: 6 },
  input: {
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: PB.border,
    backgroundColor: '#fff', paddingHorizontal: 16,
    fontSize: 15, fontFamily: FONTS.regular, color: PB.fg,
  },
  inputFocused: {
    borderColor: PB.secondary,
    shadowColor: PB.secondary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  forgotLink: { fontSize: 12, fontFamily: FONTS.bold, color: PB.secondary, marginTop: 6 },
  signInBtn: {
    height: 52, borderRadius: 14, backgroundColor: PB.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  signInBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
  signUpRow: { alignItems: 'center' },
  signUpText: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
  signUpLink: { fontFamily: FONTS.bold, color: PB.secondary, textDecorationLine: 'underline' },
});
