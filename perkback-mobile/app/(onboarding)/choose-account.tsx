import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

function BrandHeader() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.giftBox}>
        <Text style={styles.giftSpark}>✦</Text>
        <Text style={styles.giftIcon}>✓</Text>
      </View>
      <Text style={styles.brandPerk}>Perk</Text>
      <Text style={styles.brandBack}>Back</Text>
    </View>
  );
}

function ChoiceCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.choiceCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.iconCircle}>
        <Text style={styles.choiceIcon}>{icon}</Text>
      </View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChooseAccountScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <BrandHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Choose your dashboard</Text>
        <Text style={styles.subtitle}>
          You have both a customer and merchant account.{'\n'}Where would you like to go?
        </Text>

        <View style={styles.cards}>
          <ChoiceCard
            icon="▭"
            title="Continue as Customer"
            subtitle="View your loyalty card, points & transactions"
            onPress={() => router.replace('/(tabs)/my-card')}
          />
          <ChoiceCard
            icon="▦"
            title="Continue as Merchant"
            subtitle="Manage your store, transactions & settings"
            onPress={() => router.replace('/(merchant)/dashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  brandRow: {
    height: 86,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf3',
    backgroundColor: '#f8faff',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftBox: { width: 48, height: 42, borderRadius: 9, backgroundColor: '#0d5c9d', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  giftSpark: { position: 'absolute', top: -8, left: -8, color: '#f5b21b', fontSize: 13 },
  giftIcon: { color: '#fff', fontSize: 29, fontFamily: FONTS.bold },
  brandPerk: { fontSize: 31, color: PB.primary, fontFamily: FONTS.extraBold },
  brandBack: { fontSize: 31, color: '#edae18', fontFamily: FONTS.extraBold },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 76 },
  title: { textAlign: 'center', color: '#071735', fontSize: 34, fontFamily: FONTS.extraBold, marginBottom: 28 },
  subtitle: { textAlign: 'center', color: '#6b768c', fontSize: 24, lineHeight: 35, fontFamily: FONTS.regular, marginBottom: 64 },
  cards: { gap: 26 },
  choiceCard: {
    minHeight: 146,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#dfe4ed',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 34,
    shadowColor: '#20314d',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#edf1f8', alignItems: 'center', justifyContent: 'center', marginRight: 26 },
  choiceIcon: { color: PB.primary, fontSize: 32, fontFamily: FONTS.bold },
  choiceText: { flex: 1 },
  choiceTitle: { color: '#071735', fontSize: 25, fontFamily: FONTS.extraBold, marginBottom: 10 },
  choiceSubtitle: { color: '#6b768c', fontSize: 19, lineHeight: 25, fontFamily: FONTS.regular },
});
