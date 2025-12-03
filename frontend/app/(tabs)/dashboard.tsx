import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');
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

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  assigned_to?: string[];
  start_time?: string;
  end_time?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

export default function Dashboard() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get week days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

  const fetchData = async () => {
    if (!currentWorkspace) return;
    try {
      const [statsResponse, tasksResponse] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard?workspace_id=${currentWorkspace._id}`),
        axios.get(`${API_URL}/tasks?workspace_id=${currentWorkspace._id}`),
      ]);
      setStats(statsResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchData();
  }, [currentWorkspace]);

  const getTasksForTimeSlot = (hour: number) => {
    // Mock task placement - in real app, filter by actual time
    return tasks.filter((_, index) => {
      const taskHour = 7 + (index % 12);
      return taskHour === hour;
    }).slice(0, 1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.priority.high;
      case 'medium': return theme.colors.priority.medium;
      case 'low': return theme.colors.priority.low;
      default: return theme.colors.text.muted;
    }
  };

  if (!currentWorkspace) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyIconGradient}>
                  <Ionicons name="briefcase-outline" size={48} color={theme.colors.text.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Çalışma Alanı Seçilmedi</Text>
              <Text style={styles.emptySubtitle}>Başlamak için bir çalışma alanı seçin veya oluşturun</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/profile')}
              >
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyButtonGradient}>
                  <Text style={styles.emptyButtonText}>Çalışma Alanı Seç</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: '45deg' }] }]}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.loadingGradient} />
              </Animated.View>
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/profile');
                }}
              >
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Takım Görev{'\n'}Yöneticisi</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/notifications');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} />
            }
          >
            {/* Status Tabs */}
            <Animated.View style={[styles.statusTabs, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <TouchableOpacity style={[styles.statusTab, styles.statusTabActive]}>
                <Text style={styles.statusTabTextActive}>Yapılacak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statusTab}>
                <Text style={styles.statusTabText}>Devam Eden</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statusTab}>
                <Text style={styles.statusTabText}>Tamamlanan</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Task Cards */}
            <Animated.View style={[styles.taskCardsSection, { opacity: fadeAnim }]}>
              {tasks.slice(0, 3).map((task, index) => (
                <TouchableOpacity
                  key={task._id}
                  style={styles.taskCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.taskCardHeader}>
                    <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                    <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                    <TouchableOpacity style={styles.taskCardMenu}>
                      <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text.muted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.taskCardMeta}>
                    <View style={styles.taskCardDate}>
                      <Ionicons name="calendar-outline" size={14} color={theme.colors.accent.primary} />
                      <Text style={styles.taskCardDateText}>
                        {task.deadline ? format(new Date(task.deadline), 'dd MMM yyyy', { locale: tr }) : 'Tarih yok'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={theme.colors.gradients.primary}
                        style={[styles.progressFill, { width: `${(index + 1) * 25}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <Text style={styles.progressText}>{(index + 1) * 25}%</Text>
                  </View>

                  {/* Avatars */}
                  <View style={styles.taskCardFooter}>
                    <View style={styles.avatarStack}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} style={[styles.miniAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                          <LinearGradient
                            colors={i === 0 ? theme.colors.gradients.primary : i === 1 ? theme.colors.gradients.secondary : theme.colors.gradients.warning}
                            style={styles.miniAvatarGradient}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Calendar Section */}
            <Animated.View style={[styles.calendarSection, { opacity: fadeAnim }]}>
              <Text style={styles.calendarTitle}>
                {format(selectedDate, 'EEEE, d MMMM', { locale: tr })}
              </Text>

              {/* Week Days */}
              <View style={styles.weekDays}>
                {weekDays.map((day, index) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        isSelected && styles.dayButtonSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDate(day);
                      }}
                    >
                      <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                        {format(day, 'EEE', { locale: tr }).charAt(0).toUpperCase()}
                      </Text>
                      <View style={[styles.dayNumberContainer, isSelected && styles.dayNumberContainerSelected]}>
                        {isSelected ? (
                          <LinearGradient colors={theme.colors.gradients.primary} style={styles.dayNumberGradient}>
                            <Text style={styles.dayNumberSelected}>{format(day, 'd')}</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                            {format(day, 'd')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* Timeline */}
            <View style={styles.timelineSection}>
              {HOURS.map((hour) => {
                const hourTasks = getTasksForTimeSlot(hour);
                return (
                  <View key={hour} style={styles.timelineRow}>
                    <Text style={styles.timelineHour}>
                      {hour.toString().padStart(2, '0')}:00
                    </Text>
                    <View style={styles.timelineLine}>
                      <View style={styles.timelineDot} />
                      {hourTasks.map((task) => (
                        <TouchableOpacity
                          key={task._id}
                          style={styles.timelineTask}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[theme.colors.background.card, theme.colors.background.elevated]}
                            style={styles.timelineTaskContent}
                          >
                            <View style={[styles.timelineTaskIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                            <View style={styles.timelineTaskInfo}>
                              <Text style={styles.timelineTaskTitle} numberOfLines={1}>{task.title}</Text>
                              <Text style={styles.timelineTaskTime}>{hour}:00 - {hour + 1}:00</Text>
                            </View>
                            {task.status === 'in_progress' && (
                              <TouchableOpacity style={styles.joinButton}>
                                <Text style={styles.joinButtonText}>Katıl</Text>
                              </TouchableOpacity>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom spacing for tab bar */}
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
  headerLeft: {
    width: 48,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  iconButton: {
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
  statusTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  statusTabActive: {
    backgroundColor: theme.colors.text.primary,
  },
  statusTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  statusTabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background.primary,
  },
  taskCardsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  taskCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  taskCardMenu: {
    padding: 4,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 16,
  },
  taskCardDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskCardDateText: {
    fontSize: 13,
    color: theme.colors.accent.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.background.card,
    overflow: 'hidden',
  },
  miniAvatarGradient: {
    width: '100%',
    height: '100%',
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    alignItems: 'center',
    padding: 8,
  },
  dayButtonSelected: {},
  dayName: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 8,
  },
  dayNameSelected: {
    color: theme.colors.text.primary,
  },
  dayNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerSelected: {},
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  dayNumberToday: {
    color: theme.colors.accent.primary,
  },
  dayNumberGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timelineSection: {
    paddingHorizontal: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
    minHeight: 60,
  },
  timelineHour: {
    width: 50,
    fontSize: 13,
    color: theme.colors.text.muted,
    paddingTop: 4,
  },
  timelineLine: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border.light,
    paddingLeft: 16,
    paddingBottom: 8,
  },
  timelineDot: {
    position: 'absolute',
    left: -4,
    top: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.border.medium,
  },
  timelineTask: {
    marginBottom: 8,
  },
  timelineTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  timelineTaskIndicator: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  timelineTaskInfo: {
    flex: 1,
  },
  timelineTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  timelineTaskTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
