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

function RoleTabs({ onMerchant }: { onMerchant: () => void }) {
  return (
    <View style={styles.tabs}>
      <View style={[styles.tab, styles.tabActive]}>
        <Text style={styles.tabIcon}>♙</Text>
        <Text style={styles.tabActiveText}>Customer</Text>
      </View>
      <TouchableOpacity style={styles.tab} onPress={onMerchant} activeOpacity={0.8}>
        <Text style={styles.tabIconMuted}>▦</Text>
        <Text style={styles.tabText}>Merchant</Text>
      </TouchableOpacity>
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation';
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
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          keyboardType={keyboardType}
        />
        {secure ? <Text style={styles.eyeIcon}>◎</Text> : null}
      </View>
    </View>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!termsAccepted) {
      Alert.alert('Terms required', 'Please agree to the terms and privacy policy.');
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
          phone: phone ? phone.trim() : null,
          date_of_birth: dobIso,
          role: 'customer',
        },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign-up failed', error.message);
      return;
    }
    if (!data.session) {
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BrandLogo />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up as a customer</Text>
          <RoleTabs onMerchant={() => router.push('/(auth)/merchant-sign-up')} />

          <View style={styles.card}>
            <Field label="Full Name" icon="♙" value={fullName} onChangeText={setFullName} placeholder="John Doe" />
            <Field label="Email" icon="✉" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
            <Field label="Password" icon="▢" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
            <Field label="Phone" icon="☏" value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
            <Field label="Date of Birth *" icon="▣" value={dob} onChangeText={setDob} placeholder="DD / MM / YYYY" keyboardType="numbers-and-punctuation" />

            <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted((value) => !value)} activeOpacity={0.8}>
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.9}>
              <LinearGradient colors={['#8aa0c3', '#90c5fb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{loading ? 'Creating Account...' : 'Create Customer Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secureRow}>
              <Text style={styles.secureIcon}>♢</Text>
              <Text style={styles.secureText}>Your data is securely encrypted</Text>
            </View>

            <View style={styles.bottomRule} />
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} style={styles.signInRow}>
              <Text style={styles.signInText}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  scroll: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 34 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  giftBox: { width: 42, height: 38, borderRadius: 9, backgroundColor: '#0d5c9d', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  giftSpark: { position: 'absolute', top: -8, left: -8, color: '#f5b21b', fontSize: 13 },
  giftIcon: { color: '#fff', fontSize: 26, fontFamily: FONTS.bold },
  brandPerk: { fontSize: 27, color: PB.primary, fontFamily: FONTS.extraBold },
  brandBack: { fontSize: 27, color: '#edae18', fontFamily: FONTS.extraBold },
  title: { color: '#071735', textAlign: 'center', fontSize: 30, fontFamily: FONTS.extraBold, marginBottom: 10 },
  subtitle: { color: '#6b768c', textAlign: 'center', fontSize: 17, fontFamily: FONTS.regular, marginBottom: 30 },
  tabs: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  tab: { flex: 1, height: 58, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dfe4ed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  tabActive: { backgroundColor: '#eef3fb', borderColor: PB.primary, borderWidth: 2.5 },
  tabIcon: { color: PB.primary, fontSize: 21, fontFamily: FONTS.bold },
  tabIconMuted: { color: '#738097', fontSize: 21, fontFamily: FONTS.bold },
  tabActiveText: { color: PB.primary, fontSize: 17, fontFamily: FONTS.bold },
  tabText: { color: '#738097', fontSize: 17, fontFamily: FONTS.bold },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 24, shadowColor: '#20314d', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  fieldBlock: { marginBottom: 18 },
  label: { color: '#071735', fontSize: 16, fontFamily: FONTS.medium, marginBottom: 10 },
  inputWrap: { height: 58, borderRadius: 16, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f5f7fb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  fieldIcon: { width: 32, color: '#718098', fontSize: 21, fontFamily: FONTS.bold },
  input: { flex: 1, color: PB.fg, fontSize: 19, fontFamily: FONTS.regular },
  eyeIcon: { color: '#718098', fontSize: 22 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.7, borderColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: PB.primary },
  checkboxTick: { color: '#fff', fontSize: 13, fontFamily: FONTS.bold },
  termsText: { flex: 1, color: '#6b768c', fontSize: 14, lineHeight: 20, fontFamily: FONTS.regular },
  termsLink: { color: PB.primary, fontFamily: FONTS.medium },
  primaryBtn: { height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#6aa8e8', shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  primaryText: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 26 },
  secureIcon: { color: '#718098', fontSize: 17 },
  secureText: { color: '#7a8495', fontSize: 15, fontFamily: FONTS.regular },
  bottomRule: { height: 1, backgroundColor: '#edf0f5', marginBottom: 20 },
  signInRow: { alignItems: 'center' },
  signInText: { color: PB.primary, fontSize: 15, fontFamily: FONTS.bold },
  signInLink: { color: PB.primary, fontFamily: FONTS.extraBold },
});
