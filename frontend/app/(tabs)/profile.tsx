import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface UserStats {
  projects_count: number;
  tasks_count: number;
  completed_tasks: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({ projects_count: 0, tasks_count: 0, completed_tasks: 0 });
  const [refreshing, setRefreshing] = useState(false);

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
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
    fetchStats();
  }, [currentWorkspace]);

  const fetchStats = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard?workspace_id=${currentWorkspace._id}`);
      setStats({
        projects_count: response.data.total_projects || 0,
        tasks_count: response.data.total_tasks || 0,
        completed_tasks: response.data.completed_tasks || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [currentWorkspace]);

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
        router.push('/edit-profile');
      },
    },
    {
      icon: 'briefcase-outline' as const,
      title: 'Çalışma Alanları',
      subtitle: `${workspaces.length} çalışma alanı`,
      gradient: theme.colors.gradients.secondary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/workspaces');
      },
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Bildirimler',
      subtitle: 'Bildirimlerinizi görüntüleyin',
      gradient: theme.colors.gradients.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/notifications');
      },
    },
    {
      icon: 'time-outline' as const,
      title: 'Zaman Takibi',
      subtitle: 'Çalışma saatlerinizi yönetin',
      gradient: theme.colors.gradients.success,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/timetracking');
      },
    },
    {
      icon: 'bar-chart-outline' as const,
      title: 'Analitik',
      subtitle: 'Performans raporlarınız',
      gradient: theme.colors.gradients.info,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/analytics');
      },
    },
    {
      icon: 'settings-outline' as const,
      title: 'Ayarlar',
      subtitle: 'Uygulama tercihlerinizi yönetin',
      gradient: theme.colors.gradients.tertiary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/settings');
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings');
              }}
            >
              <Ionicons name="cog-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} />
            }
          >
            {/* Profile Card */}
            <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/edit-profile');
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={theme.colors.gradients.primaryVibrant}
                    style={styles.avatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </Text>
                  </LinearGradient>
                  <View style={styles.editAvatarButton}>
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.editAvatarGradient}>
                      <Ionicons name="camera" size={14} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
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
                  <Text style={styles.statValue}>{stats.projects_count}</Text>
                  <Text style={styles.statLabel}>Proje</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.tasks_count}</Text>
                  <Text style={styles.statLabel}>Görev</Text>
                </View>
              </View>
            </Animated.View>

            {/* Current Workspace */}
            {currentWorkspace && (
              <Animated.View style={[styles.workspaceCard, { opacity: fadeAnim }]}>
                <TouchableOpacity
                  style={styles.workspaceContent}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/workspaces');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.workspaceIcon}>
                    <LinearGradient colors={theme.colors.gradients.secondary} style={styles.workspaceIconGradient}>
                      <Ionicons name="briefcase" size={20} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
                  <View style={styles.workspaceInfo}>
                    <Text style={styles.workspaceLabel}>Aktif Çalışma Alanı</Text>
                    <Text style={styles.workspaceName}>{currentWorkspace.name}</Text>
                  </View>
                  <View style={styles.switchButton}>
                    <Text style={styles.switchButtonText}>Değiştir</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.accent.primary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Quick Stats */}
            <Animated.View style={[styles.quickStatsCard, { opacity: fadeAnim }]}>
              <View style={styles.quickStatItem}>
                <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.accent.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.accent.success} />
                </View>
                <View style={styles.quickStatInfo}>
                  <Text style={styles.quickStatValue}>{stats.completed_tasks}</Text>
                  <Text style={styles.quickStatLabel}>Tamamlanan</Text>
                </View>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.accent.warning + '20' }]}>
                  <Ionicons name="time" size={22} color={theme.colors.accent.warning} />
                </View>
                <View style={styles.quickStatInfo}>
                  <Text style={styles.quickStatValue}>{stats.tasks_count - stats.completed_tasks}</Text>
                  <Text style={styles.quickStatLabel}>Bekleyen</Text>
                </View>
              </View>
            </Animated.View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Menü</Text>
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
                  <LinearGradient colors={theme.colors.gradients.primaryVibrant} style={styles.appLogoGradient}>
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
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.cardSolid,
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
    backgroundColor: theme.colors.background.cardSolid,
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
    ...theme.shadows.lg,
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
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.background.cardSolid,
  },
  editAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '700',
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
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  workspaceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary + '15',
    gap: 4,
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  quickStatsCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    flexDirection: 'row',
  },
  quickStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatInfo: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  quickStatLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  quickStatDivider: {
    width: 1,
    marginHorizontal: 16,
    backgroundColor: theme.colors.border.light,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.cardSolid,
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
    backgroundColor: theme.colors.background.cardSolid,
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
