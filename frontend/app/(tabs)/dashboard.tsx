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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
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
  overdue_tasks: number;
  total_members: number;
  projects_by_status: {
    not_started: number;
    in_progress: number;
    on_hold: number;
    completed: number;
  };
  tasks_by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  tasks_by_status: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  assigned_to?: string;
  project_name?: string;
  project_color?: string;
  created_at: string;
}

interface Project {
  _id: string;
  name: string;
  status: string;
  progress: number;
  color: string;
  deadline?: string;
  task_stats?: {
    total: number;
    completed: number;
    progress: number;
  };
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9am to 6pm

export default function Dashboard() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule'>('overview');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Get week days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = async () => {
    if (!currentWorkspace) return;
    try {
      const [statsResponse, tasksResponse, projectsResponse] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard?workspace_id=${currentWorkspace._id}`),
        axios.get(`${API_URL}/tasks?workspace_id=${currentWorkspace._id}`),
        axios.get(`${API_URL}/projects?workspace_id=${currentWorkspace._id}`),
      ]);
      setStats(statsResponse.data);
      setTasks(tasksResponse.data);
      setProjects(projectsResponse.data);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#22c55e';
      default: return theme.colors.text.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'review': return '#8b5cf6';
      case 'todo':
      case 'not_started': return '#64748b';
      default: return theme.colors.text.muted;
    }
  };

  // Calculate completion percentage
  const completionPercentage = stats
    ? Math.round((stats.completed_tasks / Math.max(stats.total_tasks, 1)) * 100)
    : 0;

  // Get today's tasks
  const todayTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    return isSameDay(new Date(task.deadline), selectedDate);
  });

  // Get upcoming tasks
  const upcomingTasks = tasks
    .filter(task => task.status !== 'done')
    .slice(0, 5);

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
              <View style={styles.loadingSpinner}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.loadingGradient} />
              </View>
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
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} />
            }
          >
            {/* Header Section */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <View style={styles.headerTop}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>⚡</Text>
                </View>
                <View style={styles.headerIcons}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/notifications');
                    }}
                  >
                    <Ionicons name="notifications-outline" size={22} color={theme.colors.text.primary} />
                    {stats && stats.overdue_tasks > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{stats.overdue_tasks}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
              </View>

              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Hoş geldin</Text>
                <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Kullanıcı'},</Text>
                <Text style={styles.welcomeSubtext}>bugün işler nasıl gidiyor!</Text>
                <Text style={styles.dateText}>Bugün {format(new Date(), "d MMMM yyyy", { locale: tr })}</Text>
              </View>

              {/* Quick Action Buttons */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setActiveTab('overview');
                  }}
                >
                  <LinearGradient
                    colors={activeTab === 'overview' ? theme.colors.gradients.primary : ['transparent', 'transparent']}
                    style={[styles.primaryButtonGradient, activeTab !== 'overview' && styles.outlineButton]}
                  >
                    <Text style={[styles.primaryButtonText, activeTab !== 'overview' && styles.outlineButtonText]}>
                      Bugünün Görevleri
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setActiveTab('schedule');
                  }}
                >
                  <View style={[styles.secondaryButtonInner, activeTab === 'schedule' && styles.secondaryButtonActive]}>
                    <Text style={[styles.secondaryButtonText, activeTab === 'schedule' && styles.secondaryButtonTextActive]}>
                      Takvim
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {activeTab === 'overview' ? (
              <>
                {/* Progress Section */}
                <Animated.View style={[styles.progressSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>Tamamlama Durumu</Text>
                      <TouchableOpacity onPress={() => router.push('/analytics')}>
                        <Text style={styles.viewAllText}>Detaylar →</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.progressContent}>
                      <View style={styles.progressCircleContainer}>
                        <View style={styles.progressCircle}>
                          <View style={styles.progressCircleInner}>
                            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
                          </View>
                          <View style={[styles.progressArc, { transform: [{ rotate: `${completionPercentage * 3.6}deg` }] }]} />
                        </View>
                        {/* 3D Effect */}
                        <View style={styles.progressCircleShadow} />
                      </View>

                      <View style={styles.progressStats}>
                        <View style={styles.progressStatItem}>
                          <View style={[styles.progressStatDot, { backgroundColor: '#22c55e' }]} />
                          <View style={styles.progressStatInfo}>
                            <Text style={styles.progressStatLabel}>Tamamlanan</Text>
                            <Text style={styles.progressStatValue}>{stats?.completed_tasks || 0}</Text>
                          </View>
                        </View>
                        <View style={styles.progressStatItem}>
                          <View style={[styles.progressStatDot, { backgroundColor: '#3b82f6' }]} />
                          <View style={styles.progressStatInfo}>
                            <Text style={styles.progressStatLabel}>Devam Eden</Text>
                            <Text style={styles.progressStatValue}>{stats?.in_progress_tasks || 0}</Text>
                          </View>
                        </View>
                        <View style={styles.progressStatItem}>
                          <View style={[styles.progressStatDot, { backgroundColor: '#64748b' }]} />
                          <View style={styles.progressStatInfo}>
                            <Text style={styles.progressStatLabel}>Bekleyen</Text>
                            <Text style={styles.progressStatValue}>{stats?.pending_tasks || 0}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                {/* Quick Stats Grid */}
                <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                  <TouchableOpacity style={styles.statCard} onPress={() => router.push('/projects')}>
                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statCardGradient}>
                      <View style={styles.statCardIcon}>
                        <Ionicons name="folder-outline" size={24} color="#fff" />
                      </View>
                      <Text style={styles.statCardValue}>{stats?.total_projects || 0}</Text>
                      <Text style={styles.statCardLabel}>Projeler</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.statCard}>
                    <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statCardGradient}>
                      <View style={styles.statCardIcon}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                      </View>
                      <Text style={styles.statCardValue}>{stats?.completed_tasks || 0}</Text>
                      <Text style={styles.statCardLabel}>Tamamlanan</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.statCard}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statCardGradient}>
                      <View style={styles.statCardIcon}>
                        <Ionicons name="time-outline" size={24} color="#fff" />
                      </View>
                      <Text style={styles.statCardValue}>{stats?.in_progress_tasks || 0}</Text>
                      <Text style={styles.statCardLabel}>Devam Eden</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.statCard} onPress={() => router.push('/team')}>
                    <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statCardGradient}>
                      <View style={styles.statCardIcon}>
                        <Ionicons name="people-outline" size={24} color="#fff" />
                      </View>
                      <Text style={styles.statCardValue}>{stats?.total_members || 0}</Text>
                      <Text style={styles.statCardLabel}>Üyeler</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Active Projects Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Aktif Projeler</Text>
                    <TouchableOpacity onPress={() => router.push('/projects')}>
                      <Text style={styles.viewAllText}>Tümü →</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectsScroll}>
                    {projects.filter(p => p.status === 'in_progress').slice(0, 5).map((project, index) => (
                      <TouchableOpacity
                        key={project._id}
                        style={[styles.projectCard, { marginLeft: index === 0 ? 20 : 12 }]}
                        onPress={() => router.push(`/project-detail?id=${project._id}`)}
                      >
                        <View style={[styles.projectColorBar, { backgroundColor: project.color || '#3b82f6' }]} />
                        <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                        <View style={styles.projectProgress}>
                          <View style={styles.projectProgressBar}>
                            <View
                              style={[
                                styles.projectProgressFill,
                                { width: `${project.task_stats?.progress || project.progress || 0}%`, backgroundColor: project.color || '#3b82f6' }
                              ]}
                            />
                          </View>
                          <Text style={styles.projectProgressText}>{project.task_stats?.progress || project.progress || 0}%</Text>
                        </View>
                        <View style={styles.projectMeta}>
                          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                          <Text style={styles.projectMetaText}>
                            {project.task_stats?.completed || 0}/{project.task_stats?.total || 0} görev
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {projects.filter(p => p.status === 'in_progress').length === 0 && (
                      <View style={styles.emptyProjectCard}>
                        <Ionicons name="folder-open-outline" size={32} color={theme.colors.text.muted} />
                        <Text style={styles.emptyProjectText}>Aktif proje yok</Text>
                      </View>
                    )}
                  </ScrollView>
                </Animated.View>

                {/* Upcoming Tasks Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Yaklaşan Görevler</Text>
                    <TouchableOpacity>
                      <Text style={styles.viewAllText}>Tümü →</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tasksList}>
                    {upcomingTasks.map((task, index) => (
                      <TouchableOpacity
                        key={task._id}
                        style={styles.taskItem}
                        onPress={() => router.push(`/task-detail?id=${task._id}`)}
                      >
                        <View style={[styles.taskPriorityBar, { backgroundColor: getPriorityColor(task.priority) }]} />
                        <View style={styles.taskContent}>
                          <View style={styles.taskHeader}>
                            <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                            <View style={[styles.taskStatus, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                              <Text style={[styles.taskStatusText, { color: getStatusColor(task.status) }]}>
                                {task.status === 'todo' ? 'Yapılacak' :
                                  task.status === 'in_progress' ? 'Devam' :
                                    task.status === 'review' ? 'İnceleme' : 'Bitti'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.taskMeta}>
                            {task.project_name && (
                              <View style={styles.taskProject}>
                                <View style={[styles.taskProjectDot, { backgroundColor: task.project_color || '#3b82f6' }]} />
                                <Text style={styles.taskProjectName}>{task.project_name}</Text>
                              </View>
                            )}
                            {task.deadline && (
                              <View style={styles.taskDeadline}>
                                <Ionicons name="calendar-outline" size={12} color={theme.colors.text.muted} />
                                <Text style={styles.taskDeadlineText}>
                                  {format(new Date(task.deadline), 'd MMM', { locale: tr })}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                      </TouchableOpacity>
                    ))}
                    {upcomingTasks.length === 0 && (
                      <View style={styles.emptyTasksList}>
                        <Ionicons name="checkbox-outline" size={40} color={theme.colors.text.muted} />
                        <Text style={styles.emptyTasksText}>Bekleyen görev yok</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>

                {/* Priority Distribution */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Öncelik Dağılımı</Text>
                  </View>

                  <View style={styles.priorityGrid}>
                    <View style={styles.priorityItem}>
                      <View style={[styles.priorityIcon, { backgroundColor: '#ef444420' }]}>
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                      </View>
                      <Text style={styles.priorityValue}>{stats?.tasks_by_priority?.critical || 0}</Text>
                      <Text style={styles.priorityLabel}>Kritik</Text>
                    </View>
                    <View style={styles.priorityItem}>
                      <View style={[styles.priorityIcon, { backgroundColor: '#f59e0b20' }]}>
                        <Ionicons name="arrow-up-circle" size={20} color="#f59e0b" />
                      </View>
                      <Text style={styles.priorityValue}>{stats?.tasks_by_priority?.high || 0}</Text>
                      <Text style={styles.priorityLabel}>Yüksek</Text>
                    </View>
                    <View style={styles.priorityItem}>
                      <View style={[styles.priorityIcon, { backgroundColor: '#3b82f620' }]}>
                        <Ionicons name="remove-circle" size={20} color="#3b82f6" />
                      </View>
                      <Text style={styles.priorityValue}>{stats?.tasks_by_priority?.medium || 0}</Text>
                      <Text style={styles.priorityLabel}>Orta</Text>
                    </View>
                    <View style={styles.priorityItem}>
                      <View style={[styles.priorityIcon, { backgroundColor: '#22c55e20' }]}>
                        <Ionicons name="arrow-down-circle" size={20} color="#22c55e" />
                      </View>
                      <Text style={styles.priorityValue}>{stats?.tasks_by_priority?.low || 0}</Text>
                      <Text style={styles.priorityLabel}>Düşük</Text>
                    </View>
                  </View>
                </Animated.View>
              </>
            ) : (
              <>
                {/* Schedule View */}
                <Animated.View style={[styles.scheduleSection, { opacity: fadeAnim }]}>
                  {/* Calendar Header */}
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>
                      {format(selectedDate, 'd MMMM', { locale: tr })}
                    </Text>
                    <TouchableOpacity style={styles.calendarEdit}>
                      <Ionicons name="pencil-outline" size={18} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Week Days */}
                  <View style={styles.weekDays}>
                    {weekDays.map((day, index) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedDate(day);
                          }}
                        >
                          <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                            {format(day, 'EEE', { locale: tr }).slice(0, 2).toUpperCase()}
                          </Text>
                          {isSelected ? (
                            <LinearGradient colors={theme.colors.gradients.primary} style={styles.dayNumberGradient}>
                              <Text style={styles.dayNumberSelected}>{format(day, 'd')}</Text>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.dayNumberContainer, isTodayDate && styles.dayNumberToday]}>
                              <Text style={[styles.dayNumber, isTodayDate && styles.dayNumberTodayText]}>
                                {format(day, 'd')}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Timeline */}
                <View style={styles.timelineSection}>
                  <View style={styles.timelineContainer}>
                    {HOURS.map((hour, hourIndex) => {
                      const hourTasks = todayTasks.filter((_, i) => i % 10 === hourIndex).slice(0, 1);
                      return (
                        <View key={hour} style={styles.timelineRow}>
                          <View style={styles.timelineTime}>
                            <Text style={styles.timelineHour}>{hour.toString().padStart(2, '0')}</Text>
                            <Text style={styles.timelineMinute}>:00</Text>
                          </View>
                          <View style={styles.timelineLine}>
                            <View style={styles.timelineDot} />
                            {hourTasks.length > 0 ? (
                              hourTasks.map((task) => (
                                <TouchableOpacity
                                  key={task._id}
                                  style={styles.timelineTask}
                                  onPress={() => router.push(`/task-detail?id=${task._id}`)}
                                >
                                  <View style={styles.timelineTaskCard}>
                                    <View style={[styles.timelineTaskBar, { backgroundColor: getPriorityColor(task.priority) }]} />
                                    <View style={styles.timelineTaskContent}>
                                      <Text style={styles.timelineTaskTitle} numberOfLines={1}>{task.title}</Text>
                                      <Text style={styles.timelineTaskTime}>{hour}:00 - {hour + 1}:00</Text>
                                    </View>
                                    <View style={styles.timelineTaskAvatars}>
                                      <View style={styles.timelineAvatar}>
                                        <LinearGradient colors={theme.colors.gradients.primary} style={styles.timelineAvatarGradient}>
                                          <Text style={styles.timelineAvatarText}>
                                            {user?.full_name?.charAt(0) || 'U'}
                                          </Text>
                                        </LinearGradient>
                                      </View>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <View style={styles.timelineEmpty} />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Today's Summary */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                  <View style={styles.todaySummary}>
                    <View style={styles.summaryItem}>
                      <View style={[styles.summaryIcon, { backgroundColor: '#3b82f620' }]}>
                        <Ionicons name="list" size={20} color="#3b82f6" />
                      </View>
                      <View style={styles.summaryInfo}>
                        <Text style={styles.summaryValue}>{todayTasks.length}</Text>
                        <Text style={styles.summaryLabel}>Bugünün Görevleri</Text>
                      </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <View style={[styles.summaryIcon, { backgroundColor: '#22c55e20' }]}>
                        <Ionicons name="checkmark-done" size={20} color="#22c55e" />
                      </View>
                      <View style={styles.summaryInfo}>
                        <Text style={styles.summaryValue}>
                          {todayTasks.filter(t => t.status === 'done').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Tamamlanan</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </>
            )}

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
  scrollView: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  logoText: {
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.accent.primary,
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: 24,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  outlineButtonText: {
    color: theme.colors.text.secondary,
  },
  secondaryButton: {
    flex: 1,
  },
  secondaryButtonInner: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  secondaryButtonActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  secondaryButtonTextActive: {
    color: theme.colors.text.primary,
  },

  // Progress Section
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.accent.primary,
    fontWeight: '500',
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircleContainer: {
    width: 100,
    height: 100,
    marginRight: 24,
    position: 'relative',
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: theme.colors.accent.primary,
  },
  progressCircleInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  progressArc: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  progressCircleShadow: {
    position: 'absolute',
    bottom: -5,
    left: 10,
    width: 80,
    height: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 40,
    transform: [{ scaleX: 1.2 }],
  },
  progressStats: {
    flex: 1,
    gap: 16,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressStatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressStatInfo: {
    flex: 1,
  },
  progressStatLabel: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'flex-start',
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Projects Scroll
  projectsScroll: {
    paddingRight: 20,
  },
  projectCard: {
    width: 200,
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  projectColorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  projectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  projectProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  projectProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectMetaText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyProjectCard: {
    width: 200,
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 24,
    marginLeft: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  emptyProjectText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 8,
  },

  // Tasks List
  tasksList: {
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskPriorityBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskProject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskProjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskProjectName: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  taskDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDeadlineText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyTasksList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  emptyTasksText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 12,
  },

  // Priority Grid
  priorityGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  priorityItem: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  priorityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },

  // Schedule Section
  scheduleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  calendarEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
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
    fontSize: 12,
    color: theme.colors.text.muted,
    marginBottom: 8,
    fontWeight: '500',
  },
  dayNameSelected: {
    color: theme.colors.text.primary,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  dayNumberTodayText: {
    color: theme.colors.accent.primary,
  },
  dayNumberGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Timeline Section
  timelineSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timelineContainer: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineTime: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  timelineHour: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  timelineMinute: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  timelineLine: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border.light,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  timelineDot: {
    position: 'absolute',
    left: -4,
    top: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.border.medium,
  },
  timelineTask: {
    marginTop: -4,
  },
  timelineTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  timelineTaskBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  timelineTaskContent: {
    flex: 1,
  },
  timelineTaskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  timelineTaskTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  timelineTaskAvatars: {
    flexDirection: 'row',
  },
  timelineAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  timelineAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  timelineEmpty: {
    height: 8,
  },

  // Today's Summary
  todaySummary: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {},
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: 16,
  },

  // Loading & Empty States
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
    borderRadius: 16,
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
