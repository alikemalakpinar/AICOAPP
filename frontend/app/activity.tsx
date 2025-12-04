import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Activity {
  _id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  workspace_id: string;
  details: Record<string, any>;
  created_at: string;
  user?: {
    _id: string;
    full_name: string;
    avatar?: string;
  };
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  created: { icon: 'add-circle', color: theme.colors.semantic.success },
  updated: { icon: 'create', color: theme.colors.accent.primary },
  deleted: { icon: 'trash', color: theme.colors.semantic.error },
  status_changed: { icon: 'swap-horizontal', color: theme.colors.semantic.warning },
  invited: { icon: 'person-add', color: theme.colors.accent.secondary },
  uploaded: { icon: 'cloud-upload', color: theme.colors.accent.primary },
};

const ENTITY_LABELS: Record<string, string> = {
  project: 'proje',
  task: 'görev',
  note: 'not',
  request: 'talep',
  workspace: 'çalışma alanı',
  member: 'üye',
  file: 'dosya',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'oluşturdu',
  updated: 'güncelledi',
  deleted: 'sildi',
  status_changed: 'durumunu değiştirdi',
  invited: 'davet etti',
  uploaded: 'yükledi',
};

export default function ActivityScreen() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (!currentWorkspace?._id) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const newOffset = isRefresh ? 0 : offset;

      const response = await axios.get(`${API_URL}/api/activities`, {
        params: {
          workspace_id: currentWorkspace._id,
          limit: 20,
          offset: newOffset
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const newActivities = response.data;

      if (isRefresh) {
        setActivities(newActivities);
        setOffset(20);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
        setOffset(prev => prev + 20);
      }

      setHasMore(newActivities.length === 20);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [currentWorkspace?._id, offset]);

  useEffect(() => {
    fetchActivities(true);
  }, [currentWorkspace?._id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchActivities(false);
    }
  };

  const getActivityIcon = (action: string) => {
    return ACTION_ICONS[action] || { icon: 'ellipse', color: theme.colors.text.tertiary };
  };

  const getActivityText = (activity: Activity) => {
    const action = ACTION_LABELS[activity.action] || activity.action;
    const entity = ENTITY_LABELS[activity.entity_type] || activity.entity_type;

    let text = `${action} `;

    if (activity.entity_type === 'member') {
      text += `${activity.entity_name} kullanıcısını`;
    } else {
      text += `"${activity.entity_name}" ${entity}${activity.entity_type === 'project' ? 'sini' : 'ini'}`;
    }

    // Add status change details
    if (activity.action === 'status_changed' && activity.details) {
      const oldStatus = activity.details.old_status;
      const newStatus = activity.details.new_status;
      text = `${activity.entity_name} ${entity}inin durumunu "${oldStatus}" → "${newStatus}" olarak değiştirdi`;
    }

    return text;
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const iconConfig = getActivityIcon(item.action);

    return (
      <View style={styles.activityItem}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
          <Ionicons name={iconConfig.icon as any} size={20} color={iconConfig.color} />
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.userName}>
              {item.user?.full_name || 'Bilinmeyen Kullanıcı'}
            </Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: tr
              })}
            </Text>
          </View>

          <Text style={styles.activityText}>
            {getActivityText(item)}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.accent.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aktivite Akışı</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Activity List */}
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pulse-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Henüz aktivite yok</Text>
          <Text style={styles.emptyText}>
            Proje ve görevlerdeki değişiklikler burada görünecek
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accent.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
