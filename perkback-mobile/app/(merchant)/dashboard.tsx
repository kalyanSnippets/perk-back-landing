import React from 'react';
import { Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const MERCHANT_DASHBOARD_URL = 'https://perkback.com.au/dashboard';

export default function MerchantDashboardScreen() {
  const { merchant, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Merchant Dashboard</Text>
        <Text style={styles.title}>{merchant?.name ?? 'Your Store'}</Text>
        <Text style={styles.subtitle}>Manage store setup, transactions, and settings from your PerkBack merchant dashboard.</Text>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>▦</Text>
          </View>
          <Text style={styles.cardTitle}>Merchant tools live on the web</Text>
          <Text style={styles.cardText}>Open the dashboard to finish setup and manage customer activity.</Text>
          <TouchableOpacity onPress={() => Linking.openURL(MERCHANT_DASHBOARD_URL)} activeOpacity={0.9}>
            <LinearGradient colors={['#062967', '#2f87e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>Open Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fc' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 56 },
  eyebrow: { color: PB.secondary, fontSize: 14, fontFamily: FONTS.bold, marginBottom: 14 },
  title: { color: '#071735', fontSize: 34, fontFamily: FONTS.extraBold, marginBottom: 12 },
  subtitle: { color: '#6b768c', fontSize: 17, lineHeight: 25, fontFamily: FONTS.regular, marginBottom: 34 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 26, borderWidth: 1, borderColor: '#dfe4ed', shadowColor: '#20314d', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#edf1f8', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  icon: { color: PB.primary, fontSize: 32, fontFamily: FONTS.bold },
  cardTitle: { color: '#071735', fontSize: 22, fontFamily: FONTS.bold, marginBottom: 10 },
  cardText: { color: '#6b768c', fontSize: 16, lineHeight: 23, fontFamily: FONTS.regular, marginBottom: 26 },
  primaryBtn: { height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
  signOut: { alignItems: 'center', paddingVertical: 24 },
  signOutText: { color: PB.primary, fontSize: 16, fontFamily: FONTS.bold },
});
