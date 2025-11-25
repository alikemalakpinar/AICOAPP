import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
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
  projects_by_status: any;
  tasks_by_priority: any;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
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
    setRefreshing(true);
    fetchStats();
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyText}>No workspace selected</Text>
          <Text style={styles.emptySubtext}>Please select or create a workspace</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  const taskChartData = [
    { value: stats?.pending_tasks || 0, label: 'To Do', frontColor: '#f59e0b' },
    { value: stats?.in_progress_tasks || 0, label: 'Progress', frontColor: '#3b82f6' },
    { value: stats?.completed_tasks || 0, label: 'Done', frontColor: '#10b981' },
  ];

  const projectChartData = [
    { value: stats?.projects_by_status?.not_started || 0, label: 'Not Started', frontColor: '#6b7280' },
    { value: stats?.projects_by_status?.in_progress || 0, label: 'In Progress', frontColor: '#3b82f6' },
    { value: stats?.projects_by_status?.completed || 0, label: 'Completed', frontColor: '#10b981' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name}!</Text>
          <Text style={styles.workspaceName}>{currentWorkspace.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
            <Ionicons name="folder-outline" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats?.total_projects || 0}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Ionicons name="trending-up-outline" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats?.active_projects || 0}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats?.completed_tasks || 0}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="people-outline" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats?.total_members || 0}</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tasks Overview</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={taskChartData}
              width={Dimensions.get('window').width - 80}
              height={200}
              barWidth={60}
              spacing={20}
              roundedTop
              xAxisColor="#2d3148"
              yAxisColor="#2d3148"
              yAxisTextStyle={{ color: '#9ca3af' }}
              xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 12 }}
              noOfSections={4}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>{stats?.pending_tasks || 0} To Do</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>{stats?.in_progress_tasks || 0} In Progress</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>{stats?.completed_tasks || 0} Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Projects Status</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={projectChartData}
              width={Dimensions.get('window').width - 80}
              height={200}
              barWidth={60}
              spacing={20}
              roundedTop
              xAxisColor="#2d3148"
              yAxisColor="#2d3148"
              yAxisTextStyle={{ color: '#9ca3af' }}
              xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 12 }}
              noOfSections={4}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d1f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3148',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
  },
  workspaceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
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
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
  },
  chartCard: {
    backgroundColor: '#1a1c2e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d3148',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
