import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Accepts "DD / MM / YYYY" or "DDMMYYYY" → ISO "YYYY-MM-DD"
  const parseDob = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    const dobIso = dob ? parseDob(dob) : null;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone ? `+61${phone.replace(/\s/g, '')}` : null,
          date_of_birth: dobIso,
        },
      },
    });
    setLoading(false);
    if (error) { Alert.alert('Sign-up failed', error.message); return; }
    if (data.session) {
      // Email confirmations disabled on backend — session is live immediately
      // AuthContext handles redirect
    } else {
      // Confirmation email / OTP sent
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    }
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.logoName}>PerkBack</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.stepSub}>Takes about 30 seconds.</Text>

          {/* OAuth shortcuts */}
          <TouchableOpacity style={styles.appleBtn} onPress={() => handleOAuth('apple')} activeOpacity={0.85}>
            <Text style={styles.appleBtnText}> Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.googleBtn} onPress={() => handleOAuth('google')} activeOpacity={0.85}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={inputStyle('name')} value={fullName} onChangeText={setFullName}
                onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                placeholder="Alex Park" placeholderTextColor={PB.muted}
                autoCapitalize="words" autoComplete="name"
              />
            </View>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={inputStyle('email')} value={email} onChangeText={setEmail}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                placeholder="you@email.com" placeholderTextColor={PB.muted}
                autoCapitalize="none" keyboardType="email-address" autoComplete="email"
              />
            </View>
            <View>
              <Text style={styles.label}>
                Mobile <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.phoneRow}>
                <TextInput
                  style={[inputStyle('prefix'), styles.phonePrefix]}
                  defaultValue="+61"
                  onFocus={() => setFocused('prefix')} onBlur={() => setFocused(null)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[inputStyle('phone'), { flex: 1 }]}
                  value={phone} onChangeText={setPhone}
                  onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                  placeholder="412 884 207" placeholderTextColor={PB.muted}
                  keyboardType="phone-pad" autoComplete="tel"
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>
                Birthday{' '}
                <Text style={styles.birthdayHint}>· unlocks birthday rewards 🎁</Text>
              </Text>
              <TextInput
                style={inputStyle('dob')} value={dob} onChangeText={setDob}
                onFocus={() => setFocused('dob')} onBlur={() => setFocused(null)}
                placeholder="DD / MM / YYYY" placeholderTextColor={PB.muted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={inputStyle('password')} value={password} onChangeText={setPassword}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                placeholder="Min. 8 characters" placeholderTextColor={PB.muted}
                secureTextEntry autoComplete="new-password"
              />
            </View>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to PerkBack's{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' and '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSignUp} disabled={loading} activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Creating account…' : 'Send verification code →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInRow}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.signInText}>
              Have an account? <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: PB.fg },
  logoName: { fontSize: 18, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 6, marginTop: 8 },
  stepSub: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, marginBottom: 20 },
  appleBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#0b0d12',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10,
  },
  appleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
  googleBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: PB.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  googleG: { fontSize: 16, fontFamily: FONTS.bold, color: '#4285F4' },
  googleBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: PB.fg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: PB.border },
  dividerLabel: { fontSize: 11, fontFamily: FONTS.medium, color: PB.muted },
  fields: { gap: 14, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: FONTS.bold, color: PB.fg, marginLeft: 4, marginBottom: 6 },
  optional: { fontFamily: FONTS.regular, color: PB.muted },
  birthdayHint: { fontFamily: FONTS.regular, color: PB.accentStrong, fontSize: 11 },
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
  phoneRow: { flexDirection: 'row', gap: 8 },
  phonePrefix: { width: 72, textAlign: 'center', fontFamily: FONTS.bold },
  legal: {
    fontSize: 11, color: PB.muted, fontFamily: FONTS.regular,
    lineHeight: 16, marginBottom: 20,
  },
  legalLink: { color: PB.secondary, textDecorationLine: 'underline' },
  submitBtn: {
    height: 52, borderRadius: 14, backgroundColor: PB.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  submitBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
  signInRow: { alignItems: 'center' },
  signInText: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
  signInLink: { fontFamily: FONTS.bold, color: PB.secondary, textDecorationLine: 'underline' },
});
