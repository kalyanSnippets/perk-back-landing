import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { PB, FONTS } from '../../src/constants/theme';

export default function DailySpinScreen() {
  const router = useRouter();
  const colors = ['#2af0a5', '#ff6f61', '#7c6cff', '#3f7ad4', '#ffd07a', '#e07ab1'];
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#06143a', '#071f50', '#0a2a6b']} style={styles.fill}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}><Text style={styles.closeText}>×</Text></TouchableOpacity>
        <Text style={styles.pill}>Day 4 streak · ready</Text>
        <Text style={styles.title}>Daily spin</Text>
        <Text style={styles.sub}>Free perk every 24 hours.</Text>
        <View style={styles.pointer} />
        <View style={styles.wheel}>
          <Svg width={230} height={230} viewBox="0 0 230 230">
            <G origin="115,115">
              {colors.map((color, index) => {
                const start = (index / colors.length) * Math.PI * 2;
                const end = ((index + 1) / colors.length) * Math.PI * 2;
                const x1 = 115 + Math.cos(start) * 105;
                const y1 = 115 + Math.sin(start) * 105;
                const x2 = 115 + Math.cos(end) * 105;
                const y2 = 115 + Math.sin(end) * 105;
                return <Path key={color} d={`M115 115 L${x1} ${y1} A105 105 0 0 1 ${x2} ${y2} Z`} fill={color} opacity={0.92} />;
              })}
              {['Free', '+20', '+50', '+100', '10%', 'Perk'].map((label, index) => (
                <SvgText key={label} x={115} y={42} fill="#071f50" fontSize="13" fontWeight="700" textAnchor="middle" transform={`rotate(${index * 60 + 28} 115 115)`}>{label}</SvgText>
              ))}
              <Circle cx={115} cy={115} r={28} fill="#fff" />
            </G>
          </Svg>
        </View>
        <TouchableOpacity style={styles.spinBtn}><Text style={styles.spinBtnText}>SPIN NOW</Text></TouchableOpacity>
        <View style={styles.days}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => <Text key={day} style={[styles.day, day <= 4 && styles.dayActive]}>{day}</Text>)}
        </View>
        <Text style={styles.footer}>3 more days for this week’s bonus</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06143a' },
  fill: { flex: 1, padding: 24, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-start', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 22, lineHeight: 24 },
  pill: { color: PB.primary, backgroundColor: PB.accent, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontFamily: FONTS.bold, fontSize: 11, marginTop: 24 },
  title: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 30, marginTop: 22 },
  sub: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.regular, fontSize: 13, marginTop: 4, marginBottom: 26 },
  pointer: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: PB.accent, marginBottom: -4, zIndex: 2 },
  wheel: { width: 238, height: 238, borderRadius: 119, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)' },
  spinBtn: { height: 54, borderRadius: 27, paddingHorizontal: 34, backgroundColor: PB.accent, justifyContent: 'center', marginTop: 36 },
  spinBtnText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 15 },
  days: { flexDirection: 'row', gap: 8, marginTop: 22 },
  day: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', textAlign: 'center', lineHeight: 24, fontFamily: FONTS.bold, fontSize: 11 },
  dayActive: { backgroundColor: PB.accent, color: PB.primary },
  footer: { color: 'rgba(255,255,255,.62)', fontFamily: FONTS.regular, fontSize: 11, marginTop: 7 },
});
