import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  StatusBar, Keyboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { BrandLogo } from '../../src/components/BrandLogo';
import { PB, FONTS } from '../../src/constants/theme';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleInput = (val: string, idx: number) => {
    const next = [...code];
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
      digits.forEach((d, i) => { if (idx + i < CODE_LENGTH) next[idx + i] = d; });
      setCode(next);
      const focus = next.findIndex(c => c === '');
      inputRefs.current[focus === -1 ? CODE_LENGTH - 1 : focus]?.focus();
      return;
    }
    next[idx] = val;
    setCode(next);
    if (val && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length !== CODE_LENGTH) return;
    Keyboard.dismiss();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email ?? '', token, type: 'signup' });
    setLoading(false);
    if (error) { Alert.alert('Invalid code', error.message); return; }
    // AuthContext onAuthStateChange fires → redirect handled automatically
  };

  const handleResend = async () => {
    setCountdown(60);
    const { error } = await supabase.auth.resend({ type: 'signup', email: email ?? '' });
    if (error) Alert.alert('Resend failed', error.message);
  };

  const isComplete = code.every(c => c !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <BrandLogo width={142} height={48} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.sub}>We sent a 6-digit code to{'\n'}<Text style={styles.emailText}>{email}</Text></Text>

        <View style={styles.boxes}>
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={r => { inputRefs.current[i] = r; }}
              style={[styles.box, code[i] ? styles.boxFilled : {}, i === code.findIndex(c => c === '') && styles.boxActive]}
              value={code[i]}
              onChangeText={v => handleInput(v, i)}
              onKeyPress={e => handleKey(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus caretHidden textAlign="center"
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Text style={styles.resend}>
          Didn't get it?{' '}
          {countdown > 0
            ? <Text style={styles.timer}>Resend in 0:{countdown.toString().padStart(2, '0')}</Text>
            : <Text style={styles.resendLink} onPress={handleResend}>Resend now</Text>}
        </Text>

        <TouchableOpacity
          style={[styles.verifyBtn, (!isComplete || loading) && { opacity: 0.5 }]}
          onPress={handleVerify} disabled={!isComplete || loading} activeOpacity={0.85}
        >
          <Text style={styles.verifyBtnText}>{loading ? 'Verifying…' : 'Verify →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: PB.fg },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: { fontSize: 26, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 10 },
  sub: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, lineHeight: 19, marginBottom: 28 },
  emailText: { fontFamily: FONTS.bold, color: PB.fg },
  boxes: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  box: { flex: 1, height: 62, borderRadius: 14, borderWidth: 2, borderColor: PB.border, backgroundColor: '#fff', fontSize: 24, fontFamily: FONTS.extraBold, color: PB.fg, textAlign: 'center' },
  boxFilled: { borderColor: PB.primary },
  boxActive: { borderColor: PB.secondary, shadowColor: PB.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  resend: { fontSize: 12, fontFamily: FONTS.regular, color: PB.muted, textAlign: 'center', marginBottom: 24 },
  timer: { fontFamily: FONTS.medium, color: PB.secondary },
  resendLink: { fontFamily: FONTS.bold, color: PB.secondary, textDecorationLine: 'underline' },
  verifyBtn: { height: 52, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  verifyBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#fff' },
});
