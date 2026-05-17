import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { PB, FONTS } from '../../src/constants/theme';

const MERCHANT_DASHBOARD_URL = 'https://perkback.com.au/dashboard';

export default function ChooseAccountScreen() {
  const router = useRouter();
  const { customer, merchant } = useAuth();

  const goCustomer = () => {
    router.replace('/(tabs)/my-card');
  };

  const goMerchant = async () => {
    const supported = await Linking.canOpenURL(MERCHANT_DASHBOARD_URL);
    if (supported) {
      await Linking.openURL(MERCHANT_DASHBOARD_URL);
    } else {
      Alert.alert('Could not open', 'Visit perkback.com.au to access your merchant dashboard.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.logoName}>PerkBack</Text>
        <Text style={styles.greeting}>
          Welcome back{customer?.full_name ? `, ${customer.full_name.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.sub}>You have multiple accounts. Where would you like to go?</Text>
      </View>

      <View style={styles.cards}>
        {/* Customer card */}
        <TouchableOpacity style={styles.accountCard} onPress={goCustomer} activeOpacity={0.88}>
          <LinearGradient
            colors={[PB.primary, '#1a4699']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGrad}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💳</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Customer Account</Text>
              <Text style={styles.cardSub}>
                {customer
                  ? `${(customer.points_balance ?? 0).toLocaleString()} pts · ${customer.crn}`
                  : 'View your loyalty card & rewards'}
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Merchant card */}
        <TouchableOpacity style={styles.accountCard} onPress={goMerchant} activeOpacity={0.88}>
          <View style={styles.merchantCard}>
            <View style={[styles.cardIcon, styles.merchantIcon]}>
              <Text style={styles.cardIconText}>🏪</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: PB.fg }]}>Merchant Dashboard</Text>
              <Text style={[styles.cardSub, { color: PB.muted }]}>
                {merchant?.name ?? 'Manage your store'} · Opens web app
              </Text>
            </View>
            <Text style={[styles.cardArrow, { color: PB.muted }]}>↗</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>You can switch accounts any time from the Profile tab.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  logoName: { fontSize: 16, fontFamily: FONTS.bold, color: PB.secondary, marginBottom: 16 },
  greeting: { fontSize: 28, fontFamily: FONTS.extraBold, color: PB.fg, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: FONTS.regular, color: PB.muted, lineHeight: 21 },
  cards: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 14 },
  accountCard: { borderRadius: 20, overflow: 'hidden', shadowColor: PB.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  merchantCard: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: PB.border, borderRadius: 20 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  merchantIcon: { backgroundColor: PB.borderSoft },
  cardIconText: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#fff', marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },
  cardArrow: { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.bold },
  hint: { textAlign: 'center', fontSize: 12, fontFamily: FONTS.regular, color: PB.muted, paddingHorizontal: 40, paddingBottom: 32 },
});
