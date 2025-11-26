import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { format } from 'date-fns';
import { ModernCard } from '../components/ModernCard';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { EmptyState } from '../components/EmptyState';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return 'checkbox' as const;
      case 'project': return 'folder' as const;
      case 'team': return 'people' as const;
      case 'deadline': return 'alarm' as const;
      default: return 'information-circle' as const;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'task': return '#3b82f6';
      case 'project': return '#8b5cf6';
      case 'team': return '#10b981';
      case 'deadline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bildirimler</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <LoadingAnimation />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Bildirimler</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} okunmamış</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor="#3b82f6"
            />
          }
        >
          {notifications.length === 0 ? (
            <EmptyState
              icon="notifications-outline"
              title="Bildirim Yok"
              subtitle="Henüz hiç bildiriminiz bulunmuyor"
            />
          ) : (
            <View style={styles.notificationsContainer}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification._id}
                  onPress={() => markAsRead(notification._id)}
                  activeOpacity={0.7}
                >
                  <ModernCard style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadCard
                  ]}>
                    <View style={styles.notificationHeader}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: getColor(notification.type) + '20' }
                        ]}
                      >
                        <Ionicons
                          name={getIcon(notification.type)}
                          size={24}
                          color={getColor(notification.type)}
                        />
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm')}
                    </Text>
                  </ModernCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  unreadCount: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  scrollView: { flex: 1 },
  notificationsContainer: { padding: 20 },
  notificationCard: { marginBottom: 12 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: { fontSize: 12, color: '#9ca3af' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
