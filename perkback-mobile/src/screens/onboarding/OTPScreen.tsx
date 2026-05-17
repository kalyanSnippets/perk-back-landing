import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

const CODE_LENGTH = 6;

interface OTPScreenProps {
  phone?: string;
  onBack: () => void;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}

export function OTPScreen({
  phone = '+61 412 884 207',
  onBack,
  onVerify,
  onResend,
  onChangeNumber,
}: OTPScreenProps) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(24);
  const inputRefs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInput = (val: string, idx: number) => {
    const newCode = [...code];
    if (val.length > 1) {
      // Handle paste
      const digits = val.replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
      digits.forEach((d, i) => { if (idx + i < CODE_LENGTH) newCode[idx + i] = d; });
      setCode(newCode);
      const nextEmpty = newCode.findIndex((c) => c === '');
      const focusIdx = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    newCode[idx] = val;
    setCode(newCode);
    if (val && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const fullCode = code.join('');
  const isComplete = fullCode.length === CODE_LENGTH && !code.includes('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logoName}>PerkBack</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.sub}>
          We sent a 6-digit code to{' '}
          <Text style={styles.phone}>{phone}</Text>.{' '}
          <Text style={styles.changeLink} onPress={onChangeNumber}>
            Change number
          </Text>
        </Text>

        {/* OTP boxes */}
        <View style={styles.boxes}>
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[
                styles.box,
                code[i] ? styles.boxFilled : {},
                i === code.findIndex((c) => c === '') && styles.boxActive,
              ]}
              value={code[i]}
              onChangeText={(val) => handleInput(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              caretHidden
              textAlign="center"
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Resend */}
        <Text style={styles.resend}>
          Didn't get it?{' '}
          {countdown > 0 ? (
            <Text style={styles.resendTimer}>
              Resend in 0:{countdown.toString().padStart(2, '0')}
            </Text>
          ) : (
            <Text style={styles.resendLink} onPress={onResend}>
              Resend now
            </Text>
          )}
        </Text>

        <Button
          kind="primary"
          onPress={() => { Keyboard.dismiss(); onVerify(fullCode); }}
          disabled={!isComplete}
          style={styles.cta}
        >
          Verify →
        </Button>
      </View>
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
  backArrow: { fontSize: 18, color: PB.fg },
  logoName: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  sub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: PB.muted,
    lineHeight: 19,
    marginBottom: 28,
  },
  phone: {
    fontFamily: FONTS.bold,
    color: PB.fg,
  },
  changeLink: {
    color: PB.secondary,
    fontFamily: FONTS.semiBold,
    textDecorationLine: 'underline',
  },
  boxes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  box: {
    flex: 1,
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: PB.border,
    backgroundColor: '#fff',
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    textAlign: 'center',
  },
  boxFilled: {
    borderColor: PB.primary,
  },
  boxActive: {
    borderColor: PB.secondary,
    shadowColor: PB.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  resend: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: PB.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendTimer: {
    fontFamily: FONTS.semiBold,
    color: PB.secondary,
  },
  resendLink: {
    fontFamily: FONTS.bold,
    color: PB.secondary,
    textDecorationLine: 'underline',
  },
  cta: { width: '100%' },
});
