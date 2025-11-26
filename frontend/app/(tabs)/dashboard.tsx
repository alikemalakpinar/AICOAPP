import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { StatsCard } from '../../components/StatsCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_members: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(
        `${API_URL}/analytics/dashboard?workspace_id=${currentWorkspace._id}`
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchStats();
  }, [currentWorkspace]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0c0d1f', '#1a1c2e']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <EmptyState
            icon="briefcase-outline"
            title="No Workspace Selected"
            subtitle="Please select or create a workspace to get started"
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0c0d1f', '#1a1c2e']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.loadingContainer}>
            <LoadingAnimation />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0c0d1f', '#1a1c2e']} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, {user?.full_name}!</Text>
            <Text style={styles.workspaceName}>{currentWorkspace.name}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/search');
              }}
              style={styles.iconButton}
            >
              <Ionicons name="search" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notifications');
              }}
              style={styles.iconButton}
            >
              <Ionicons name="notifications" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/timetracking');
              }}
              style={styles.iconButton}
            >
              <Ionicons name="time" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
        >
          <View style={styles.statsGrid}>
            <StatsCard
              icon="folder"
              value={stats?.total_projects || 0}
              label="Total Projects"
              colors={['#3b82f6', '#2563eb']}
              delay={0}
            />
            <StatsCard
              icon="trending-up"
              value={stats?.active_projects || 0}
              label="Active Projects"
              colors={['#8b5cf6', '#7c3aed']}
              delay={100}
            />
            <StatsCard
              icon="checkmark-circle"
              value={stats?.completed_tasks || 0}
              label="Tasks Done"
              colors={['#10b981', '#059669']}
              delay={200}
            />
            <StatsCard
              icon="people"
              value={stats?.total_members || 0}
              label="Team Members"
              colors={['#f59e0b', '#d97706']}
              delay={300}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Overview</Text>
            <View style={styles.taskCards}>
              <View style={styles.taskCard}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.taskGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="time-outline" size={32} color="#ffffff" />
                  <Text style={styles.taskValue}>{stats?.pending_tasks || 0}</Text>
                  <Text style={styles.taskLabel}>To Do</Text>
                </LinearGradient>
              </View>
              <View style={styles.taskCard}>
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.taskGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="rocket-outline" size={32} color="#ffffff" />
                  <Text style={styles.taskValue}>{stats?.in_progress_tasks || 0}</Text>
                  <Text style={styles.taskLabel}>In Progress</Text>
                </LinearGradient>
              </View>
              <View style={styles.taskCard}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.taskGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-circle-outline" size={32} color="#ffffff" />
                  <Text style={styles.taskValue}>{stats?.completed_tasks || 0}</Text>
                  <Text style={styles.taskLabel}>Completed</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.quickStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="pie-chart-outline" size={24} color="#3b82f6" />
                  <View style={styles.statText}>
                    <Text style={styles.statLabel}>Completion Rate</Text>
                    <Text style={styles.statValue}>
                      {stats?.total_tasks ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={24} color="#8b5cf6" />
                  <View style={styles.statText}>
                    <Text style={styles.statLabel}>Active Workload</Text>
                    <Text style={styles.statValue}>{stats?.in_progress_tasks || 0} tasks</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d1f',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
  },
  workspaceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutGradient: {
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  taskCards: {
    flexDirection: 'row',
    gap: 12,
  },
  taskCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  taskGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  taskValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  taskLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
  },
  quickStats: {
    backgroundColor: '#1a1c2e',
    borderRadius: 16,
    padding: 20,
  },
  statRow: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 16,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
});
