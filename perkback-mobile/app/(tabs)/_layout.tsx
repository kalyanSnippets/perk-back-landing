import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { PB, FONTS } from '../../src/constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, paddingHorizontal: 4, minWidth: 56 },
  wrapActive: {},
  emoji: { fontSize: 22, marginBottom: 2 },
  label: { fontSize: 10, fontFamily: FONTS.medium, color: '#9aa0b0', textAlign: 'center' },
  labelActive: { color: PB.primary, fontFamily: FONTS.bold },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: PB.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="my-card"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👛" label="Wallet" focused={focused} /> }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" label="Rewards" focused={focused} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗺" label="Explore" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
      />
    </Tabs>
  );
}
