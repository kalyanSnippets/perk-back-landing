import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#050b17', '#071426', '#0a1f5c']} style={styles.fill}>
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.topIcon}>×</Text></TouchableOpacity>
          <Text style={styles.topTitle}>Scan merchant QR</Text>
          <TouchableOpacity><Text style={styles.flash}>⚡</Text></TouchableOpacity>
        </View>
        <View style={styles.scanner}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={styles.scanLine} />
        </View>
        <View style={styles.bottom}>
          <Text style={styles.bottomTitle}>Point at a merchant code</Text>
          <Text style={styles.bottomSub}>Or scan the QR poster at the till</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => Alert.alert('Photos', 'Photo scanning will be added with camera permissions.')}>
              <Text style={styles.ghostText}>From photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/join/bondi-beans')}>
              <Text style={styles.goldText}>Enter code</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.demoBtn} onPress={() => router.push('/scan/success')}>
            <Text style={styles.demoText}>Preview earn success</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b17' },
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topIcon: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 24 },
  topTitle: { color: '#fff', fontFamily: FONTS.bold, fontSize: 12 },
  flash: { color: PB.accent, fontSize: 18 },
  scanner: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 58, height: 58, borderColor: PB.accent, borderWidth: 3 },
  tl: { top: '29%', left: 42, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: '29%', right: 42, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: '32%', left: 42, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: '32%', right: 42, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanLine: { width: '64%', height: 2, backgroundColor: PB.accent, shadowColor: PB.accent, shadowOpacity: 1, shadowRadius: 16 },
  bottom: { alignItems: 'center', paddingBottom: 28 },
  bottomTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 15 },
  bottomSub: { color: 'rgba(255,255,255,.62)', fontFamily: FONTS.regular, fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  ghostBtn: { height: 44, paddingHorizontal: 20, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', justifyContent: 'center' },
  ghostText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 12 },
  goldBtn: { height: 44, paddingHorizontal: 20, borderRadius: 15, backgroundColor: PB.accent, justifyContent: 'center' },
  goldText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 12 },
  demoBtn: { marginTop: 12 },
  demoText: { color: 'rgba(255,255,255,.55)', fontFamily: FONTS.medium, fontSize: 11 },
});
