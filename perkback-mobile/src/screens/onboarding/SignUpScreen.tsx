import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

interface SignUpScreenProps {
  onBack: () => void;
  onContinue: (data: { name: string; phone: string; dob: string }) => void;
  onApple: () => void;
  onGoogle: () => void;
}

export function SignUpScreen({ onBack, onContinue, onApple, onGoogle }: SignUpScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.logoName}>PerkBack</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.stepSub}>
            Step <Text style={styles.bold}>1</Text> of 3 · takes about 30 seconds.
          </Text>

          {/* OAuth options */}
          <View style={styles.oauthRow}>
            <TouchableOpacity style={[styles.oauthBtn, styles.oauthDark]} onPress={onApple} activeOpacity={0.85}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.oauthTextLight}>Continue with Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.oauthBtn, styles.oauthLight]} onPress={onGoogle} activeOpacity={0.85}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.oauthTextDark}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={inputStyle('name')}
                placeholder="Alex Park"
                placeholderTextColor={PB.muted}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mobile</Text>
              <View style={styles.phoneRow}>
                <TextInput
                  style={[inputStyle('prefix'), styles.phonePrefix]}
                  defaultValue="+61"
                  onFocus={() => setFocusedField('prefix')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="phone-pad"
                  placeholderTextColor={PB.muted}
                />
                <TextInput
                  style={[inputStyle('phone'), styles.phoneNumber]}
                  placeholder="412 884 207"
                  placeholderTextColor={PB.muted}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Birthday{' '}
                <Text style={styles.birthdayHint}>· unlocks free birthday rewards 🎁</Text>
              </Text>
              <TextInput
                style={inputStyle('dob')}
                placeholder="14 / 07 / 1994"
                placeholderTextColor={PB.muted}
                value={dob}
                onChangeText={setDob}
                onFocus={() => setFocusedField('dob')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to PerkBack's{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' and '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>

          <Button
            kind="primary"
            onPress={() => onContinue({ name, phone, dob })}
            style={styles.cta}
          >
            Send verification code →
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: PB.fg,
  },
  logoName: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  stepSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: PB.muted,
    marginBottom: 20,
  },
  bold: {
    fontFamily: FONTS.bold,
    color: PB.fg,
  },
  oauthRow: {
    gap: 10,
    marginBottom: 16,
  },
  oauthBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  oauthDark: { backgroundColor: '#0b0d12' },
  oauthLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
  },
  oauthTextLight: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
  oauthTextDark: { fontFamily: FONTS.bold, fontSize: 14, color: PB.fg },
  appleIcon: { fontSize: 17, color: '#fff' },
  googleG: { fontSize: 15, fontFamily: FONTS.bold, color: '#4285F4' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: PB.border },
  dividerText: { fontSize: 11, fontFamily: FONTS.semiBold, color: PB.muted },
  fields: { gap: 14 },
  field: {},
  label: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: PB.fg,
    marginLeft: 4,
    marginBottom: 6,
  },
  birthdayHint: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: PB.accentStrong,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PB.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: PB.fg,
  },
  inputFocused: {
    borderColor: PB.secondary,
    shadowColor: PB.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phonePrefix: {
    width: 72,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  phoneNumber: {
    flex: 1,
  },
  legal: {
    fontSize: 11,
    color: PB.muted,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  legalLink: {
    color: PB.secondary,
    textDecorationLine: 'underline',
  },
  cta: { width: '100%' },
});
