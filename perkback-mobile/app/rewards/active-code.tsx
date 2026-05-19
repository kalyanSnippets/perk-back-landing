import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

export default function ActiveCodeScreen() {
  const router = useRouter();
  const { rewardTitle, merchantName } = useLocalSearchParams<{ rewardTitle?: string; merchantName?: string }>();
  const code = '4PXQ-21';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#06143a', '#071f50', '#0a2a6b']} style={styles.fill}>
        <View style={styles.top}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}><Text style={styles.closeText}>×</Text></TouchableOpacity>
          <Text style={styles.topLabel}>SHOW AT TILL</Text>
          <View style={{ width: 34 }} />
        </View>
        <Text style={styles.pill}>▣ Active reward</Text>
        <Text style={styles.title}>{rewardTitle || 'Free Flat White'}</Text>
        <Text style={styles.sub}>at {merchantName || 'Bondi Beans'} · expires today 5pm</Text>
        <Text style={styles.timer}>0:38</Text>
        <View style={styles.qrWrap}>
          <QRCode value={code} size={188} color={PB.primaryDark} backgroundColor="#ffffff" />
        </View>
        <Text style={styles.enter}>OR ENTER CODE</Text>
        <Text style={styles.code}>{code}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('Code copied', code)}>
          <Text style={styles.copyText}>Copy code</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06143a' },
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 10, alignItems: 'center' },
  top: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 22, lineHeight: 24 },
  topLabel: { color: 'rgba(255,255,255,.72)', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 2 },
  pill: { color: PB.primary, backgroundColor: PB.accent, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontFamily: FONTS.bold, fontSize: 11, marginBottom: 18 },
  title: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 26, textAlign: 'center', letterSpacing: -0.6 },
  sub: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 4, marginBottom: 24 },
  timer: { color: PB.primary, backgroundColor: PB.accent, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontFamily: FONTS.bold, fontSize: 11, marginBottom: -12, zIndex: 2 },
  qrWrap: { width: 224, height: 224, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: PB.accent, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  enter: { color: 'rgba(255,255,255,.55)', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 2, marginTop: 34 },
  code: { color: '#fff', fontFamily: FONTS.monoMedium, fontSize: 32, letterSpacing: 4, marginTop: 9 },
  copyBtn: { height: 46, borderRadius: 16, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  copyText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
});
