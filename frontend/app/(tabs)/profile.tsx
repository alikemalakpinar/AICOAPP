import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      title: 'Profil Bilgileri',
      subtitle: 'Kişisel bilgilerinizi düzenleyin',
      gradient: theme.colors.gradients.primary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek');
      },
    },
    {
      icon: 'briefcase-outline' as const,
      title: 'Çalışma Alanları',
      subtitle: `${workspaces.length} çalışma alanı`,
      gradient: theme.colors.gradients.secondary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek');
      },
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Bildirimler',
      subtitle: 'Bildirim ayarlarınızı yönetin',
      gradient: theme.colors.gradients.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/notifications');
      },
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Gizlilik ve Güvenlik',
      subtitle: 'Hesap güvenliğinizi yönetin',
      gradient: theme.colors.gradients.success,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek');
      },
    },
    {
      icon: 'color-palette-outline' as const,
      title: 'Görünüm',
      subtitle: 'Tema ve görünüm ayarları',
      gradient: ['#ec4899', '#f472b6'] as [string, string],
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek');
      },
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Yardım ve Destek',
      subtitle: 'SSS ve destek alın',
      gradient: ['#6366f1', '#818cf8'] as [string, string],
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.headerTitle}>Profil</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="cog-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={theme.colors.gradients.primary}
                    style={styles.avatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </Text>
                  </LinearGradient>
                  <TouchableOpacity style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={14} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{user?.full_name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{workspaces.length}</Text>
                  <Text style={styles.statLabel}>Çalışma Alanı</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Proje</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>48</Text>
                  <Text style={styles.statLabel}>Görev</Text>
                </View>
              </View>
            </Animated.View>

            {/* Current Workspace */}
            {currentWorkspace && (
              <Animated.View style={[styles.workspaceCard, { opacity: fadeAnim }]}>
                <View style={styles.workspaceHeader}>
                  <View style={styles.workspaceIcon}>
                    <LinearGradient colors={theme.colors.gradients.secondary} style={styles.workspaceIconGradient}>
                      <Ionicons name="briefcase" size={20} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
                  <View style={styles.workspaceInfo}>
                    <Text style={styles.workspaceLabel}>Aktif Çalışma Alanı</Text>
                    <Text style={styles.workspaceName}>{currentWorkspace.name}</Text>
                  </View>
                  <TouchableOpacity style={styles.switchButton}>
                    <Text style={styles.switchButtonText}>Değiştir</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Menu Items */}
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <Animated.View
                  key={index}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + index * 3],
                      }),
                    }],
                  }}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuIconContainer}>
                      <LinearGradient colors={item.gradient} style={styles.menuIconGradient}>
                        <Ionicons name={item.icon} size={20} color={theme.colors.text.primary} />
                      </LinearGradient>
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* App Info */}
            <View style={styles.appInfoCard}>
              <View style={styles.appInfoHeader}>
                <View style={styles.appLogo}>
                  <LinearGradient colors={theme.colors.gradients.primary} style={styles.appLogoGradient}>
                    <Text style={styles.appLogoText}>A</Text>
                  </LinearGradient>
                </View>
                <View style={styles.appInfoContent}>
                  <Text style={styles.appName}>AICO</Text>
                  <Text style={styles.appVersion}>Versiyon 1.0.0</Text>
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <View style={styles.logoutContent}>
                <Ionicons name="log-out-outline" size={24} color={theme.colors.accent.error} />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 120 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background.card,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
  },
  workspaceCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workspaceIcon: {
    marginRight: 12,
  },
  workspaceIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginBottom: 4,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  switchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary + '15',
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  appInfoCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    marginRight: 12,
  },
  appLogoGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  appInfoContent: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.accent.error + '10',
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.accent.error + '30',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent.error,
  },
});
