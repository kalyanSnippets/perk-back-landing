import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../src/constants/theme';
export default function RewardsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Rewards</Text>
      <Text style={styles.coming}>Rewards & redemptions — Phase 3</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg, paddingHorizontal: 20 },
  heading: { fontSize: 24, fontFamily: FONTS.extraBold, color: PB.fg, marginTop: 16, marginBottom: 8 },
  coming: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted },
});
