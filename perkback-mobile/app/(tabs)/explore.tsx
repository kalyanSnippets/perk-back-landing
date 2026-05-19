import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useExploreData } from '../../src/hooks/useExploreData';
import { ConnectionError, ScreenSkeleton } from '../../src/components/ui/AppStates';
import { PB, FONTS } from '../../src/constants/theme';

export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For you');
  const { merchants, campaigns, fallbackMerchants } = useExploreData();
  const list = merchants.data?.length ? merchants.data : fallbackMerchants;
  const filtered = useMemo(
    () => list.filter((merchant) => {
      const matchesQuery = !query || merchant.name.toLowerCase().includes(query.toLowerCase()) || merchant.category?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'For you' || merchant.category?.toLowerCase().includes(category.toLowerCase());
      return matchesQuery && matchesCategory;
    }),
    [category, list, query]
  );

  const refresh = () => {
    merchants.refetch();
    campaigns.refetch();
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
          <Text style={styles.sub}>Stores nearby earning your points</Text>
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
          {['For you', 'Coffee', 'Eats', 'Beauty', 'Retail'].map((item) => {
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
            <View style={styles.map}>
              <View style={styles.gridLines} />
              {filtered.slice(0, 4).map((merchant, index) => (
                <TouchableOpacity
                  key={merchant.id}
                  style={[styles.mapPin, { top: 34 + (index % 2) * 66, left: 38 + index * 60 }]}
                  onPress={() => router.push(`/merchant/${merchant.id}`)}
                >
                  <Text style={styles.mapPinText}>{merchant.name.slice(0, 2)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.listToggle}><Text style={styles.listToggleText}>⌖ List view</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Featured campaigns</Text>
            <TouchableOpacity activeOpacity={0.88} onPress={() => filtered[0] && router.push(`/merchant/${filtered[0].id}`)}>
              <LinearGradient colors={['#3b2418', '#8a561f']} style={styles.campaign}>
                <Text style={styles.campaignMerchant}>{filtered[0]?.name || 'Bondi Beans'}</Text>
                <Text style={styles.campaignTitle}>{campaigns.data?.[0]?.title || filtered[0]?.campaignTitle || 'Double points all weekend'}</Text>
                <Text style={styles.campaignSub}>Sat & Sun · earn 2× on every coffee</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Browse stores</Text>
              <TouchableOpacity onPress={() => router.push('/scan')}><Text style={styles.scanLink}>Scan</Text></TouchableOpacity>
            </View>
            {filtered.map((merchant) => (
              <TouchableOpacity key={merchant.id} style={styles.storeRow} onPress={() => router.push(`/merchant/${merchant.id}`)} activeOpacity={0.84}>
                <View style={styles.storeAvatar}><Text style={styles.storeAvatarText}>{merchant.name.slice(0, 2).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{merchant.name}</Text>
                  <Text style={styles.storeMeta}>{merchant.category || 'Local rewards'} · {merchant.distanceLabel || 'nearby'}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/scan')} activeOpacity={0.9}>
        <Text style={styles.fabText}>⌗</Text>
      </TouchableOpacity>
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
  map: { height: 178, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e9f1fb', marginBottom: 20 },
  gridLines: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,.32)' },
  mapPin: { position: 'absolute', width: 48, height: 34, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: PB.primary, alignItems: 'center', justifyContent: 'center' },
  mapPinText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 11 },
  listToggle: { position: 'absolute', right: 14, top: 14, height: 32, borderRadius: 16, paddingHorizontal: 12, backgroundColor: '#fff', justifyContent: 'center' },
  listToggleText: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 11 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 10 },
  scanLink: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 12 },
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
  fab: { position: 'absolute', right: 22, bottom: 96, width: 58, height: 58, borderRadius: 29, backgroundColor: PB.accentStrong, alignItems: 'center', justifyContent: 'center', shadowColor: PB.accentStrong, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 25 },
});
