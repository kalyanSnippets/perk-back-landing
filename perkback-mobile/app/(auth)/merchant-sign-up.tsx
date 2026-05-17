import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { PB, FONTS } from '../../src/constants/theme';

const MERCHANT_DASHBOARD_URL = 'https://perkback.com.au/dashboard';

export default function MerchantSignUpScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [abn, setAbn] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Business name, owner name, email and password are required.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: ownerName.trim(),
          business_name: businessName.trim(),
          phone: phone ? `+61${phone.replace(/\s/g, '')}` : null,
          abn: abn.trim() || null,
          role: 'merchant',
        },
      },
    });
    setLoading(false);
    if (error) { Alert.alert('Sign-up failed', error.message); return; }
    if (data.session) {
      Alert.alert(
        'Merchant account created',
        'Your account is ready. Visit perkback.com.au to set up your store dashboard.',
        [
          { text: 'Open Dashboard', onPress: () => Linking.openURL(MERCHANT_DASHBOARD_URL) },
          { text: 'Later', style: 'cancel' },
        ],
      );
    } else {
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    }
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
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.logoName}>PerkBack</Text>
          </View>

          <Text style={styles.title}>Merchant account</Text>
          <Text style={styles.sub}>Set up loyalty for your business.</Text>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🏪</Text>
            <Text style={styles.infoBannerText}>
              Your merchant dashboard lives at{' '}
              <Text style={styles.infoBannerLink} onPress={() => Linking.openURL(MERCHANT_DASHBOARD_URL)}>
                perkback.com.au
              </Text>
              . We'll set up your account and send you an email to get started.
            </Text>
          </View>

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>Business name</Text>
              <TextInput
                style={inputStyle('business')} value={businessName} onChangeText={setBusinessName}
                onFocus={() => setFocused('business')} onBlur={() => setFocused(null)}
                placeholder="Luna Café" placeholderTextColor={PB.muted}
                autoCapitalize="words"
              />
            </View>
            <View>
              <Text style={styles.label}>Owner / contact name</Text>
              <TextInput
                style={inputStyle('owner')} value={ownerName} onChangeText={setOwnerName}
                onFocus={() => setFocused('owner')} onBlur={() => setFocused(null)}
                placeholder="Alex Park" placeholderTextColor={PB.muted}
                autoCapitalize="words" autoComplete="name"
              />
            </View>
            <View>
              <Text style={styles.label}>Business email</Text>
              <TextInput
                style={inputStyle('email')} value={email} onChangeText={setEmail}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                placeholder="hello@lunacafe.com.au" placeholderTextColor={PB.muted}
                autoCapitalize="none" keyboardType="email-address" autoComplete="email"
              />
            </View>
            <View>
              <Text style={styles.label}>
                Phone <Text style={styles.optional}>(optional)</Text>
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
                ABN <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={inputStyle('abn')} value={abn} onChangeText={setAbn}
                onFocus={() => setFocused('abn')} onBlur={() => setFocused(null)}
                placeholder="12 345 678 901" placeholderTextColor={PB.muted}
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
              {loading ? 'Creating account…' : 'Create merchant account →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.customerRow}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.customerText}>
              Not a merchant?{' '}
              <Text style={styles.customerLink}>Sign up as customer</Text>
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
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: PB.fg },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
  logoBox: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: PB.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: PB.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 24, fontFamily: FONTS.extraBold, color: '#ffd07a' },
  logoName: { fontSize: 18, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.3 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, marginBottom: 16 },
  infoBanner: {
    flexDirection: 'row', gap: 10, backgroundColor: PB.borderSoft,
    borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: PB.border,
  },
  infoBannerIcon: { fontSize: 18, lineHeight: 22 },
  infoBannerText: {
    flex: 1, fontSize: 12, fontFamily: FONTS.regular,
    color: PB.muted, lineHeight: 18,
  },
  infoBannerLink: { color: PB.secondary, textDecorationLine: 'underline', fontFamily: FONTS.bold },
  fields: { gap: 14, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: FONTS.bold, color: PB.fg, marginLeft: 4, marginBottom: 6 },
  optional: { fontFamily: FONTS.regular, color: PB.muted },
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
  customerRow: { alignItems: 'center', marginBottom: 10 },
  customerText: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
  customerLink: { fontFamily: FONTS.bold, color: PB.primary, textDecorationLine: 'underline' },
  signInRow: { alignItems: 'center' },
  signInText: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
  signInLink: { fontFamily: FONTS.bold, color: PB.secondary, textDecorationLine: 'underline' },
});
