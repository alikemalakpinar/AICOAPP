import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width: w = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: w,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.05)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={4} height={50} borderRadius={2} />
        <View style={styles.cardHeaderContent}>
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardBody}>
        <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={12} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={14} />
        <View style={styles.avatarStack}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: -8 }} />
          <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: -8 }} />
        </View>
      </View>
      <View style={styles.progressSection}>
        <Skeleton width="100%" height={6} borderRadius={3} />
      </View>
    </View>
  );
}

export function SkeletonTaskCard() {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Skeleton width={4} height={40} borderRadius={2} />
        <View style={styles.taskContent}>
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={12} />
        </View>
      </View>
      <View style={styles.taskFooter}>
        <Skeleton width="100%" height={6} borderRadius={3} />
      </View>
      <View style={styles.taskAvatars}>
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: -8 }} />
      </View>
    </View>
  );
}

export function SkeletonMemberCard() {
  return (
    <View style={styles.memberCard}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.memberInfo}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width={60} height={20} borderRadius={8} />
      </View>
      <View style={styles.memberStats}>
        <Skeleton width={30} height={16} style={{ marginBottom: 4 }} />
        <Skeleton width={30} height={16} />
      </View>
    </View>
  );
}

export function SkeletonStatCard() {
  return (
    <View style={styles.statCard}>
      <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
      <Skeleton width={40} height={24} style={{ marginBottom: 4 }} />
      <Skeleton width={50} height={12} />
    </View>
  );
}

export function SkeletonListLoader({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'task' | 'member' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.listContainer}>
      {items.map((item) => (
        <View key={item}>
          {type === 'card' && <SkeletonCard />}
          {type === 'task' && <SkeletonTaskCard />}
          {type === 'member' && <SkeletonMemberCard />}
        </View>
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboardContainer}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsRow}>
        <Skeleton width={80} height={36} borderRadius={18} />
        <Skeleton width={90} height={36} borderRadius={18} />
        <Skeleton width={100} height={36} borderRadius={18} />
      </View>

      {/* Cards */}
      <SkeletonTaskCard />
      <SkeletonTaskCard />

      {/* Calendar */}
      <View style={styles.calendarSection}>
        <Skeleton width={150} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.weekDays}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <View key={day} style={styles.dayItem}>
              <Skeleton width={20} height={14} style={{ marginBottom: 8 }} />
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function SkeletonAnalytics() {
  return (
    <View style={styles.analyticsContainer}>
      {/* Header Stats */}
      <View style={styles.analyticsStatsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.analyticsStatCard}>
            <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton width={50} height={28} style={{ marginBottom: 6 }} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>

      {/* Chart Section */}
      <View style={styles.chartSkeletonContainer}>
        <View style={styles.chartHeader}>
          <Skeleton width={120} height={18} />
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
        <View style={styles.chartBars}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.chartBarItem}>
              <Skeleton width={24} height={60 + Math.random() * 60} borderRadius={4} />
              <Skeleton width={20} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Progress Circle */}
      <View style={styles.progressSkeletonContainer}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <View style={styles.progressLabels}>
          <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={120} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={14} />
        </View>
      </View>

      {/* Distribution List */}
      <View style={styles.distributionSkeleton}>
        <Skeleton width={140} height={18} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.distributionSkeletonItem}>
            <View style={styles.distributionSkeletonHeader}>
              <Skeleton width={12} height={12} borderRadius={6} />
              <Skeleton width={80} height={14} style={{ marginLeft: 8 }} />
              <Skeleton width={30} height={14} style={{ marginLeft: 'auto' }} />
            </View>
            <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function SkeletonTaskDetail() {
  return (
    <View style={styles.taskDetailContainer}>
      {/* Title Section */}
      <View style={styles.taskDetailHeader}>
        <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} />
      </View>

      {/* Badges */}
      <View style={styles.taskDetailBadges}>
        <Skeleton width={100} height={32} borderRadius={16} />
        <Skeleton width={80} height={32} borderRadius={16} style={{ marginLeft: 12 }} />
      </View>

      {/* Info Cards */}
      <View style={styles.taskDetailInfoCard}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={styles.taskDetailInfoContent}>
          <Skeleton width={60} height={12} style={{ marginBottom: 6 }} />
          <Skeleton width={120} height={16} />
        </View>
      </View>

      <View style={styles.taskDetailInfoCard}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={styles.taskDetailInfoContent}>
          <Skeleton width={60} height={12} style={{ marginBottom: 6 }} />
          <Skeleton width={100} height={16} />
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.taskDetailComments}>
        <Skeleton width={100} height={18} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.commentSkeleton}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={styles.commentContent}>
              <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="90%" height={12} style={{ marginBottom: 4 }} />
              <Skeleton width="70%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SkeletonProjectDetail() {
  return (
    <View style={styles.projectDetailContainer}>
      {/* Header */}
      <View style={styles.projectDetailHeader}>
        <Skeleton width="70%" height={28} style={{ marginBottom: 12 }} />
        <View style={styles.projectDetailStatus}>
          <Skeleton width={80} height={28} borderRadius={14} />
          <Skeleton width={100} height={20} style={{ marginLeft: 12 }} />
        </View>
      </View>

      {/* Description */}
      <View style={styles.projectDetailDescription}>
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="75%" height={14} />
      </View>

      {/* Progress Card */}
      <View style={styles.projectDetailProgress}>
        <View style={styles.progressHeader}>
          <Skeleton width={80} height={16} />
          <Skeleton width={40} height={16} />
        </View>
        <Skeleton width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
      </View>

      {/* Stats Grid */}
      <View style={styles.projectDetailStats}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.projectDetailStatItem}>
            <Skeleton width={32} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
            <Skeleton width={30} height={20} style={{ marginBottom: 4 }} />
            <Skeleton width={50} height={12} />
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Skeleton width={80} height={36} borderRadius={18} />
        <Skeleton width={70} height={36} borderRadius={18} />
        <Skeleton width={60} height={36} borderRadius={18} />
        <Skeleton width={70} height={36} borderRadius={18} />
      </View>

      {/* Task List */}
      <SkeletonTaskCard />
      <SkeletonTaskCard />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.background.elevated,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  progressSection: {
    marginTop: 8,
  },
  taskCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskFooter: {
    marginBottom: 12,
  },
  taskAvatars: {
    flexDirection: 'row',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dashboardContainer: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  calendarSection: {
    marginTop: 24,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
  },
  // Analytics Skeleton Styles
  analyticsContainer: {
    paddingHorizontal: 20,
  },
  analyticsStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  analyticsStatCard: {
    width: '47%',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  chartSkeletonContainer: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
  },
  chartBarItem: {
    alignItems: 'center',
  },
  progressSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  progressLabels: {
    marginLeft: 24,
    flex: 1,
  },
  distributionSkeleton: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  distributionSkeletonItem: {
    marginBottom: 16,
  },
  distributionSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Task Detail Skeleton Styles
  taskDetailContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  taskDetailHeader: {
    marginBottom: 20,
  },
  taskDetailBadges: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  taskDetailInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskDetailInfoContent: {
    marginLeft: 16,
    flex: 1,
  },
  taskDetailComments: {
    marginTop: 24,
  },
  commentSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentContent: {
    marginLeft: 12,
    flex: 1,
  },
  // Project Detail Skeleton Styles
  projectDetailContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  projectDetailHeader: {
    marginBottom: 20,
  },
  projectDetailStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDetailDescription: {
    marginBottom: 24,
  },
  projectDetailProgress: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDetailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  projectDetailStatItem: {
    width: '47%',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
});
