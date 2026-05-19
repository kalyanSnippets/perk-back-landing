import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useCustomerWallet } from '../../src/hooks/useCustomerWallet';
import { supabase } from '../../src/lib/supabase';
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
  const { customer, merchant, user, signOut, refreshCustomer } = useAuth();
  const wallet = useCustomerWallet(customer?.id);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(false);
  const [birthdayOn, setBirthdayOn] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(customer?.full_name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [birthday, setBirthday] = useState(customer?.date_of_birth ?? '');

  const joinedStores = wallet.data?.length ?? 0;
  const totalVisits = useMemo(
    () => wallet.data?.reduce((sum, item) => sum + Number(item.visit_count ?? item.visits ?? 0), 0) ?? 0,
    [wallet.data]
  );

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of PerkBack?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const startEdit = () => {
    setFullName(customer?.full_name ?? '');
    setPhone(customer?.phone ?? '');
    setBirthday(customer?.date_of_birth ?? '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFullName(customer?.full_name ?? '');
    setPhone(customer?.phone ?? '');
    setBirthday(customer?.date_of_birth ?? '');
  };

  const saveProfile = async () => {
    if (!customer?.id) return;
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    const normalizedBirthday = birthday.trim() || null;
    const { error } = await supabase
      .from('customers')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        date_of_birth: normalizedBirthday,
      })
      .eq('id', customer.id);
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    await refreshCustomer();
    setEditing(false);
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

        <View style={styles.sectionHeaderLine}>
          <Text style={styles.sectionTitle}>Account</Text>
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={cancelEdit}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} disabled={saving}><Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={startEdit}><Text style={styles.saveText}>Edit</Text></TouchableOpacity>
          )}
        </View>
        <View style={styles.sectionCard}>
          {editing ? (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput value={fullName} onChangeText={setFullName} style={styles.fieldInput} placeholder="Your name" />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput value={phone} onChangeText={setPhone} style={styles.fieldInput} placeholder="+61" keyboardType="phone-pad" />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Birthday</Text>
                <TextInput value={birthday} onChangeText={setBirthday} style={styles.fieldInput} placeholder="YYYY-MM-DD" />
              </View>
              <View style={styles.readOnlyRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.readOnlyText}>{user?.email ?? 'No email'}</Text>
              </View>
            </>
          ) : (
            <>
              <SettingRow icon="♙" title="Personal details" subtitle={`${user?.email ?? 'Email'} · ${customer?.phone || 'Add phone'}`} />
              <SettingRow icon="♧" title="Birthday & preferences" subtitle={customer?.date_of_birth || 'Add birthday for birthday rewards'} />
              <SettingRow
                icon="▦"
                title="Linked stores"
                subtitle={`${joinedStores} ${joinedStores === 1 ? 'store' : 'stores'}`}
                onPress={() => router.push('/(tabs)/my-card')}
              />
            </>
          )}
        </View>

        {merchant ? (
          <Section title="Merchant">
            <SettingRow
              icon="▣"
              title={merchant.name ?? 'Merchant dashboard'}
              subtitle="Open perkback.com.au/dashboard"
              onPress={() => Linking.openURL('https://perkback.com.au/dashboard')}
            />
          </Section>
        ) : null}

        <Section title="Account links">
          <SettingRow
            icon="?"
            title="Help & FAQ"
            subtitle="Get support"
            onPress={() => Linking.openURL('https://perkback.com.au/help')}
          />
          <SettingRow
            icon="§"
            title="Terms & privacy"
            subtitle="PerkBack customer policy"
            onPress={() => Linking.openURL('https://perkback.com.au/terms')}
          />
          <SettingRow
            icon="i"
            title="About PerkBack"
            subtitle="Visit perkback.com.au"
            onPress={() => Linking.openURL('https://perkback.com.au')}
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
  sectionHeaderLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 9, paddingHorizontal: 4 },
  sectionTitle: {
    color: PB.muted,
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 0,
  },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  cancelText: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 13 },
  saveText: { color: PB.primary, fontFamily: FONTS.extraBold, fontSize: 13 },
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
  fieldRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PB.borderSoft },
  fieldLabel: { color: PB.muted, fontFamily: FONTS.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 7 },
  fieldInput: { minHeight: 42, borderRadius: 13, backgroundColor: '#f7f9fd', borderWidth: 1, borderColor: PB.border, paddingHorizontal: 12, color: PB.fg, fontFamily: FONTS.bold, fontSize: 14 },
  readOnlyRow: { paddingHorizontal: 16, paddingVertical: 14 },
  readOnlyText: { color: PB.muted, fontFamily: FONTS.medium, fontSize: 14 },
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
