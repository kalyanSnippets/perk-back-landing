import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface LoyaltyCardProps {
  firstName?: string;
  lastName?: string;
  crn?: string;
  cardNumber?: string;
  tier?: string;
  points?: number;
  compact?: boolean;
}

export function LoyaltyCard({
  firstName = 'Alex',
  lastName = 'Park',
  crn = '40231',
  cardNumber = '8821 0034 7720',
  tier = 'Gold',
  points = 2480,
  compact = false,
}: LoyaltyCardProps) {
  return (
    <LinearGradient
      colors={['hsl(224,84%,24%)', 'hsl(224,80%,30%)', 'hsl(214,72%,45%)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.compact]}
    >
      {/* Gold glow top-right */}
      <View style={styles.glowTopRight} />
      {/* Blue glow bottom-left */}
      <View style={styles.glowBottomLeft} />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.cardTypeLabel}>Digital Loyalty Card</Text>
          <Text style={styles.brandName}>PerkBack</Text>
        </View>
        <View style={styles.starBadge}>
          <Text style={styles.starIcon}>★</Text>
        </View>
      </View>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          <Text style={styles.fieldValue}>{firstName} {lastName}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CRN</Text>
          <Text style={[styles.fieldValue, styles.mono]}>{crn}</Text>
        </View>
        <View style={[styles.field, styles.fullWidth]}>
          <Text style={styles.fieldLabel}>Card No.</Text>
          <Text style={[styles.fieldValue, styles.mono, styles.cardNumber]}>{cardNumber}</Text>
        </View>
        {!compact && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Points</Text>
            <Text style={[styles.fieldValue, styles.mono]}>{points.toLocaleString()}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#0a2a6b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  compact: {
    padding: 16,
  },
  glowTopRight: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,208,122,0.35)',
    top: -60,
    right: -60,
  },
  glowBottomLeft: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(63,122,212,0.25)',
    bottom: -80,
    left: -60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 1,
  },
  cardTypeLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.semiBold,
  },
  brandName: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: '#fff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  starBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,208,122,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 16,
    color: PB.primary,
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 1,
  },
  field: {
    minWidth: '40%',
  },
  fullWidth: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.semiBold,
  },
  fieldValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#fff',
    marginTop: 2,
  },
  mono: {
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 15,
    letterSpacing: 1,
  },
});
