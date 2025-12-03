import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { SwipeableCard } from '../components/SwipeableCard';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  deadline?: string;
  created_at: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
  deadline?: string;
  team?: TeamMember[];
  created_at: string;
}

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProjectData();
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslate, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`),
        axios.get(`${API_URL}/tasks?project_id=${id}`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);

      // Animate progress bar
      const progress = projectRes.data.progress || 0;
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('Error:', error);
      // Demo data
      const demoProject = {
        _id: id as string,
        name: 'AICO Mobil Uygulama',
        description: 'Modern ve kullanıcı dostu bir proje yönetim uygulaması geliştiriyoruz. React Native ve Expo kullanılarak cross-platform destek sağlanıyor.',
        status: 'in_progress',
        progress: 68,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        team: [
          { _id: '1', name: 'Ahmet Yılmaz', role: 'Proje Yöneticisi' },
          { _id: '2', name: 'Zeynep Kaya', role: 'Frontend Geliştirici' },
          { _id: '3', name: 'Mehmet Demir', role: 'Backend Geliştirici' },
        ],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const demoTasks = [
        { _id: '1', title: 'Dashboard tasarımı', status: 'completed', priority: 'high', created_at: new Date().toISOString() },
        { _id: '2', title: 'API entegrasyonu', status: 'in_progress', priority: 'high', created_at: new Date().toISOString() },
        { _id: '3', title: 'Kullanıcı ayarları', status: 'todo', priority: 'medium', created_at: new Date().toISOString() },
        { _id: '4', title: 'Bildirim sistemi', status: 'todo', priority: 'low', created_at: new Date().toISOString() },
      ];
      setProject(demoProject);
      setTasks(demoTasks);

      Animated.timing(progressAnimation, {
        toValue: demoProject.progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Hata', 'Başlık girin');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/tasks`, {
        ...newTask,
        project_id: id,
        status: 'todo',
      });
      setTasks([response.data, ...tasks]);
    } catch (error) {
      // Add demo task
      const demoTask = {
        _id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        status: 'todo',
        priority: newTask.priority,
        created_at: new Date().toISOString(),
      };
      setTasks([demoTask, ...tasks]);
    }

    setModalVisible(false);
    setNewTask({ title: '', description: '', priority: 'medium' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteTask = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
    } catch (error) {
      console.error('Error:', error);
    }
    setTasks(tasks.filter(t => t._id !== taskId));
  };

  const handleCompleteTask = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'completed' });
    } catch (error) {
      console.error('Error:', error);
    }
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'completed' } : t));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return { label: 'Başlamadı', color: theme.colors.text.muted, icon: 'time-outline' as const };
      case 'in_progress':
        return { label: 'Devam Ediyor', color: theme.colors.accent.primary, icon: 'rocket-outline' as const };
      case 'completed':
        return { label: 'Tamamlandı', color: theme.colors.accent.success, icon: 'checkmark-circle' as const };
      case 'on_hold':
        return { label: 'Beklemede', color: theme.colors.accent.warning, icon: 'pause-circle' as const };
      default:
        return { label: status, color: theme.colors.text.muted, icon: 'help-circle' as const };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high': return { label: 'Yüksek', color: theme.colors.priority.high };
      case 'medium': return { label: 'Orta', color: theme.colors.priority.medium };
      case 'low': return { label: 'Düşük', color: theme.colors.priority.low };
      default: return { label: priority, color: theme.colors.text.muted };
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.accent.success;
      case 'in_progress': return theme.colors.accent.primary;
      default: return theme.colors.text.muted;
    }
  };

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;

  // Skeleton loader
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonStats} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderSkeleton()}
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!project) return null;

  const statusConfig = getStatusConfig(project.status);
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: 'grid-outline' },
    { id: 'tasks', label: 'Görevler', icon: 'checkbox-outline' },
    { id: 'team', label: 'Takım', icon: 'people-outline' },
    { id: 'activity', label: 'Aktivite', icon: 'time-outline' },
  ];

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

            <Text style={styles.headerTitle}>Proje Detayı</Text>

            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Project Header Card */}
            <Animated.View style={[styles.projectCard, { opacity: headerOpacity, transform: [{ translateY: contentTranslate }] }]}>
              <LinearGradient
                colors={[statusConfig.color + '30', statusConfig.color + '10']}
                style={styles.projectCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectIconContainer}>
                    <LinearGradient
                      colors={[statusConfig.color, statusConfig.color + 'cc']}
                      style={styles.projectIcon}
                    >
                      <Ionicons name="folder" size={28} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '30' }]}>
                    <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projectName}>{project.name}</Text>
                {project.description && (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                )}

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>İlerleme</Text>
                    <Text style={styles.progressValue}>{project.progress || 0}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
                      <LinearGradient
                        colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressGradient}
                      />
                    </Animated.View>
                  </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{completedTasks}</Text>
                    <Text style={styles.quickStatLabel}>Tamamlanan</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{inProgressTasks}</Text>
                    <Text style={styles.quickStatLabel}>Devam Eden</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{todoTasks}</Text>
                    <Text style={styles.quickStatLabel}>Yapılacak</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab.id);
                    }}
                  >
                    <Ionicons
                      name={tab.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={activeTab === tab.id ? theme.colors.accent.primary : theme.colors.text.muted}
                    />
                    <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Deadline Card */}
                {project.deadline && (
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.accent.warning + '20' }]}>
                        <Ionicons name="calendar" size={20} color={theme.colors.accent.warning} />
                      </View>
                      <View>
                        <Text style={styles.infoCardLabel}>Son Tarih</Text>
                        <Text style={styles.infoCardValue}>
                          {format(new Date(project.deadline), 'd MMMM yyyy', { locale: tr })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Created Date */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.accent.primary + '20' }]}>
                      <Ionicons name="time" size={20} color={theme.colors.accent.primary} />
                    </View>
                    <View>
                      <Text style={styles.infoCardLabel}>Oluşturulma Tarihi</Text>
                      <Text style={styles.infoCardValue}>
                        {format(new Date(project.created_at), 'd MMMM yyyy', { locale: tr })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recent Tasks Preview */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Son Görevler</Text>
                  <TouchableOpacity onPress={() => setActiveTab('tasks')}>
                    <Text style={styles.seeAllText}>Tümünü Gör</Text>
                  </TouchableOpacity>
                </View>

                {tasks.slice(0, 3).map((task) => (
                  <View key={task._id} style={styles.taskPreviewCard}>
                    <View style={[styles.taskStatusIndicator, { backgroundColor: getTaskStatusColor(task.status) }]} />
                    <View style={styles.taskPreviewContent}>
                      <Text style={styles.taskPreviewTitle} numberOfLines={1}>{task.title}</Text>
                      <View style={styles.taskPreviewMeta}>
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityConfig(task.priority).color }]} />
                        <Text style={styles.taskPreviewPriority}>{getPriorityConfig(task.priority).label}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.text.muted} />
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'tasks' && (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Görevler ({tasks.length})</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setModalVisible(true);
                    }}
                    style={styles.addButton}
                  >
                    <LinearGradient
                      colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
                      style={styles.addButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {tasks.map((task) => (
                  <SwipeableCard
                    key={task._id}
                    onDelete={() => handleDeleteTask(task._id)}
                    onComplete={task.status !== 'completed' ? () => handleCompleteTask(task._id) : undefined}
                    leftActionIcon={task.status === 'completed' ? 'refresh' : 'checkmark-circle'}
                  >
                    <View style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <View style={[styles.taskStatusIndicator, { backgroundColor: getTaskStatusColor(task.status) }]} />
                        <View style={styles.taskContent}>
                          <Text
                            style={[
                              styles.taskTitle,
                              task.status === 'completed' && styles.taskTitleCompleted
                            ]}
                            numberOfLines={2}
                          >
                            {task.title}
                          </Text>
                          <View style={styles.taskMeta}>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityConfig(task.priority).color + '20' }]}>
                              <View style={[styles.priorityDot, { backgroundColor: getPriorityConfig(task.priority).color }]} />
                              <Text style={[styles.priorityText, { color: getPriorityConfig(task.priority).color }]}>
                                {getPriorityConfig(task.priority).label}
                              </Text>
                            </View>
                            <Text style={styles.taskDate}>
                              {format(new Date(task.created_at), 'd MMM', { locale: tr })}
                            </Text>
                          </View>
                        </View>
                        {task.status === 'completed' && (
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent.success} />
                        )}
                      </View>
                    </View>
                  </SwipeableCard>
                ))}

                {tasks.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="checkbox-outline" size={48} color={theme.colors.text.muted} />
                    <Text style={styles.emptyTitle}>Henüz görev yok</Text>
                    <Text style={styles.emptySubtitle}>Yeni görev eklemek için + butonuna tıklayın</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'team' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Takım Üyeleri</Text>

                {(project.team || []).map((member, index) => (
                  <View key={member._id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <LinearGradient
                        colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
                        style={styles.memberAvatarGradient}
                      >
                        <Text style={styles.memberInitial}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    <TouchableOpacity style={styles.memberAction}>
                      <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.muted} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addMemberButton}>
                  <View style={styles.addMemberIcon}>
                    <Ionicons name="person-add" size={20} color={theme.colors.accent.primary} />
                  </View>
                  <Text style={styles.addMemberText}>Üye Ekle</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'activity' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Aktivite Geçmişi</Text>

                <View style={styles.activityTimeline}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: theme.colors.accent.success }]} />
                    <View style={styles.activityLine} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Proje Oluşturuldu</Text>
                      <Text style={styles.activityDescription}>Proje başarıyla oluşturuldu</Text>
                      <Text style={styles.activityTime}>
                        {format(new Date(project.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                      </Text>
                    </View>
                  </View>

                  {completedTasks > 0 && (
                    <View style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: theme.colors.accent.primary }]} />
                      <View style={styles.activityLine} />
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{completedTasks} Görev Tamamlandı</Text>
                        <Text style={styles.activityDescription}>Görevler başarıyla tamamlandı</Text>
                        <Text style={styles.activityTime}>Son güncelleme</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: theme.colors.accent.secondary }]} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{tasks.length} Görev Eklendi</Text>
                      <Text style={styles.activityDescription}>Toplam görev sayısı</Text>
                      <Text style={styles.activityTime}>Güncel</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* New Task Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Yeni Görev</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Görev başlığı"
                  placeholderTextColor={theme.colors.text.muted}
                  value={newTask.title}
                  onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Açıklama (opsiyonel)"
                  placeholderTextColor={theme.colors.text.muted}
                  value={newTask.description}
                  onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.label}>Öncelik</Text>
                <View style={styles.priorityOptions}>
                  {(['low', 'medium', 'high'] as const).map((priority) => {
                    const config = getPriorityConfig(priority);
                    const isSelected = newTask.priority === priority;
                    return (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewTask({ ...newTask, priority });
                        }}
                      >
                        <View style={[styles.priorityOptionDot, { backgroundColor: config.color }]} />
                        <Text style={[styles.priorityOptionText, isSelected && { color: config.color }]}>
                          {config.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity onPress={handleCreateTask} style={styles.createButton}>
                  <LinearGradient
                    colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>Görev Oluştur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    borderColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  projectCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  projectCardGradient: {
    padding: 20,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectIconContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  projectName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  quickStatLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: 6,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.accent.primary + '20',
    borderColor: theme.colors.accent.primary + '50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  tabTextActive: {
    color: theme.colors.accent.primary,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  infoCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  taskPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskStatusIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  taskPreviewContent: {
    flex: 1,
  },
  taskPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  taskPreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  taskPreviewPriority: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  memberAvatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  memberAction: {
    padding: 8,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  addMemberIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addMemberText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  activityTimeline: {
    paddingLeft: 8,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  activityLine: {
    position: 'absolute',
    left: 5,
    top: 20,
    bottom: -16,
    width: 2,
    backgroundColor: theme.colors.border.light,
  },
  activityContent: {
    flex: 1,
    marginLeft: 16,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: 6,
  },
  priorityOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonHeader: {
    height: 40,
    width: '50%',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  skeletonCard: {
    height: 200,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 20,
  },
  skeletonStats: {
    height: 80,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
  },
});
