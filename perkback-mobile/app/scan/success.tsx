import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

export default function ScanSuccessScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#071f50', '#0a2a6b', '#123b91']} style={styles.fill}>
        <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
        <Text style={styles.title}>+20 points</Text>
        <Text style={styles.sub}>Your merchant points have been added.</Text>
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>BALANCE NOW</Text>
            <Text style={styles.balanceLabel}>MERCHANT</Text>
          </View>
          <Text style={styles.balance}>500<Text style={styles.balanceUnit}> pts</Text></Text>
          <View style={styles.track}><View style={styles.fillTrack} /></View>
          <Text style={styles.trackText}>Keep earning with this merchant to unlock rewards.</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/rewards')}><Text style={styles.doneText}>Done</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cardBtn} onPress={() => router.replace('/(tabs)/my-card')}><Text style={styles.cardText}>See card</Text></TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.primary },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  check: { width: 96, height: 96, borderRadius: 48, backgroundColor: PB.accent, alignItems: 'center', justifyContent: 'center', shadowColor: PB.accent, shadowOpacity: 0.6, shadowRadius: 24 },
  checkText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 48 },
  title: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 32, marginTop: 30 },
  sub: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.medium, fontSize: 12, marginTop: 6 },
  balanceCard: { width: '100%', backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 20, padding: 18, marginTop: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { color: 'rgba(255,255,255,.62)', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.2 },
  balance: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 30, textAlign: 'center', marginTop: 14 },
  balanceUnit: { fontSize: 12 },
  track: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.2)', overflow: 'hidden', marginTop: 12 },
  fillTrack: { width: '72%', height: 7, backgroundColor: PB.accent },
  trackText: { color: 'rgba(255,255,255,.6)', fontFamily: FONTS.regular, fontSize: 11, textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  doneBtn: { flex: 1, height: 52, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  cardBtn: { flex: 1, height: 52, borderRadius: 17, backgroundColor: PB.accent, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  cardText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 14 },
});
