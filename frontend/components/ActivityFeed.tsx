import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { theme } from '../theme';

export interface Activity {
  _id: string;
  type: 'task_created' | 'task_completed' | 'task_updated' | 'project_created' | 'comment_added' | 'member_added' | 'deadline_updated';
  title: string;
  description?: string;
  user_name: string;
  user_id: string;
  entity_id?: string;
  entity_type?: 'task' | 'project' | 'comment';
  created_at: string;
  metadata?: {
    project_name?: string;
    task_title?: string;
    old_value?: string;
    new_value?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  onActivityPress?: (activity: Activity) => void;
  showHeader?: boolean;
  maxItems?: number;
}

const getActivityConfig = (type: Activity['type']) => {
  switch (type) {
    case 'task_created':
      return {
        icon: 'add-circle' as const,
        color: theme.colors.accent.primary,
        label: 'yeni görev olu_turdu',
      };
    case 'task_completed':
      return {
        icon: 'checkmark-circle' as const,
        color: theme.colors.accent.success,
        label: 'görevi tamamlad1',
      };
    case 'task_updated':
      return {
        icon: 'create' as const,
        color: theme.colors.accent.warning,
        label: 'görevi güncelledi',
      };
    case 'project_created':
      return {
        icon: 'folder-open' as const,
        color: theme.colors.accent.secondary,
        label: 'yeni proje olu_turdu',
      };
    case 'comment_added':
      return {
        icon: 'chatbubble' as const,
        color: theme.colors.accent.tertiary,
        label: 'yorum ekledi',
      };
    case 'member_added':
      return {
        icon: 'person-add' as const,
        color: theme.colors.accent.primary,
        label: 'üye ekledi',
      };
    case 'deadline_updated':
      return {
        icon: 'calendar' as const,
        color: theme.colors.accent.warning,
        label: 'tarihi güncelledi',
      };
    default:
      return {
        icon: 'ellipsis-horizontal' as const,
        color: theme.colors.text.muted,
        label: 'aktivite',
      };
  }
};

export function ActivityFeed({
  activities,
  onActivityPress,
  showHeader = true,
  maxItems = 10,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={40} color={theme.colors.text.muted} />
        <Text style={styles.emptyText}>Henüz aktivite yok</Text>
        <Text style={styles.emptySubtext}>
          Görev ve projelerle ilgili aktiviteler burada görünecek
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Son Aktiviteler</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{activities.length}</Text>
          </View>
        </View>
      )}

      <View style={styles.timeline}>
        {displayActivities.map((activity, index) => {
          const config = getActivityConfig(activity.type);
          const isLast = index === displayActivities.length - 1;

          return (
            <TouchableOpacity
              key={activity._id}
              style={styles.activityItem}
              onPress={() => onActivityPress?.(activity)}
              activeOpacity={onActivityPress ? 0.7 : 1}
              disabled={!onActivityPress}
            >
              {/* Timeline connector */}
              <View style={styles.timelineConnector}>
                <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon} size={16} color={config.color} />
                </View>
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              {/* Content */}
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.userName}>{activity.user_name}</Text>
                  <Text style={styles.activityLabel}>{config.label}</Text>
                </View>

                {activity.title && (
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.title}
                  </Text>
                )}

                {activity.metadata?.project_name && (
                  <View style={styles.projectTag}>
                    <View style={styles.projectDot} />
                    <Text style={styles.projectName}>{activity.metadata.project_name}</Text>
                  </View>
                )}

                <Text style={styles.timestamp}>
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Activity Item Card - for standalone use
interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const config = getActivityConfig(activity.type);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.cardIcon, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardUserName}>{activity.user_name}</Text>
          <Text style={styles.cardTimestamp}>
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </Text>
        </View>

        <Text style={styles.cardDescription}>
          <Text style={styles.cardLabel}>{config.label}</Text>
          {activity.title && (
            <Text style={styles.cardTitle}> - {activity.title}</Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Compact Activity List Item
interface ActivityListItemProps {
  activity: Activity;
  onPress?: () => void;
}

export function ActivityListItem({ activity, onPress }: ActivityListItemProps) {
  const config = getActivityConfig(activity.type);

  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.listItemIcon, { backgroundColor: config.color + '15' }]}>
        <Ionicons name={config.icon} size={14} color={config.color} />
      </View>

      <View style={styles.listItemContent}>
        <Text style={styles.listItemText} numberOfLines={1}>
          <Text style={styles.listItemUser}>{activity.user_name}</Text>
          <Text style={styles.listItemLabel}> {config.label}</Text>
          {activity.title && (
            <Text style={styles.listItemTitle}> "{activity.title}"</Text>
          )}
        </Text>
        <Text style={styles.listItemTime}>
          {formatDistanceToNow(new Date(activity.created_at), {
            addSuffix: true,
            locale: tr,
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: theme.colors.accent.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  timeline: {},
  activityItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border.light,
    marginTop: 4,
    marginBottom: -8,
  },
  activityContent: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  activityLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.primary,
    marginRight: 6,
  },
  projectName: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Card styles
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cardTimestamp: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardLabel: {
    color: theme.colors.text.secondary,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },

  // List Item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  listItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 13,
    lineHeight: 18,
  },
  listItemUser: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  listItemLabel: {
    color: theme.colors.text.secondary,
  },
  listItemTitle: {
    color: theme.colors.text.primary,
  },
  listItemTime: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
});
