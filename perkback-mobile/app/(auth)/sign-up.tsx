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
          secureTextEntry={secure && !visible}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
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

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
        <View style={styles.header}>
          <BrandLogo width={164} height={54} />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up as a customer</Text>
        </View>
        <RoleTabs onMerchant={() => router.push('/(auth)/merchant-sign-up')} />

        <View style={styles.card}>
          <Field label="Full Name" icon="♙" value={fullName} onChangeText={setFullName} placeholder="John Doe" />
          <Field label="Email" icon="✉" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
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
              <Text style={styles.primaryText}>{loading ? 'Creating...' : 'Create Customer Account'}</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  header: { alignItems: 'center', marginBottom: 8 },
  title: { color: '#071735', textAlign: 'center', fontSize: 25, fontFamily: FONTS.extraBold, marginTop: 2, marginBottom: 2 },
  subtitle: { color: '#6b768c', textAlign: 'center', fontSize: 14, fontFamily: FONTS.regular },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tab: { flex: 1, height: 42, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dfe4ed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  tabActive: { backgroundColor: '#eef3fb', borderColor: PB.primary, borderWidth: 2 },
  tabIcon: { color: PB.primary, fontSize: 16, fontFamily: FONTS.bold },
  tabIconMuted: { color: '#738097', fontSize: 16, fontFamily: FONTS.bold },
  tabActiveText: { color: PB.primary, fontSize: 14, fontFamily: FONTS.bold },
  tabText: { color: '#738097', fontSize: 14, fontFamily: FONTS.bold },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 14, shadowColor: '#20314d', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  fieldBlock: { marginBottom: 7 },
  label: { color: '#071735', fontSize: 12, fontFamily: FONTS.medium, marginBottom: 3 },
  inputWrap: { height: 39, borderRadius: 12, borderWidth: 1, borderColor: '#dfe4ed', backgroundColor: '#f5f7fb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 },
  fieldIcon: { width: 23, color: '#718098', fontSize: 15, fontFamily: FONTS.bold },
  input: { flex: 1, color: PB.fg, fontSize: 14, fontFamily: FONTS.regular, paddingVertical: 0 },
  toggleText: { color: PB.primary, fontSize: 11, fontFamily: FONTS.bold },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1, marginBottom: 9 },
  checkbox: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: PB.primary },
  checkboxTick: { color: '#fff', fontSize: 11, fontFamily: FONTS.bold },
  termsText: { flex: 1, color: '#6b768c', fontSize: 11, lineHeight: 15, fontFamily: FONTS.regular },
  termsLink: { color: PB.primary, fontFamily: FONTS.medium },
  primaryBtn: { height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowColor: '#6aa8e8', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  primaryText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 11, marginBottom: 10 },
  secureIcon: { color: '#718098', fontSize: 13 },
  secureText: { color: '#7a8495', fontSize: 12, fontFamily: FONTS.regular },
  bottomRule: { height: 1, backgroundColor: '#edf0f5', marginBottom: 9 },
  signInRow: { alignItems: 'center' },
  signInText: { color: PB.primary, fontSize: 13, fontFamily: FONTS.bold },
  signInLink: { color: PB.primary, fontFamily: FONTS.extraBold },
});
