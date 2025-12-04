import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';

function TabBarButton({ children, onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <View style={[styles.tabButtonInner, focused && styles.tabButtonFocused]}>
        {children}
      </View>
      {focused && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
}

function FloatingActionButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/create');
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={theme.gradients?.primaryVibrant || ['#6C63FF', '#48C6EF']}
        style={styles.fab}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: theme.colors.accent.primary,
          tabBarInactiveTintColor: theme.colors.text.muted,
          tabBarShowLabel: false,
          tabBarButton: (props) => <TabBarButton {...props} />,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "folder" : "folder-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            tabBarButton: () => <FloatingActionButton />,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20,
    right: 20,
    height: 72,
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xxxl,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 8,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonFocused: {
    backgroundColor: theme.colors.accent.primary + '15',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.primary,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
    borderWidth: 3,
    borderColor: theme.colors.background.primary,
  },
});
