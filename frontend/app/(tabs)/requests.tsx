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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Request {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  category: string;
  status: string;
  created_at: string;
}

export default function Requests() {
  const { currentWorkspace } = useWorkspaceStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

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

  const fetchRequests = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/requests?workspace_id=${currentWorkspace._id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Keep existing data or set empty array
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchRequests();
  }, [currentWorkspace]);

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Lütfen başlık girin');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/requests`, {
        ...newRequest,
        workspace_id: currentWorkspace?._id,
      });
      setRequests([response.data, ...requests]);
      setModalVisible(false);
      setNewRequest({ title: '', description: '', priority: 'medium', category: 'general' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Talep oluşturulamadı');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.priority.high;
      case 'medium': return theme.colors.priority.medium;
      case 'low': return theme.colors.priority.low;
      default: return theme.colors.text.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.accent.warning;
      case 'in_progress': return theme.colors.accent.primary;
      case 'completed': return theme.colors.accent.success;
      case 'rejected': return theme.colors.accent.error;
      default: return theme.colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'İşlemde';
      case 'completed': return 'Tamamlandı';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const filters = [
    { key: 'all', label: 'Tümü' },
    { key: 'pending', label: 'Bekliyor' },
    { key: 'in_progress', label: 'İşlemde' },
    { key: 'completed', label: 'Tamamlandı' },
  ];

  const filteredRequests = requests.filter((request) =>
    selectedFilter === 'all' || request.status === selectedFilter
  );

  if (!currentWorkspace) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyIconGradient}>
                  <Ionicons name="document-text-outline" size={48} color={theme.colors.text.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Çalışma Alanı Seçilmedi</Text>
              <Text style={styles.emptySubtitle}>Talepleri görmek için bir çalışma alanı seçin</Text>
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
            <Text style={styles.headerTitle}>Talepler</Text>
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

          {/* Stats */}
          <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{requests.filter(r => r.status === 'pending').length}</Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
              <View style={[styles.statIndicator, { backgroundColor: theme.colors.accent.warning }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{requests.filter(r => r.status === 'in_progress').length}</Text>
              <Text style={styles.statLabel}>İşlemde</Text>
              <View style={[styles.statIndicator, { backgroundColor: theme.colors.accent.primary }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{requests.filter(r => r.status === 'completed').length}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
              <View style={[styles.statIndicator, { backgroundColor: theme.colors.accent.success }]} />
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
              <View style={styles.loadingContainer}>
                <Animated.View style={styles.loadingSpinner}>
                  <LinearGradient colors={theme.colors.gradients.primary} style={styles.loadingGradient} />
                </Animated.View>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.text.muted} />
                <Text style={styles.emptyListTitle}>Talep Bulunamadı</Text>
                <Text style={styles.emptyListSubtitle}>Yeni talep oluşturmak için + butonuna tıklayın</Text>
                <TouchableOpacity
                  style={styles.emptyListButton}
                  onPress={() => setModalVisible(true)}
                >
                  <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyListButtonGradient}>
                    <Text style={styles.emptyListButtonText}>Talep Oluştur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.requestsContainer}>
                {filteredRequests.map((request, index) => (
                  <Animated.View
                    key={request._id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 5],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.requestCard}
                      activeOpacity={0.8}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                      <View style={styles.requestHeader}>
                        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(request.priority) }]} />
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestTitle} numberOfLines={2}>{request.title}</Text>
                          <View style={styles.requestMeta}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryText}>
                                {request.category === 'general' ? 'Genel' :
                                  request.category === 'technical' ? 'Teknik' :
                                  request.category === 'support' ? 'Destek' : 'Özellik'}
                              </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                              <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
                              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                                {getStatusLabel(request.status)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity style={styles.requestMenu}>
                          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                      </View>

                      {request.description && (
                        <Text style={styles.requestDescription} numberOfLines={2}>
                          {request.description}
                        </Text>
                      )}

                      <View style={styles.requestFooter}>
                        <View style={styles.dateContainer}>
                          <Ionicons name="time-outline" size={14} color={theme.colors.text.muted} />
                          <Text style={styles.dateText}>
                            {format(new Date(request.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                          </Text>
                        </View>
                        <View style={styles.priorityBadge}>
                          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(request.priority) }]} />
                          <Text style={styles.priorityText}>
                            {request.priority === 'high' ? 'Yüksek' : request.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Text>
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
                  <Text style={styles.modalTitle}>Yeni Talep</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.inputLabel}>Başlık</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Talep başlığı"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newRequest.title}
                    onChangeText={(text) => setNewRequest({ ...newRequest, title: text })}
                  />

                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea]}
                    placeholder="Talep açıklaması (opsiyonel)"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newRequest.description}
                    onChangeText={(text) => setNewRequest({ ...newRequest, description: text })}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={styles.inputLabel}>Öncelik</Text>
                  <View style={styles.optionsContainer}>
                    {[
                      { key: 'low', label: 'Düşük', color: theme.colors.priority.low },
                      { key: 'medium', label: 'Orta', color: theme.colors.priority.medium },
                      { key: 'high', label: 'Yüksek', color: theme.colors.priority.high },
                    ].map((priority) => (
                      <TouchableOpacity
                        key={priority.key}
                        style={[
                          styles.optionChip,
                          newRequest.priority === priority.key && { borderColor: priority.color, backgroundColor: priority.color + '15' },
                        ]}
                        onPress={() => setNewRequest({ ...newRequest, priority: priority.key })}
                      >
                        <View style={[styles.optionDot, { backgroundColor: priority.color }]} />
                        <Text
                          style={[
                            styles.optionText,
                            newRequest.priority === priority.key && { color: priority.color },
                          ]}
                        >
                          {priority.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Kategori</Text>
                  <View style={styles.optionsContainer}>
                    {[
                      { key: 'general', label: 'Genel' },
                      { key: 'technical', label: 'Teknik' },
                      { key: 'support', label: 'Destek' },
                      { key: 'feature', label: 'Özellik' },
                    ].map((category) => (
                      <TouchableOpacity
                        key={category.key}
                        style={[
                          styles.optionChip,
                          newRequest.category === category.key && styles.optionChipActive,
                        ]}
                        onPress={() => setNewRequest({ ...newRequest, category: category.key })}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            newRequest.category === category.key && styles.optionTextActive,
                          ]}
                        >
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.createButton} onPress={handleCreateRequest}>
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.createButtonGradient}>
                      <Text style={styles.createButtonText}>Talep Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={{ height: 40 }} />
                </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    position: 'relative',
    overflow: 'hidden',
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
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
  requestsContainer: {
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    minHeight: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 22,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.background.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestMenu: {
    padding: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    color: theme.colors.text.muted,
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
    gap: 6,
  },
  optionChipActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + '15',
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  optionTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: 8,
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
