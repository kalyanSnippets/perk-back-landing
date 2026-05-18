import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { BrandLogo } from '../../src/components/BrandLogo';
import { PB, FONTS } from '../../src/constants/theme';

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure,
  visible,
  onToggleVisible,
  keyboardType,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secure?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
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
          secureTextEntry={secure && !visible}
          autoCapitalize="none"
          keyboardType={keyboardType}
        />
        {secure ? (
          <TouchableOpacity onPress={onToggleVisible} hitSlop={10}>
            <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
        <View style={styles.header}>
          <BrandLogo width={176} height={58} />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

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
            visible={passwordVisible}
            onToggleVisible={() => setPasswordVisible((value) => !value)}
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
              <Text style={styles.signupLink}>♙ Sign up as Customer</Text>
            </TouchableOpacity>
            <View style={styles.verticalRule} />
            <TouchableOpacity onPress={() => router.push('/(auth)/merchant-sign-up')}>
              <Text style={styles.signupLink}>▦ Sign up as Merchant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { textAlign: 'center', color: '#071735', fontSize: 28, fontFamily: FONTS.extraBold, marginTop: 4, marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#6b768c', fontSize: 15, fontFamily: FONTS.regular },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 18, shadowColor: '#20314d', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  fieldBlock: { marginBottom: 11 },
  label: { color: '#071735', fontSize: 14, fontFamily: FONTS.medium, marginBottom: 6 },
  inputWrap: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f5f7fb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  fieldIcon: { width: 26, color: '#718098', fontSize: 18, fontFamily: FONTS.bold },
  input: { flex: 1, color: PB.fg, fontSize: 16, fontFamily: FONTS.regular, paddingVertical: 0 },
  toggleText: { color: PB.primary, fontSize: 12, fontFamily: FONTS.bold },
  primaryBtn: { height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2, shadowColor: PB.primary, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  primaryText: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: '#e5e8ef' },
  orText: { color: '#7a8495', fontSize: 14, fontFamily: FONTS.regular },
  oauthBtn: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f8f9fc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  google: { color: '#4285f4', fontSize: 19, fontFamily: FONTS.extraBold },
  apple: { color: '#071735', fontSize: 16 },
  oauthText: { color: '#071735', fontSize: 16, fontFamily: FONTS.bold },
  forgotRow: { alignItems: 'center', marginTop: 0, marginBottom: 12 },
  mutedLink: { color: '#7a8495', fontSize: 14, fontFamily: FONTS.regular },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12 },
  secureIcon: { color: '#718098', fontSize: 15 },
  secureText: { color: '#7a8495', fontSize: 13, fontFamily: FONTS.regular },
  bottomRule: { height: 1, backgroundColor: '#edf0f5', marginBottom: 10 },
  accountPrompt: { color: '#7a8495', textAlign: 'center', fontSize: 14, fontFamily: FONTS.regular, marginBottom: 8 },
  signupLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  signupLink: { color: PB.primary, fontSize: 12, fontFamily: FONTS.bold },
  verticalRule: { width: 1, height: 20, backgroundColor: '#e5e8ef' },
});
