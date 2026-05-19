import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { PB, FONTS } from '../../constants/theme';

function barcodeBits(value: string) {
  const source = value.replace(/\s/g, '') || '0000000000';
  const bits: number[] = [];

  source.split('').forEach((char, index) => {
    const code = char.charCodeAt(0) + index * 17;
    bits.push(1, 1, 0);
    for (let i = 0; i < 7; i += 1) bits.push((code >> i) & 1);
    bits.push(0);
  });

  return bits;
}

export function WalletScanCard({ value }: { value: string }) {
  const cleanValue = value || '0000000000';
  const bits = barcodeBits(cleanValue);
  const barWidth = 2.2;
  const width = bits.length * barWidth;

  return (
    <View style={styles.card}>
      <View style={styles.qrWrap}>
        <QRCode value={cleanValue} size={118} color={PB.primary} backgroundColor="#ffffff" />
      </View>
      <View style={styles.scanContent}>
        <Text style={styles.eyebrow}>Scan at the till</Text>
        <Text style={styles.title}>Customer card</Text>
        <View style={styles.barcodeBox}>
          <Svg width="100%" height={58} viewBox={`0 0 ${width} 58`}>
            {bits.map((bit, index) =>
              bit ? (
                <Rect
                  key={`${index}-${bit}`}
                  x={index * barWidth}
                  y={index % 5 === 0 ? 4 : 0}
                  width={barWidth * (index % 3 === 0 ? 1.5 : 1)}
                  height={index % 5 === 0 ? 50 : 58}
                  fill={PB.fg}
                />
              ) : null
            )}
          </Svg>
        </View>
        <Text style={styles.cardNumber}>{cleanValue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PB.borderSoft,
    padding: 14,
    shadowColor: '#102a5f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  qrWrap: {
    width: 130,
    height: 130,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanContent: { flex: 1, justifyContent: 'center' },
  eyebrow: {
    color: PB.accentStrong,
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  title: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 10 },
  barcodeBox: {
    height: 66,
    borderRadius: 12,
    backgroundColor: '#f7f9fd',
    borderWidth: 1,
    borderColor: PB.borderSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardNumber: {
    color: PB.muted,
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 7,
  },
});
