import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

function BrandLogo() {
  return (
    <View style={styles.brand}>
      <View style={styles.giftBox}>
        <Text style={styles.giftSpark}>✦</Text>
        <Text style={styles.giftIcon}>✓</Text>
      </View>
      <Text style={styles.brandPerk}>Perk</Text>
      <Text style={styles.brandBack}>Back</Text>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.fieldIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#738097"
          secureTextEntry={secure}
          autoCapitalize="none"
          keyboardType={keyboardType}
        />
        {secure ? <Text style={styles.eyeIcon}>◎</Text> : null}
      </View>
    </View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'perkback://auth/callback' },
    });
    if (error) Alert.alert(`${provider} sign-in failed`, error.message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BrandLogo />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.card}>
            <Field
              label="Email"
              icon="✉"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              icon="▢"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secure
            />

            <TouchableOpacity onPress={handleEmailSignIn} disabled={loading} activeOpacity={0.9}>
              <LinearGradient colors={['#062967', '#2f87e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.oauthBtn} onPress={() => handleOAuth('google')} activeOpacity={0.85}>
              <Text style={styles.google}>G</Text>
              <Text style={styles.oauthText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.oauthBtn} onPress={() => handleOAuth('apple')} activeOpacity={0.85}>
              <Text style={styles.apple}>●</Text>
              <Text style={styles.oauthText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
              <Text style={styles.mutedLink}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.secureRow}>
              <Text style={styles.secureIcon}>♢</Text>
              <Text style={styles.secureText}>Your data is securely encrypted</Text>
            </View>

            <View style={styles.bottomRule} />
            <Text style={styles.accountPrompt}>Don't have an account?</Text>
            <View style={styles.signupLinks}>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.signupLink}>♙  Sign up as Customer</Text>
              </TouchableOpacity>
              <View style={styles.verticalRule} />
              <TouchableOpacity onPress={() => router.push('/(auth)/merchant-sign-up')}>
                <Text style={styles.signupLink}>▦  Sign up as Merchant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  scroll: { paddingHorizontal: 18, paddingTop: 42, paddingBottom: 34 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  giftBox: { width: 44, height: 40, borderRadius: 9, backgroundColor: '#0d5c9d', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  giftSpark: { position: 'absolute', top: -8, left: -8, color: '#f5b21b', fontSize: 13 },
  giftIcon: { color: '#fff', fontSize: 28, fontFamily: FONTS.bold },
  brandPerk: { fontSize: 28, color: PB.primary, fontFamily: FONTS.extraBold },
  brandBack: { fontSize: 28, color: '#edae18', fontFamily: FONTS.extraBold },
  title: { textAlign: 'center', color: '#071735', fontSize: 32, fontFamily: FONTS.extraBold, marginBottom: 10 },
  subtitle: { textAlign: 'center', color: '#6b768c', fontSize: 18, fontFamily: FONTS.regular, marginBottom: 36 },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 26, shadowColor: '#20314d', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  fieldBlock: { marginBottom: 20 },
  label: { color: '#071735', fontSize: 18, fontFamily: FONTS.medium, marginBottom: 12 },
  inputWrap: { height: 60, borderRadius: 17, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f5f7fb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  fieldIcon: { width: 32, color: '#718098', fontSize: 22, fontFamily: FONTS.bold },
  input: { flex: 1, color: PB.fg, fontSize: 21, fontFamily: FONTS.regular },
  eyeIcon: { color: '#718098', fontSize: 24 },
  primaryBtn: { height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: PB.primary, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } },
  primaryText: { color: '#fff', fontSize: 21, fontFamily: FONTS.bold },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 28 },
  line: { flex: 1, height: 1, backgroundColor: '#e5e8ef' },
  orText: { color: '#7a8495', fontSize: 18, fontFamily: FONTS.regular },
  oauthBtn: { height: 62, borderRadius: 17, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f8f9fc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18 },
  google: { color: '#4285f4', fontSize: 24, fontFamily: FONTS.extraBold },
  apple: { color: '#071735', fontSize: 20 },
  oauthText: { color: '#071735', fontSize: 21, fontFamily: FONTS.bold },
  forgotRow: { alignItems: 'center', marginTop: 4, marginBottom: 28 },
  mutedLink: { color: '#7a8495', fontSize: 18, fontFamily: FONTS.regular },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 26 },
  secureIcon: { color: '#718098', fontSize: 18 },
  secureText: { color: '#7a8495', fontSize: 16, fontFamily: FONTS.regular },
  bottomRule: { height: 1, backgroundColor: '#edf0f5', marginBottom: 20 },
  accountPrompt: { color: '#7a8495', textAlign: 'center', fontSize: 18, fontFamily: FONTS.regular, marginBottom: 16 },
  signupLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  signupLink: { color: PB.primary, fontSize: 15, fontFamily: FONTS.bold },
  verticalRule: { width: 1, height: 24, backgroundColor: '#e5e8ef' },
});
