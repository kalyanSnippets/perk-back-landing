import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { LoyaltyCard } from '../../src/components/ui/LoyaltyCard';
import { PB, FONTS } from '../../src/constants/theme';

export default function MyCardScreen() {
  const { customer } = useAuth();
  const nameParts = customer?.full_name?.split(' ') ?? ['', ''];
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Card</Text>
      <View style={styles.cardWrap}>
        <LoyaltyCard
          firstName={nameParts[0]}
          lastName={nameParts.slice(1).join(' ')}
          crn={customer?.crn ?? '—'}
          cardNumber={customer?.loyalty_card_number ?? '—'}
          points={customer?.points_balance ?? 0}
        />
      </View>
      <Text style={styles.points}>{(customer?.points_balance ?? 0).toLocaleString()} pts</Text>
      <Text style={styles.coming}>More card details coming in Phase 2</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg, paddingHorizontal: 20 },
  heading: { fontSize: 24, fontFamily: FONTS.extraBold, color: PB.fg, marginTop: 16, marginBottom: 20 },
  cardWrap: { marginBottom: 24 },
  points: { fontSize: 32, fontFamily: FONTS.extraBold, color: PB.primary, textAlign: 'center' },
  coming: { fontSize: 13, fontFamily: FONTS.regular, color: PB.muted, textAlign: 'center', marginTop: 8 },
});
