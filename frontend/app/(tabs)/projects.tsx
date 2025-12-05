import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import LottieView from 'lottie-react-native';
import { SkeletonListLoader } from '../../components/SkeletonLoader';
import { useDebounce } from '../../hooks/useDebounce';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  assigned_to: string[];
  created_at: string;
  tasks_count?: number;
  completed_tasks?: number;
}

export default function Projects() {
  const { currentWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'not_started' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const fetchProjects = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/projects?workspace_id=${currentWorkspace._id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchProjects();
  }, [currentWorkspace]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Lütfen proje adı girin');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/projects`, {
        ...newProject,
        workspace_id: currentWorkspace?._id,
        assigned_to: [],
      });
      setProjects([response.data, ...projects]);
      setModalVisible(false);
      setNewProject({ name: '', description: '', status: 'not_started' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Proje oluşturulamadı');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return theme.colors.text.muted;
      case 'in_progress': return theme.colors.accent.primary;
      case 'completed': return theme.colors.accent.success;
      default: return theme.colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Başlamadı';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || project.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'Tümü' },
    { key: 'in_progress', label: 'Aktif' },
    { key: 'not_started', label: 'Bekliyor' },
    { key: 'completed', label: 'Tamamlandı' },
  ];

  if (!currentWorkspace) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyIconGradient}>
                  <Ionicons name="folder-outline" size={48} color={theme.colors.text.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Çalışma Alanı Seçilmedi</Text>
              <Text style={styles.emptySubtitle}>Projeleri görmek için bir çalışma alanı seçin</Text>
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
            <Text style={styles.headerTitle}>Projeler</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(true);
              }}
            >
              <LinearGradient colors={theme.colors.gradients.primary} style={styles.addButtonGradient}>
                <Ionicons name="add" size={24} color={theme.colors.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Search */}
          <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color={theme.colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Proje ara..."
                placeholderTextColor={theme.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Filters */}
          <Animated.View style={[styles.filtersContainer, { opacity: fadeAnim }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFilter(filter.key);
                  }}
                >
                  <Text style={[styles.filterChipText, selectedFilter === filter.key && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} />
            }
          >
            {loading ? (
              <SkeletonListLoader count={4} type="card" />
            ) : filteredProjects.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <LottieView
                  source={require('../../assets/animations/empty.json')}
                  autoPlay
                  loop
                  style={{ width: 120, height: 120 }}
                />
                <Text style={styles.emptyListTitle}>Proje Bulunamadı</Text>
                <Text style={styles.emptyListSubtitle}>
                  {searchQuery ? 'Arama kriterlerinize uygun proje yok' : 'İlk projenizi oluşturun'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyListButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyListButtonGradient}>
                      <Text style={styles.emptyListButtonText}>Proje Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.projectsContainer}>
                {filteredProjects.map((project, index) => (
                  <Animated.View
                    key={project._id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 10],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.projectCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: '/project-detail',
                          params: { id: project._id },
                        });
                      }}
                    >
                      <View style={styles.projectHeader}>
                        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(project.status) }]} />
                        <View style={styles.projectInfo}>
                          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                          <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
                            <Text style={styles.statusText}>{getStatusLabel(project.status)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity style={styles.projectMenu}>
                          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                      </View>

                      {project.description && (
                        <Text style={styles.projectDescription} numberOfLines={2}>
                          {project.description}
                        </Text>
                      )}

                      <View style={styles.projectFooter}>
                        <View style={styles.projectMeta}>
                          <Ionicons name="calendar-outline" size={14} color={theme.colors.text.muted} />
                          <Text style={styles.projectDate}>
                            {format(new Date(project.created_at), 'd MMM yyyy', { locale: tr })}
                          </Text>
                        </View>

                        <View style={styles.avatarStack}>
                          {[0, 1, 2].slice(0, Math.min(3, project.assigned_to?.length || 3)).map((i) => (
                            <View key={i} style={[styles.miniAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                              <LinearGradient
                                colors={i === 0 ? theme.colors.gradients.primary : i === 1 ? theme.colors.gradients.secondary : theme.colors.gradients.warning}
                                style={styles.miniAvatarGradient}
                              />
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Progress */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                          <Text style={styles.progressLabel}>İlerleme</Text>
                          <Text style={styles.progressValue}>
                            {project.completed_tasks || 0}/{project.tasks_count || 0}
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <LinearGradient
                            colors={theme.colors.gradients.primary}
                            style={[
                              styles.progressFill,
                              {
                                width: `${project.tasks_count ? ((project.completed_tasks || 0) / project.tasks_count) * 100 : 0}%`,
                              },
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Create Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Yeni Proje</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.inputLabel}>Proje Adı</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Proje adını girin"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newProject.name}
                    onChangeText={(text) => setNewProject({ ...newProject, name: text })}
                  />

                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea]}
                    placeholder="Proje açıklaması (opsiyonel)"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newProject.description}
                    onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={styles.inputLabel}>Durum</Text>
                  <View style={styles.statusOptions}>
                    {[
                      { key: 'not_started', label: 'Başlamadı' },
                      { key: 'in_progress', label: 'Devam Ediyor' },
                      { key: 'completed', label: 'Tamamlandı' },
                    ].map((status) => (
                      <TouchableOpacity
                        key={status.key}
                        style={[
                          styles.statusOption,
                          newProject.status === status.key && styles.statusOptionActive,
                        ]}
                        onPress={() => setNewProject({ ...newProject, status: status.key })}
                      >
                        <View style={[styles.statusOptionDot, { backgroundColor: getStatusColor(status.key) }]} />
                        <Text
                          style={[
                            styles.statusOptionText,
                            newProject.status === status.key && styles.statusOptionTextActive,
                          ]}
                        >
                          {status.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateProject}
                  >
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.createButtonGradient}>
                      <Text style={styles.createButtonText}>Proje Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  addButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.text.primary,
    borderColor: theme.colors.text.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  projectsContainer: {
    paddingHorizontal: 20,
  },
  projectCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  projectMenu: {
    padding: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectDate: {
    fontSize: 13,
    color: theme.colors.text.muted,
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
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyListSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyListButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  emptyListButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyListButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.card,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
    gap: 6,
  },
  statusOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + '10',
  },
  statusOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  statusOptionTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  createButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
