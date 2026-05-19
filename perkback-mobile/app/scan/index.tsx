import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PB, FONTS } from '../../src/constants/theme';

function extractMerchantCode(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const joinIndex = parts.findIndex((part) => ['join', 'merchant', 'm'].includes(part));
    if (joinIndex >= 0 && parts[joinIndex + 1]) return parts[joinIndex + 1];
    return parts[parts.length - 1] || raw;
  } catch {
    return raw.replace(/^perkback:\/\//, '').replace(/^join\//, '');
  }
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [locked, setLocked] = useState(false);

  const openJoin = (value: string) => {
    const code = extractMerchantCode(value);
    if (!code) {
      Alert.alert('Code required', 'Enter or scan a merchant QR code.');
      return;
    }
    router.push(`/join/${encodeURIComponent(code)}`);
  };

  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);
    openJoin(data);
    setTimeout(() => setLocked(false), 1600);
  };

  if (!permission) {
    return <View style={styles.loading}><Text style={styles.loadingText}>Preparing camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#050b17', '#071426', '#0a1f5c']} style={styles.fill}>
          <View style={styles.top}>
            <TouchableOpacity onPress={() => router.back()}><Text style={styles.topIcon}>×</Text></TouchableOpacity>
            <Text style={styles.topTitle}>Scan merchant QR</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>Allow PerkBack to scan merchant QR posters and instantly add the store card to your wallet.</Text>
            <TouchableOpacity style={styles.goldBtn} onPress={requestPermission}>
              <Text style={styles.goldText}>Allow camera</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.manualBox}>
            <TextInput value={manualCode} onChangeText={setManualCode} placeholder="Enter merchant code" placeholderTextColor="rgba(255,255,255,.5)" style={styles.manualInput} autoCapitalize="none" />
            <TouchableOpacity style={styles.manualBtn} onPress={() => openJoin(manualCode)}><Text style={styles.manualBtnText}>Join</Text></TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#050b17', '#071426', '#0a1f5c']} style={styles.fill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <View style={styles.overlay} />
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.topIcon}>×</Text></TouchableOpacity>
          <Text style={styles.topTitle}>Scan merchant QR</Text>
          <Text style={styles.flash}>⚡</Text>
        </View>
        <View style={styles.scanner}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={styles.scanLine} />
        </View>
        <View style={styles.bottom}>
          <Text style={styles.bottomTitle}>Point at a merchant code</Text>
          <Text style={styles.bottomSub}>Scan the QR poster at the till</Text>
          <View style={styles.manualBox}>
            <TextInput value={manualCode} onChangeText={setManualCode} placeholder="Enter code manually" placeholderTextColor="rgba(255,255,255,.5)" style={styles.manualInput} autoCapitalize="none" />
            <TouchableOpacity style={styles.manualBtn} onPress={() => openJoin(manualCode)}><Text style={styles.manualBtnText}>Join</Text></TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b17' },
  loading: { flex: 1, backgroundColor: '#050b17', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontFamily: FONTS.bold },
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1,8,18,.34)' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  topIcon: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 24 },
  topTitle: { color: '#fff', fontFamily: FONTS.bold, fontSize: 12 },
  flash: { color: PB.accent, fontSize: 18 },
  scanner: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 },
  corner: { position: 'absolute', width: 58, height: 58, borderColor: PB.accent, borderWidth: 3 },
  tl: { top: '29%', left: 42, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: '29%', right: 42, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: '32%', left: 42, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: '32%', right: 42, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanLine: { width: '64%', height: 2, backgroundColor: PB.accent, shadowColor: PB.accent, shadowOpacity: 1, shadowRadius: 16 },
  bottom: { alignItems: 'center', paddingBottom: 28, zIndex: 2 },
  bottomTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 15 },
  bottomSub: { color: 'rgba(255,255,255,.72)', fontFamily: FONTS.regular, fontSize: 11, marginTop: 4 },
  manualBox: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 18 },
  manualInput: { flex: 1, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', paddingHorizontal: 14, color: '#fff', fontFamily: FONTS.bold },
  manualBtn: { height: 46, paddingHorizontal: 18, borderRadius: 15, backgroundColor: PB.accent, alignItems: 'center', justifyContent: 'center' },
  manualBtnText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 13 },
  permissionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permissionTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 24, textAlign: 'center' },
  permissionText: { color: 'rgba(255,255,255,.72)', fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  goldBtn: { height: 48, paddingHorizontal: 22, borderRadius: 16, backgroundColor: PB.accent, justifyContent: 'center', marginTop: 8 },
  goldText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 14 },
});
