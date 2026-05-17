import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../constants/theme';

interface OAuthScreenProps {
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
}

export function OAuthScreen({ onApple, onGoogle, onEmail }: OAuthScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.logoName}>PerkBack</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Choose how to continue.</Text>
      </View>

      <View style={styles.buttons}>
        {/* Apple */}
        <TouchableOpacity style={[styles.btn, styles.btnDark]} onPress={onApple} activeOpacity={0.85}>
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.btnTextLight}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Google */}
        <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={onGoogle} activeOpacity={0.85}>
          <View style={styles.googleIcon}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.btnTextDark}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={onEmail} activeOpacity={0.85}>
          <Text style={styles.emailIcon}>✉</Text>
          <Text style={styles.btnTextDark}>Continue with email</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.link}>Terms</Text>
          {' & '}
          <Text style={styles.link}>Privacy</Text>.
        </Text>
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
    paddingTop: 48,
    alignItems: 'center',
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: PB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: PB.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: '#ffd07a',
  },
  logoName: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: PB.muted,
    textAlign: 'center',
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 10,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnDark: {
    backgroundColor: '#0b0d12',
  },
  btnLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
  },
  btnTextLight: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#fff',
  },
  btnTextDark: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: PB.fg,
  },
  appleIcon: {
    fontSize: 18,
    color: '#fff',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PB.border,
  },
  googleG: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#4285F4',
  },
  emailIcon: {
    fontSize: 16,
    color: PB.muted,
  },
  legal: {
    textAlign: 'center',
    fontSize: 12,
    color: PB.muted,
    fontFamily: FONTS.regular,
    marginTop: 8,
  },
  link: {
    color: PB.secondary,
    textDecorationLine: 'underline',
  },
});
