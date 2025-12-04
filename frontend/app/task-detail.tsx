import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { theme, getStatusColor, getStatusBackground, getPriorityColor, getPriorityBackground } from '../theme';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Task {
  _id: string;
  title: string;
  description?: string;
  project_id: string;
  status: string;
  priority: string;
  assigned_to?: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  _id: string;
  content: string;
  user_name: string;
  user_id: string;
  created_at: string;
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const statusOptions = [
    { value: 'todo', label: 'Yapılacak', icon: 'ellipse-outline' },
    { value: 'in_progress', label: 'Devam Ediyor', icon: 'play-circle-outline' },
    { value: 'done', label: 'Tamamlandı', icon: 'checkmark-circle-outline' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Düşük', icon: 'arrow-down' },
    { value: 'medium', label: 'Orta', icon: 'remove' },
    { value: 'high', label: 'Yüksek', icon: 'arrow-up' },
    { value: 'urgent', label: 'Acil', icon: 'alert-circle' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
    fetchTask();
    fetchComments();
  }, [id]);

  const fetchTask = async () => {
    try {
      // Görev detayları için project'tan alıyoruz
      const response = await axios.get(`${API_URL}/tasks?project_id=${id}`);
      if (response.data.length > 0) {
        setTask(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments?task_id=${id}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!task) return;
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/tasks/${task._id}`, {
        ...task,
        status: newStatus,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTask({ ...task, status: newStatus });
      setShowStatusModal(false);
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!task) return;
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/tasks/${task._id}`, {
        ...task,
        priority: newPriority,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTask({ ...task, priority: newPriority });
      setShowPriorityModal(false);
    } catch (error) {
      Alert.alert('Hata', 'Öncelik güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      const response = await axios.post(`${API_URL}/comments`, {
        content: newComment,
        task_id: task._id,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Hata', 'Yorum eklenemedi');
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/tasks/${task?._id}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert('Hata', 'Görev silinemedi');
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const getPriorityLabel = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.label || priority;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Görev bulunamadı</Text>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
              >
                <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Görev Detayı</Text>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleDeleteTask}
              >
                <Ionicons name="trash-outline" size={22} color={theme.colors.accent.error} />
              </TouchableOpacity>
            </Animated.View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Task Title */}
              <Animated.View style={[styles.titleSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}
              </Animated.View>

              {/* Status & Priority */}
              <Animated.View style={[styles.badgesRow, { opacity: fadeAnim }]}>
                <TouchableOpacity
                  style={[styles.badge, { backgroundColor: getStatusBackground(task.status) }]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <View style={[styles.badgeDot, { backgroundColor: getStatusColor(task.status) }]} />
                  <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                    {getStatusLabel(task.status)}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={getStatusColor(task.status)} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.badge, { backgroundColor: getPriorityBackground(task.priority) }]}
                  onPress={() => setShowPriorityModal(true)}
                >
                  <View style={[styles.badgeDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                    {getPriorityLabel(task.priority)}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={getPriorityColor(task.priority)} />
                </TouchableOpacity>
              </Animated.View>

              {/* Details */}
              <Animated.View style={[styles.detailsSection, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Detaylar</Text>
                <View style={styles.detailsCard}>
                  {task.deadline && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.accent.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Son Tarih</Text>
                        <Text style={styles.detailValue}>
                          {format(new Date(task.deadline), 'd MMMM yyyy', { locale: tr })}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="time-outline" size={20} color={theme.colors.accent.secondary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Oluşturulma</Text>
                      <Text style={styles.detailValue}>
                        {format(new Date(task.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="refresh-outline" size={20} color={theme.colors.accent.success} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Son Güncelleme</Text>
                      <Text style={styles.detailValue}>
                        {format(new Date(task.updated_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Comments */}
              <Animated.View style={[styles.commentsSection, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Yorumlar ({comments.length})</Text>

                {/* Add Comment */}
                <View style={styles.addCommentContainer}>
                  <View style={styles.commentInputWrapper}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Yorum ekle..."
                      placeholderTextColor={theme.colors.text.muted}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                      onPress={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Ionicons
                        name="send"
                        size={18}
                        color={newComment.trim() ? theme.colors.accent.primary : theme.colors.text.muted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Comment List */}
                {comments.map((comment) => (
                  <View key={comment._id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAvatar}>
                        <LinearGradient colors={theme.colors.gradients.secondary} style={styles.commentAvatarGradient}>
                          <Text style={styles.commentAvatarText}>
                            {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{comment.user_name}</Text>
                        <Text style={styles.commentTime}>
                          {format(new Date(comment.created_at), 'd MMM, HH:mm', { locale: tr })}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))}

                {comments.length === 0 && (
                  <View style={styles.noComments}>
                    <Ionicons name="chatbubble-outline" size={32} color={theme.colors.text.muted} />
                    <Text style={styles.noCommentsText}>Henüz yorum yok</Text>
                  </View>
                )}
              </Animated.View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Status Modal */}
          <Modal visible={showStatusModal} animationType="slide" transparent>
            <BlurView intensity={20} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Durumu Değiştir</Text>
                  <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      task.status === option.value && styles.optionItemActive,
                    ]}
                    onPress={() => handleUpdateStatus(option.value)}
                    disabled={updating}
                  >
                    <View style={[styles.optionDot, { backgroundColor: getStatusColor(option.value) }]} />
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {task.status === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Modal>

          {/* Priority Modal */}
          <Modal visible={showPriorityModal} animationType="slide" transparent>
            <BlurView intensity={20} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Önceliği Değiştir</Text>
                  <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      task.priority === option.value && styles.optionItemActive,
                    ]}
                    onPress={() => handleUpdatePriority(option.value)}
                    disabled={updating}
                  >
                    <View style={[styles.optionDot, { backgroundColor: getPriorityColor(option.value) }]} />
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {task.priority === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.cardSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent.error + '30',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  titleSection: {
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 32,
  },
  taskDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  commentsSection: {
    marginBottom: 24,
  },
  addCommentContainer: {
    marginBottom: 16,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.background.elevated,
  },
  commentCard: {
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    marginRight: 10,
  },
  commentAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  commentTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  commentContent: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.cardSolid,
    borderTopLeftRadius: theme.borderRadius.xxxl,
    borderTopRightRadius: theme.borderRadius.xxxl,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 8,
    backgroundColor: theme.colors.background.elevated,
  },
  optionItemActive: {
    backgroundColor: theme.colors.accent.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary + '30',
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});
