import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { format } from 'date-fns';
import { ModernCard } from '../../components/ModernCard';
import { TimelineItem } from '../../components/TimelineItem';
import { ChipButton } from '../../components/ChipButton';
import { TeamMemberCard } from '../../components/TeamMemberCard';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { GradientButton } from '../../components/GradientButton';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  assigned_to: string[];
  created_at: string;
}

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`),
        axios.get(`${API_URL}/tasks?project_id=${id}`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/tasks`, {
        ...newTask,
        project_id: id,
        status: 'todo',
      });
      setTasks([response.data, ...tasks]);
      setModalVisible(false);
      setNewTask({ title: '', description: '', priority: 'medium' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return { label: 'Başlamadı', color: '#6b7280', icon: 'time-outline' as const };
      case 'in_progress':
        return { label: 'Devam Ediyor', color: '#3b82f6', icon: 'rocket-outline' as const };
      case 'completed':
        return { label: 'Tamamlandı', color: '#10b981', icon: 'checkmark-circle' as const };
      default:
        return { label: status, color: '#6b7280', icon: 'help-circle' as const };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <LoadingAnimation />
            <Text style={styles.loadingText}>Proje yükleniyor...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!project) {
    return null;
  }

  const statusConfig = getStatusConfig(project.status);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name=\"arrow-back\" size={24} color=\"#111827\" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proje Detayları</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name=\"ellipsis-vertical\" size={24} color=\"#111827\" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Project Info Card */}
          <ModernCard style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <View style={styles.projectIcon}>
                <LinearGradient
                  colors={[statusConfig.color, statusConfig.color + 'dd']}
                  style={styles.iconGradient}
                >
                  <Ionicons name={statusConfig.icon} size={24} color=\"#ffffff\" />
                </LinearGradient>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <Text style={styles.projectName}>{project.name}</Text>
            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}

            <View style={styles.projectMeta}>
              {project.deadline && (
                <View style={styles.metaItem}>
                  <Ionicons name=\"calendar-outline\" size={16} color=\"#6b7280\" />
                  <Text style={styles.metaText}>
                    {format(new Date(project.deadline), 'dd MMM yyyy')}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name=\"people-outline\" size={16} color=\"#6b7280\" />
                <Text style={styles.metaText}>{project.assigned_to.length} kişi</Text>
              </View>
            </View>
          </ModernCard>

          {/* Tabs */}
          <View style={styles.tabs}>
            <ChipButton
              label=\"Görevler\"
              selected={activeTab === 'tasks'}
              onPress={() => setActiveTab('tasks')}
            />
            <ChipButton
              label=\"Aktivite\"
              selected={activeTab === 'activity'}
              onPress={() => setActiveTab('activity')}
            />
            <ChipButton
              label=\"Dosyalar\"
              selected={activeTab === 'files'}
              onPress={() => setActiveTab('files')}
            />
          </View>

          {/* Tasks Tab */}
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
                  <Ionicons name=\"add-circle\" size={24} color=\"#3b82f6\" />
                </TouchableOpacity>
              </View>

              {tasks.map((task) => (
                <ModernCard key={task._id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) + '20' },
                      ]}
                    >
                      <View
                        style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]}
                      />
                    </View>
                  </View>
                  <View style={styles.taskFooter}>
                    <Text style={styles.taskDate}>
                      {format(new Date(task.created_at), 'dd MMM')}
                    </Text>
                    <ChipButton
                      label={task.status === 'todo' ? 'Yapılacak' : task.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'}
                      selected={false}
                      onPress={() => {}}
                      style={styles.taskStatus}
                    />
                  </View>
                </ModernCard>
              ))}
            </View>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Aktivite Geçmişi</Text>
              <View style={styles.timeline}>
                <TimelineItem
                  icon=\"add-circle\"
                  title=\"Proje Oluşturuldu\"
                  description=\"Proje başlatıldı ve takım üyeleri atandı\"
                  time={new Date(project.created_at)}
                  color=\"#3b82f6\"
                />
                {tasks.length > 0 && (
                  <TimelineItem
                    icon=\"checkbox\"
                    title={`${tasks.length} Görev Eklendi`}
                    description=\"Yeni görevler projeye eklendi\"
                    time={new Date(tasks[0].created_at)}
                    color=\"#10b981\"
                  />
                )}
                <TimelineItem
                  icon=\"people\"
                  title=\"Takım Atandı\"
                  description={`${project.assigned_to.length} kişi projeye atandı`}
                  time={new Date(project.created_at)}
                  color=\"#f59e0b\"
                  isLast
                />
              </View>
            </View>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Dosyalar</Text>
              <ModernCard>
                <View style={styles.emptyState}>
                  <Ionicons name=\"document-outline\" size={48} color=\"#9ca3af\" />
                  <Text style={styles.emptyText}>Henüz dosya eklenmedi</Text>
                  <TouchableOpacity style={styles.uploadButton}>
                    <Text style={styles.uploadButtonText}>Dosya Yükle</Text>
                  </TouchableOpacity>
                </View>
              </ModernCard>
            </View>
          )}
        </ScrollView>

        {/* Create Task Modal */}
        <Modal visible={modalVisible} animationType=\"slide\" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Görev Ekle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name=\"close\" size={24} color=\"#111827\" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder=\"Görev başlığı\"
                placeholderTextColor=\"#9ca3af\"
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder=\"Açıklama (opsiyonel)\"
                placeholderTextColor=\"#9ca3af\"
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Öncelik</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <ChipButton
                    key={priority}
                    label={priority === 'low' ? 'Düşük' : priority === 'medium' ? 'Orta' : 'Yüksek'}
                    selected={newTask.priority === priority}
                    onPress={() => setNewTask({ ...newTask, priority })}
                    color={getPriorityColor(priority)}
                  />
                ))}
              </View>

              <GradientButton onPress={handleCreateTask} title=\"Görev Oluştur\" />
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradient: {
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
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  moreButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  projectCard: {
    backgroundColor: '#ffffff',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectIcon: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconGradient: {
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
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabContent: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  taskStatus: {
    marginLeft: 8,
  },
  timeline: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
});