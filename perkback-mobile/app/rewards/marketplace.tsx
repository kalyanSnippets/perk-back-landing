import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useRewardsData } from '../../src/hooks/useRewardsData';
import { PB, FONTS } from '../../src/constants/theme';

export default function RewardsMarketplaceScreen() {
  const router = useRouter();
  const { customer } = useAuth();
  const { rewards, fallbackRewards } = useRewardsData(customer?.id);
  const list = rewards.data?.length ? rewards.data : fallbackRewards;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.sub}>Trade your points for something good</Text>
        <TouchableOpacity activeOpacity={0.86} onPress={() => router.push('/rewards/spin')}>
          <LinearGradient colors={['#071f50', '#0a2a6b', '#3f7ad4']} style={styles.spinBanner}>
            <View style={styles.spinWheel}><Text style={styles.spinText}>SPIN</Text></View>
            <View>
              <Text style={styles.spinLabel}>DAILY STREAK · DAY 4</Text>
              <Text style={styles.spinTitle}>Spin to win a perk</Text>
              <Text style={styles.spinSub}>1 free spin every 24 hours.</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {['Free coffees', 'Cashback', 'Birthday', 'Tier rewards'].map((section, sectionIndex) => (
          <View key={section} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{section}</Text>
              <Text style={styles.seeAll}>See all</Text>
            </View>
            <View style={styles.grid}>
              {list.slice(0, 2).map((reward, index) => (
                <TouchableOpacity key={`${section}-${reward.id}-${index}`} style={styles.marketCard} onPress={() => router.push(`/rewards/${reward.id}`)}>
                  <LinearGradient colors={sectionIndex % 2 === 0 ? ['#3b2418', '#8a561f'] : ['#0f5f3d', '#3fa172']} style={styles.marketArt}>
                    <Text style={styles.marketPill}>{index === 0 ? 'Ready' : 'Soon'}</Text>
                  </LinearGradient>
                  <Text style={styles.marketTitle}>{reward.title}</Text>
                  <Text style={styles.marketPts}>{reward.points_required} pts</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { padding: 20, paddingBottom: 110 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  backText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 28, lineHeight: 30 },
  title: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 31, letterSpacing: -0.9 },
  sub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, marginTop: 2, marginBottom: 18 },
  spinBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 16, marginBottom: 22 },
  spinWheel: { width: 68, height: 68, borderRadius: 34, backgroundColor: PB.accent, alignItems: 'center', justifyContent: 'center' },
  spinText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 12 },
  spinLabel: { color: 'rgba(255,255,255,.6)', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.4 },
  spinTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 18, marginTop: 3 },
  spinSub: { color: 'rgba(255,255,255,.7)', fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  section: { marginBottom: 18 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17 },
  seeAll: { color: PB.success, fontFamily: FONTS.bold, fontSize: 11 },
  grid: { flexDirection: 'row', gap: 12 },
  marketCard: { flex: 1 },
  marketArt: { height: 88, borderRadius: 18, padding: 10, marginBottom: 8 },
  marketPill: { alignSelf: 'flex-start', color: PB.primary, backgroundColor: '#fff9e9', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontFamily: FONTS.bold, fontSize: 10 },
  marketTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 13 },
  marketPts: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
});
