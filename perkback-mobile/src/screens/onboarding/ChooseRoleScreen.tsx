import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PB, FONTS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

type Role = 'customer' | 'merchant';

interface ChooseRoleScreenProps {
  onContinue: (role: Role) => void;
}

const ROLES = [
  {
    id: 'customer' as Role,
    emoji: '☕',
    title: "I'm a customer",
    sub: 'Earn points and rewards at local stores.',
  },
  {
    id: 'merchant' as Role,
    emoji: '🏪',
    title: "I'm a merchant",
    sub: 'Run loyalty for your store. 14-day free trial.',
  },
];

export function ChooseRoleScreen({ onContinue }: ChooseRoleScreenProps) {
  const [selected, setSelected] = useState<Role>('customer');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.logoRow}>
        <Text style={styles.logoName}>PerkBack</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>How will you use PerkBack?</Text>
        <Text style={styles.sub}>Pick the path — you can switch later.</Text>

        <View style={styles.cards}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleEmoji,
                    { backgroundColor: isSelected ? PB.primary : PB.borderSoft },
                  ]}
                >
                  <Text style={styles.roleEmojiText}>{role.emoji}</Text>
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleSub}>{role.sub}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && { borderColor: PB.primary, backgroundColor: PB.primary },
                  ]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button kind="primary" onPress={() => onContinue(selected)} style={styles.cta}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PB.bg,
  },
  logoRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoName: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: PB.fg,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  sub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: PB.muted,
    marginTop: 8,
    marginBottom: 24,
  },
  cards: {
    gap: 12,
    marginBottom: 28,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: PB.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PB.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: PB.primary,
    borderWidth: 2,
  },
  roleEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmojiText: {
    fontSize: 22,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: PB.fg,
  },
  roleSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: PB.muted,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PB.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 11,
    color: '#fff',
    fontFamily: FONTS.bold,
  },
  cta: {
    width: '100%',
  },
});
