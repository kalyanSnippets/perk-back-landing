import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { PB, FONTS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { customer, signOut } = useAuth();
  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      {customer && (
        <View style={styles.card}>
          <Text style={styles.name}>{customer.full_name}</Text>
          <Text style={styles.crn}>CRN: {customer.crn}</Text>
        </View>
      )}
      <Text style={styles.coming}>Full profile editing — Phase 5</Text>
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg, paddingHorizontal: 20 },
  heading: { fontSize: 24, fontFamily: FONTS.extraBold, color: PB.fg, marginTop: 16, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: PB.border },
  name: { fontSize: 18, fontFamily: FONTS.bold, color: PB.fg, marginBottom: 4 },
  crn: { fontSize: 13, fontFamily: FONTS.mono, color: PB.muted },
  coming: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, marginBottom: 32 },
  signOutBtn: { height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: PB.danger, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontFamily: FONTS.bold, fontSize: 15, color: PB.danger },
});
