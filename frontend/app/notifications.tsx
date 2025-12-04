import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 80;

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface SwipeableNotificationProps {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  getIcon: (type: string) => keyof typeof Ionicons.glyphMap;
  getColor: (type: string) => string;
}

function SwipeableNotification({ notification, onMarkRead, onDelete, getIcon, getColor }: SwipeableNotificationProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemHeight = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedDx = Math.max(-ACTION_WIDTH * 1.5, Math.min(ACTION_WIDTH * 1.5, gestureState.dx));
        translateX.setValue(clampedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > ACTION_WIDTH * 0.5) {
          // Swipe right - mark as read
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(translateX, {
            toValue: ACTION_WIDTH,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            setTimeout(() => {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
              }).start();
              onMarkRead();
            }, 150);
          });
        } else if (gestureState.dx < -ACTION_WIDTH * 0.5) {
          // Swipe left - delete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            Animated.timing(itemHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              onDelete();
            });
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const color = getColor(notification.type);

  return (
    <Animated.View style={[styles.swipeContainer, { opacity, transform: [{ scaleY: itemHeight }] }]}>
      {/* Left Action - Mark as Read */}
      <Animated.View style={[styles.actionContainer, styles.leftAction, { opacity: leftActionOpacity }]}>
        <LinearGradient
          colors={[theme.colors.semantic.success, theme.colors.semantic.success + 'dd']}
          style={styles.actionGradient}
        >
          <Ionicons name="checkmark-done" size={24} color="#ffffff" />
          <Text style={styles.actionText}>Okundu</Text>
        </LinearGradient>
      </Animated.View>

      {/* Right Action - Delete */}
      <Animated.View style={[styles.actionContainer, styles.rightAction, { opacity: rightActionOpacity }]}>
        <LinearGradient
          colors={[theme.colors.semantic.error + 'dd', theme.colors.semantic.error]}
          style={styles.actionGradient}
        >
          <Ionicons name="trash" size={24} color="#ffffff" />
          <Text style={styles.actionText}>Sil</Text>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={getIcon(notification.type)} size={22} color={color} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, notification.read && styles.readTitle]} numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {format(new Date(notification.created_at), 'HH:mm', { locale: tr })}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNotifications();
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error:', error);
      // Demo data for showcase
      setNotifications([
        {
          _id: '1',
          title: 'Yeni Görev Atandı',
          message: 'Ahmet Yılmaz tarafından "Dashboard Tasarımı" görevi size atandı.',
          type: 'task',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          _id: '2',
          title: 'Proje Güncellendi',
          message: 'AICO Mobil App projesi başarıyla güncellendi.',
          type: 'project',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: '3',
          title: 'Takım Üyesi Eklendi',
          message: 'Zeynep Kaya takıma katıldı.',
          type: 'team',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: '4',
          title: 'Son Tarih Yaklaşıyor',
          message: 'API Entegrasyonu görevinin son tarihi 2 gün içinde.',
          type: 'deadline',
          read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
    } catch (error) {
      console.error('Error:', error);
    }
    setNotifications(notifications.map(n =>
      n._id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
    } catch (error) {
      console.error('Error:', error);
    }
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
    } catch (error) {
      console.error('Error:', error);
    }
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'task': return 'checkbox';
      case 'project': return 'folder';
      case 'team': return 'people';
      case 'deadline': return 'alarm';
      case 'comment': return 'chatbubble';
      case 'mention': return 'at';
      default: return 'notifications';
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case 'task': return theme.colors.accent.primary;
      case 'project': return theme.colors.accent.secondary;
      case 'team': return theme.colors.semantic.success;
      case 'deadline': return theme.colors.semantic.error;
      case 'comment': return theme.colors.semantic.warning;
      case 'mention': return '#ec4899';
      default: return theme.colors.text.tertiary;
    }
  };

  const groupNotifications = () => {
    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const groupedNotifications = groupNotifications();

  const renderNotificationGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.groupContainer}>
        <Text style={styles.groupTitle}>{title}</Text>
        {items.map((notification) => (
          <SwipeableNotification
            key={notification._id}
            notification={notification}
            onMarkRead={() => markAsRead(notification._id)}
            onDelete={() => deleteNotification(notification._id)}
            getIcon={getIcon}
            getColor={getColor}
          />
        ))}
      </View>
    );
  };

  // Skeleton loader for notifications
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonMessage} />
            <View style={styles.skeletonTime} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Bildirimler</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            {unreadCount > 0 ? (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllButton}
              >
                <Ionicons name="checkmark-done" size={20} color={theme.colors.accent.primary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </Animated.View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['Tümü', 'Okunmamış', 'Görevler', 'Projeler', 'Takım'].map((filter, index) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, index === 0 && styles.filterChipActive]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Text style={[styles.filterChipText, index === 0 && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          {loading ? (
            renderSkeleton()
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchNotifications();
                  }}
                  tintColor={theme.colors.accent.primary}
                  colors={[theme.colors.accent.primary]}
                />
              }
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <LinearGradient
                      colors={[theme.colors.accent.primary + '20', theme.colors.accent.secondary + '20']}
                      style={styles.emptyIconGradient}
                    >
                      <Ionicons name="notifications-off-outline" size={48} color={theme.colors.text.tertiary} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyTitle}>Bildirim Yok</Text>
                  <Text style={styles.emptySubtitle}>
                    Yeni bildirimler aldığınızda burada görünecek
                  </Text>
                </View>
              ) : (
                <>
                  {renderNotificationGroup('Bugün', groupedNotifications.today)}
                  {renderNotificationGroup('Dün', groupedNotifications.yesterday)}
                  {renderNotificationGroup('Daha Önce', groupedNotifications.older)}
                </>
              )}
            </ScrollView>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.semantic.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  groupContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  actionGradient: {
    width: ACTION_WIDTH,
    height: '90%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  notificationCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  readTitle: {
    color: theme.colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
    marginBottom: 8,
  },
  skeletonMessage: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
    marginBottom: 8,
  },
  skeletonTime: {
    width: '30%',
    height: 12,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
  },
});
