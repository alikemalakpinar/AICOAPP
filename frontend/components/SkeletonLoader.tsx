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
});
