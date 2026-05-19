import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { PB, FONTS } from '../../src/constants/theme';

function initials(name?: string | null) {
  if (!name) return 'PB';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { customer, user, signOut } = useAuth();
  const wallet = useCustomerWallet(customer?.id);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(false);
  const [birthdayOn, setBirthdayOn] = useState(true);

  const joinedStores = wallet.data?.length ?? 0;
  const totalVisits = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.visits ?? 0), 0) ?? 0,
    [wallet.data]
  );

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of PerkBack?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.greetingAvatar}>
            <Text style={styles.greetingAvatarText}>{initials(customer?.full_name).slice(0, 1)}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.greetingName}>{customer?.full_name?.split(' ')[0] ?? 'there'}</Text>
          </View>
          <TouchableOpacity style={styles.bell} activeOpacity={0.85}>
            <Text style={styles.bellText}>⌁</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Profile</Text>

        <LinearGradient
          colors={['#ffffff', '#f8fbff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(customer?.full_name)}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{customer?.full_name ?? 'PerkBack member'}</Text>
            <Text style={styles.memberLine}>
              Member since Mar 2025 · CRN {customer?.crn ?? 'pending'}
            </Text>
            <Text style={styles.tier}>Gold member</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{(customer?.points_balance ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>points</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalVisits}</Text>
            <Text style={styles.statLabel}>visits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{joinedStores}</Text>
            <Text style={styles.statLabel}>stores</Text>
          </View>
        </View>

        <Section title="Account">
          <SettingRow icon="♙" title="Personal details" subtitle={user?.email ?? 'Email and phone'} />
          <SettingRow icon="♧" title="Birthday & preferences" subtitle="Jul 14 · 4 categories" />
          <SettingRow
            icon="▦"
            title="Linked stores"
            subtitle={`${joinedStores} ${joinedStores === 1 ? 'store' : 'stores'}`}
            onPress={() => router.push('/(tabs)/my-card')}
          />
        </Section>

        <Section title="Notifications">
          <SettingRow
            icon="♢"
            title="Push notifications"
            right={<Switch value={pushOn} onValueChange={setPushOn} trackColor={{ true: PB.primary, false: '#dce2eb' }} />}
          />
          <SettingRow
            icon="✉"
            title="Email digest"
            right={<Switch value={emailOn} onValueChange={setEmailOn} trackColor={{ true: PB.primary, false: '#dce2eb' }} />}
          />
          <SettingRow
            icon="☆"
            title="Birthday alerts"
            right={<Switch value={birthdayOn} onValueChange={setBirthdayOn} trackColor={{ true: PB.primary, false: '#dce2eb' }} />}
          />
        </Section>

        <Section title="Support & legal">
          <SettingRow icon="?" title="Help centre" subtitle="FAQs and contact support" />
          <SettingRow icon="§" title="Terms & privacy" subtitle="PerkBack customer policy" />
        </Section>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PB.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  greetingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  greetingAvatarText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  greeting: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11 },
  greetingName: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14, marginTop: -1 },
  bell: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PB.borderSoft,
  },
  bellText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 19 },
  heading: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 28, letterSpacing: -0.7, marginBottom: 14 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: PB.borderSoft,
    shadowColor: PB.primary,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: PB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontFamily: FONTS.extraBold, fontSize: 20 },
  profileCopy: { flex: 1 },
  name: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 17, letterSpacing: -0.2 },
  memberLine: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 3 },
  tier: { color: PB.accentStrong, fontFamily: FONTS.bold, fontSize: 11, marginTop: 5 },
  chevron: { color: PB.muted, fontFamily: FONTS.extraBold, fontSize: 26 },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PB.borderSoft,
  },
  statValue: { color: PB.fg, fontFamily: FONTS.extraBold, fontSize: 19 },
  statLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  section: { marginTop: 22 },
  sectionTitle: {
    color: PB.muted,
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 9,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PB.borderSoft,
    overflow: 'hidden',
  },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: PB.borderSoft,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#f2f6fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconText: { color: PB.primary, fontFamily: FONTS.bold, fontSize: 15 },
  rowCopy: { flex: 1 },
  rowTitle: { color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  rowSubtitle: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
  signOutBtn: {
    height: 52,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: PB.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  signOutText: { fontFamily: FONTS.bold, fontSize: 15, color: PB.danger },
});
