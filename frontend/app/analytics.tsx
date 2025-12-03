import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface AnalyticsData {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_members: number;
  weekly_completion: number[];
  project_distribution: { name: string; value: number; color: string }[];
}

// Simple Bar Chart Component
function BarChart({ data, labels, height = 150 }: { data: number[]; labels: string[]; height?: number }) {
  const maxValue = Math.max(...data, 1);
  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animatedValues.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: data[index] / maxValue,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
        delay: index * 50,
      }).start();
    });
  }, [data]);

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.barsContainer}>
        {data.map((value, index) => (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barWrapper}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.barGradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </Animated.View>
            </View>
            <Text style={styles.barLabel}>{labels[index]}</Text>
            <Text style={styles.barValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Circular Progress Component
function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  value,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  value: string;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: percentage,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.circularBackground}>
        <View
          style={[
            styles.circularTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circularProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      <View style={styles.circularContent}>
        <Text style={styles.circularValue}>{value}</Text>
        <Text style={styles.circularLabel}>{label}</Text>
      </View>
    </View>
  );
}

// Distribution Item
function DistributionItem({
  item,
  total,
  index,
}: {
  item: { name: string; value: number; color: string };
  total: number;
  index: number;
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? (item.value / total) * 100 : 0;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: percentage,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
      delay: index * 100,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.distributionItem}>
      <View style={styles.distributionHeader}>
        <View style={styles.distributionLabel}>
          <View style={[styles.distributionDot, { backgroundColor: item.color }]} />
          <Text style={styles.distributionName}>{item.name}</Text>
        </View>
        <Text style={styles.distributionValue}>{item.value}</Text>
      </View>
      <View style={styles.distributionBarContainer}>
        <Animated.View
          style={[
            styles.distributionBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function Analytics() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

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

  const fetchAnalytics = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(
        `${API_URL}/analytics/dashboard?workspace_id=${currentWorkspace._id}`
      );
      // Add mock data for charts
      setData({
        ...response.data,
        weekly_completion: [12, 19, 15, 22, 18, 25, 20],
        project_distribution: [
          { name: 'Tamamlanan', value: response.data.completed_projects || 3, color: theme.colors.accent.success },
          { name: 'Devam Eden', value: response.data.active_projects || 5, color: theme.colors.accent.primary },
          { name: 'Bekleyen', value: response.data.total_projects - (response.data.completed_projects || 0) - (response.data.active_projects || 0) || 2, color: theme.colors.accent.warning },
        ],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data on error
      setData({
        total_projects: 10,
        active_projects: 5,
        completed_projects: 3,
        total_tasks: 45,
        pending_tasks: 15,
        in_progress_tasks: 12,
        completed_tasks: 18,
        total_members: 8,
        weekly_completion: [12, 19, 15, 22, 18, 25, 20],
        project_distribution: [
          { name: 'Tamamlanan', value: 3, color: theme.colors.accent.success },
          { name: 'Devam Eden', value: 5, color: theme.colors.accent.primary },
          { name: 'Bekleyen', value: 2, color: theme.colors.accent.warning },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentWorkspace]);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchAnalytics();
  };

  const periods = [
    { key: 'week', label: 'Hafta' },
    { key: 'month', label: 'Ay' },
    { key: 'year', label: 'Yıl' },
  ];

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const completionRate = data
    ? Math.round((data.completed_tasks / Math.max(data.total_tasks, 1)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analitik</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent.primary}
              />
            }
          >
            {/* Period Selector */}
            <Animated.View
              style={[styles.periodSelector, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPeriod(period.key);
                  }}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period.key && styles.periodButtonTextActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Overview Stats */}
            <Animated.View style={[styles.overviewSection, { opacity: fadeAnim }]}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewCard}>
                  <LinearGradient
                    colors={theme.colors.gradients.primary}
                    style={styles.overviewIconContainer}
                  >
                    <Ionicons name="folder" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.overviewValue}>{data?.total_projects || 0}</Text>
                  <Text style={styles.overviewLabel}>Toplam Proje</Text>
                </View>
                <View style={styles.overviewCard}>
                  <LinearGradient
                    colors={theme.colors.gradients.secondary}
                    style={styles.overviewIconContainer}
                  >
                    <Ionicons name="checkbox" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.overviewValue}>{data?.total_tasks || 0}</Text>
                  <Text style={styles.overviewLabel}>Toplam Görev</Text>
                </View>
              </View>
              <View style={styles.overviewRow}>
                <View style={styles.overviewCard}>
                  <LinearGradient
                    colors={theme.colors.gradients.success}
                    style={styles.overviewIconContainer}
                  >
                    <Ionicons name="checkmark-done" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.overviewValue}>{data?.completed_tasks || 0}</Text>
                  <Text style={styles.overviewLabel}>Tamamlanan</Text>
                </View>
                <View style={styles.overviewCard}>
                  <LinearGradient
                    colors={theme.colors.gradients.warning}
                    style={styles.overviewIconContainer}
                  >
                    <Ionicons name="people" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.overviewValue}>{data?.total_members || 0}</Text>
                  <Text style={styles.overviewLabel}>Takım Üyesi</Text>
                </View>
              </View>
            </Animated.View>

            {/* Completion Rate */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Tamamlanma Oranı</Text>
              <View style={styles.completionCard}>
                <View style={styles.completionCircle}>
                  <LinearGradient
                    colors={theme.colors.gradients.primary}
                    style={styles.completionGradient}
                  >
                    <Text style={styles.completionPercentage}>{completionRate}%</Text>
                  </LinearGradient>
                </View>
                <View style={styles.completionStats}>
                  <View style={styles.completionStat}>
                    <View style={[styles.completionDot, { backgroundColor: theme.colors.accent.success }]} />
                    <Text style={styles.completionLabel}>Tamamlanan</Text>
                    <Text style={styles.completionValue}>{data?.completed_tasks || 0}</Text>
                  </View>
                  <View style={styles.completionStat}>
                    <View style={[styles.completionDot, { backgroundColor: theme.colors.accent.primary }]} />
                    <Text style={styles.completionLabel}>Devam Eden</Text>
                    <Text style={styles.completionValue}>{data?.in_progress_tasks || 0}</Text>
                  </View>
                  <View style={styles.completionStat}>
                    <View style={[styles.completionDot, { backgroundColor: theme.colors.accent.warning }]} />
                    <Text style={styles.completionLabel}>Bekleyen</Text>
                    <Text style={styles.completionValue}>{data?.pending_tasks || 0}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Weekly Chart */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Haftalık Tamamlama</Text>
              <View style={styles.chartCard}>
                <BarChart
                  data={data?.weekly_completion || [0, 0, 0, 0, 0, 0, 0]}
                  labels={weekDays}
                />
              </View>
            </Animated.View>

            {/* Project Distribution */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Proje Dağılımı</Text>
              <View style={styles.distributionCard}>
                {data?.project_distribution.map((item, index) => (
                  <DistributionItem
                    key={item.name}
                    item={item}
                    total={data.total_projects}
                    index={index}
                  />
                ))}
              </View>
            </Animated.View>

            <View style={{ height: 40 }} />
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  filterButton: {
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  overviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  completionCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  completionCircle: {
    marginRight: 20,
  },
  completionGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  completionStats: {
    flex: 1,
    gap: 12,
  },
  completionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completionLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  completionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  chartCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  chartContainer: {
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '60%',
    maxWidth: 30,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    minHeight: 4,
  },
  barGradient: {
    flex: 1,
  },
  barLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBackground: {
    position: 'absolute',
  },
  circularTrack: {
    borderColor: theme.colors.background.elevated,
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    alignItems: 'center',
  },
  circularValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  circularLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  distributionCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: 16,
  },
  distributionItem: {
    gap: 8,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionName: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  distributionBarContainer: {
    height: 8,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
});
