import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../theme';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner_id: string;
  member_ids: string[];
  created_at: string;
}

export default function Workspaces() {
  const { user } = useAuth();
  const { workspaces, currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

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
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get(`${API_URL}/workspaces`);
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      Alert.alert('Hata', 'Çalışma alanı adı gerekli');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/workspaces`, {
        name: newWorkspaceName,
        description: newWorkspaceDescription,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWorkspaces([...workspaces, response.data]);
      setCurrentWorkspace(response.data);
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      Alert.alert('Başarılı', 'Çalışma alanı oluşturuldu');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Çalışma alanı oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentWorkspace(workspace);
    router.back();
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedWorkspace) {
      Alert.alert('Hata', 'E-posta adresi gerekli');
      return;
    }
    setInviting(true);
    try {
      await axios.post(`${API_URL}/workspaces/${selectedWorkspace._id}/invite`, {
        email: inviteEmail,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowInviteModal(false);
      setInviteEmail('');
      Alert.alert('Başarılı', 'Davet gönderildi');
      fetchWorkspaces();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Davet gönderilemedi');
    } finally {
      setInviting(false);
    }
  };

  const openInviteModal = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowInviteModal(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.headerTitle}>Çalışma Alanları</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateModal(true);
              }}
            >
              <LinearGradient colors={theme.colors.gradients.primary} style={styles.addButtonGradient}>
                <Ionicons name="add" size={22} color={theme.colors.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Current Workspace */}
            {currentWorkspace && (
              <Animated.View style={[styles.currentSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.sectionTitle}>Aktif Çalışma Alanı</Text>
                <View style={styles.currentWorkspaceCard}>
                  <LinearGradient colors={theme.colors.gradients.primaryVibrant} style={styles.currentIcon}>
                    <Ionicons name="briefcase" size={24} color={theme.colors.text.primary} />
                  </LinearGradient>
                  <View style={styles.currentInfo}>
                    <Text style={styles.currentName}>{currentWorkspace.name}</Text>
                    <Text style={styles.currentMeta}>
                      {currentWorkspace.member_ids?.length || 1} üye
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Aktif</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* All Workspaces */}
            <Animated.View style={[styles.allSection, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Tüm Çalışma Alanları</Text>
              {workspaces.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <LinearGradient colors={theme.colors.gradients.secondary} style={styles.emptyIcon}>
                      <Ionicons name="briefcase-outline" size={40} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyTitle}>Çalışma Alanı Yok</Text>
                  <Text style={styles.emptySubtitle}>İlk çalışma alanınızı oluşturun</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyButtonGradient}>
                      <Ionicons name="add" size={20} color={theme.colors.text.primary} />
                      <Text style={styles.emptyButtonText}>Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                workspaces.map((workspace, index) => (
                  <Animated.View
                    key={workspace._id}
                    style={{
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 5],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.workspaceCard,
                        currentWorkspace?._id === workspace._id && styles.workspaceCardActive,
                      ]}
                      onPress={() => handleSelectWorkspace(workspace)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.workspaceIcon}>
                        <LinearGradient
                          colors={
                            currentWorkspace?._id === workspace._id
                              ? theme.colors.gradients.primary
                              : theme.colors.gradients.dark
                          }
                          style={styles.workspaceIconGradient}
                        >
                          <Ionicons name="briefcase" size={22} color={theme.colors.text.primary} />
                        </LinearGradient>
                      </View>
                      <View style={styles.workspaceInfo}>
                        <Text style={styles.workspaceName}>{workspace.name}</Text>
                        {workspace.description && (
                          <Text style={styles.workspaceDescription} numberOfLines={1}>
                            {workspace.description}
                          </Text>
                        )}
                        <View style={styles.workspaceMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={14} color={theme.colors.text.muted} />
                            <Text style={styles.metaText}>{workspace.member_ids?.length || 1} üye</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color={theme.colors.text.muted} />
                            <Text style={styles.metaText}>
                              {format(new Date(workspace.created_at), 'd MMM yyyy', { locale: tr })}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.workspaceActions}>
                        {workspace.owner_id === user?._id && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              openInviteModal(workspace);
                            }}
                          >
                            <Ionicons name="person-add-outline" size={18} color={theme.colors.accent.primary} />
                          </TouchableOpacity>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Create Workspace Modal */}
          <Modal visible={showCreateModal} animationType="slide" transparent>
            <BlurView intensity={20} style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Yeni Çalışma Alanı</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowCreateModal(false)}
                    >
                      <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Ad *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Çalışma alanı adı"
                        placeholderTextColor={theme.colors.text.muted}
                        value={newWorkspaceName}
                        onChangeText={setNewWorkspaceName}
                        autoFocus
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Açıklama</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Çalışma alanı hakkında kısa bir açıklama"
                        placeholderTextColor={theme.colors.text.muted}
                        value={newWorkspaceDescription}
                        onChangeText={setNewWorkspaceDescription}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowCreateModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                      onPress={handleCreateWorkspace}
                      disabled={creating}
                    >
                      <LinearGradient colors={theme.colors.gradients.primary} style={styles.submitButtonGradient}>
                        <Text style={styles.submitButtonText}>
                          {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </BlurView>
          </Modal>

          {/* Invite Member Modal */}
          <Modal visible={showInviteModal} animationType="slide" transparent>
            <BlurView intensity={20} style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Üye Davet Et</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowInviteModal(false)}
                    >
                      <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={styles.inviteInfo}>
                      {selectedWorkspace?.name} çalışma alanına üye davet edin
                    </Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>E-posta Adresi *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="ornek@email.com"
                        placeholderTextColor={theme.colors.text.muted}
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                      />
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowInviteModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitButton, inviting && styles.submitButtonDisabled]}
                      onPress={handleInviteMember}
                      disabled={inviting}
                    >
                      <LinearGradient colors={theme.colors.gradients.primary} style={styles.submitButtonGradient}>
                        <Text style={styles.submitButtonText}>
                          {inviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentWorkspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary + '40',
    ...theme.shadows.glow,
  },
  currentIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currentInfo: {
    flex: 1,
  },
  currentName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  currentMeta: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.accent.success + '20',
    borderWidth: 1,
    borderColor: theme.colors.accent.success + '40',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent.success,
  },
  allSection: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
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
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  workspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  workspaceCardActive: {
    borderColor: theme.colors.accent.primary + '40',
    backgroundColor: theme.colors.background.elevated,
  },
  workspaceIcon: {
    marginRight: 14,
  },
  workspaceIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  workspaceDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  workspaceMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  workspaceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.cardSolid,
    borderTopLeftRadius: theme.borderRadius.xxxl,
    borderTopRightRadius: theme.borderRadius.xxxl,
    paddingTop: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
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
  modalBody: {
    padding: 24,
  },
  inviteInfo: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  submitButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
