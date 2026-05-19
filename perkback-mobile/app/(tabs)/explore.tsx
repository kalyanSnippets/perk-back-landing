import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useExploreData } from '../../src/hooks/useExploreData';
import { ConnectionError, ScreenSkeleton } from '../../src/components/ui/AppStates';
import { PB, FONTS } from '../../src/constants/theme';

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radius = 6371;
  const dLat = (to.latitude - from.latitude) * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km?: number | null) {
  if (km == null) return 'nearby';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(km < 10 ? 1 : 0)}km`;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For you');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('Locating nearby stores...');
  const { merchants, campaigns } = useExploreData();
  const list = useMemo(() => {
    const source = merchants.data ?? [];
    return source
      .map((merchant) => {
        const lat = merchant.lat ?? merchant.latitude ?? null;
        const lng = merchant.lng ?? merchant.longitude ?? null;
        const km = location && lat != null && lng != null ? distanceKm(location, { latitude: Number(lat), longitude: Number(lng) }) : null;
        return { ...merchant, distanceKm: km, distanceLabel: formatDistance(km) || merchant.distanceLabel };
      })
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name);
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [location, merchants.data]);
  const filtered = useMemo(
    () => list.filter((merchant) => {
      const matchesQuery = !query || merchant.name.toLowerCase().includes(query.toLowerCase()) || merchant.category?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'For you' || merchant.category?.toLowerCase().includes(category.toLowerCase());
      return matchesQuery && matchesCategory;
    }),
    [category, list, query]
  );

  const loadLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationLabel('Location off - showing all stores');
      return;
    }
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    setLocationLabel('Stores sorted by distance');
  };

  useEffect(() => {
    loadLocation().catch(() => setLocationLabel('Location unavailable - showing all stores'));
  }, []);

  const refresh = async () => {
    await Promise.all([merchants.refetch(), campaigns.refetch(), loadLocation()]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={merchants.isRefetching} onRefresh={refresh} tintColor={PB.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Discover</Text>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.sub}>{locationLabel}</Text>
        </View>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search stores, rewards, categories"
            placeholderTextColor={PB.muted}
            style={styles.searchInput}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['For you', 'Coffee', 'Food', 'Retail', 'Beauty', 'Health', 'Other'].map((item) => {
            const active = item === category;
            return (
              <TouchableOpacity key={item} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {merchants.isLoading ? <ScreenSkeleton /> : merchants.isError ? (
          <ConnectionError onRetry={refresh} message={merchants.error instanceof Error ? merchants.error.message : undefined} />
        ) : (
          <>
            {filtered.some((merchant) => merchant.lat != null || merchant.latitude != null) ? (
              <View style={styles.map}>
                <Text style={styles.mapTitle}>Nearby stores</Text>
                <Text style={styles.mapSub}>Sorted by your current location.</Text>
                {filtered.slice(0, 3).map((merchant) => (
                  <TouchableOpacity key={merchant.id} style={styles.mapStore} onPress={() => router.push(`/merchant/${merchant.id}`)}>
                    <Text style={styles.mapStoreName}>{merchant.name}</Text>
                    <Text style={styles.mapStoreDistance}>{merchant.distanceLabel || 'nearby'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.mapEmpty}>
                <Text style={styles.mapTitle}>No store locations yet</Text>
                <Text style={styles.mapSub}>When merchants add their address and coordinates, nearby stores will appear here.</Text>
              </View>
            )}

            {(campaigns.data ?? []).length > 0 && filtered[0] ? (
              <>
                <Text style={styles.sectionTitle}>Featured campaigns</Text>
                <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/merchant/${filtered[0].id}`)}>
                  <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.campaign}>
                    <Text style={styles.campaignMerchant}>{filtered[0].name}</Text>
                    <Text style={styles.campaignTitle}>{campaigns.data?.[0]?.title}</Text>
                    <Text style={styles.campaignSub}>{campaigns.data?.[0]?.description || 'Tap to view this merchant.'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : null}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Browse stores</Text>
            </View>
            {filtered.length > 0 ? filtered.map((merchant) => (
              <TouchableOpacity key={merchant.id} style={styles.storeRow} onPress={() => router.push(`/merchant/${merchant.id}`)} activeOpacity={0.84}>
                <View style={styles.storeAvatar}><Text style={styles.storeAvatarText}>{merchant.name.slice(0, 2).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{merchant.name}</Text>
                  <Text style={styles.storeMeta}>{merchant.category || 'Local rewards'} · {merchant.distanceLabel || 'nearby'}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No real stores found</Text>
                <Text style={styles.emptyText}>Stores will appear here after merchants are published in Supabase.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 116 },
  header: { marginBottom: 14 },
  kicker: { color: PB.accentStrong, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 31, letterSpacing: -0.9, marginTop: 2 },
  sub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 13, marginTop: 2 },
  search: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, paddingHorizontal: 14 },
  searchIcon: { color: PB.muted, fontSize: 17, marginRight: 8 },
  searchInput: { flex: 1, color: PB.fg, fontFamily: FONTS.regular, fontSize: 13, paddingVertical: 0 },
  chips: { gap: 9, paddingVertical: 14 },
  chip: { height: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: PB.border, justifyContent: 'center' },
  chipActive: { backgroundColor: PB.primary, borderColor: PB.primary },
  chipText: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  map: { borderRadius: 24, backgroundColor: '#e9f1fb', marginBottom: 20, padding: 16, borderWidth: 1, borderColor: PB.borderSoft },
  mapEmpty: { borderRadius: 24, backgroundColor: '#fff', marginBottom: 20, padding: 18, borderWidth: 1, borderColor: PB.borderSoft },
  mapTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17 },
  mapSub: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  mapStore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 15, padding: 12, marginTop: 8 },
  mapStoreName: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 13 },
  mapStoreDistance: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 10 },
  campaign: { borderRadius: 23, padding: 18, minHeight: 126, marginBottom: 22, justifyContent: 'flex-end' },
  campaignMerchant: { color: 'rgba(255,255,255,.65)', fontFamily: FONTS.bold, fontSize: 11 },
  campaignTitle: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 20, marginTop: 4 },
  campaignSub: { color: 'rgba(255,255,255,.75)', fontFamily: FONTS.regular, fontSize: 12, marginTop: 3 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: PB.borderSoft, padding: 13, marginBottom: 10 },
  storeAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  storeAvatarText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 12 },
  storeName: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 15 },
  storeMeta: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  chevron: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 24 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: PB.borderSoft },
  emptyTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 15 },
  emptyText: { color: PB.muted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
