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
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface TeamMember {
  _id: string;
  email: string;
  full_name: string;
  avatar?: string;
  role?: string;
  projects_count: number;
  tasks_count: number;
}

export default function Team() {
  const { currentWorkspace } = useWorkspaceStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchTeam = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/team?workspace_id=${currentWorkspace._id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setMembers(data);
    } catch (error) {
      console.error('Error fetching team:', error);
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchTeam();
  }, [currentWorkspace]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Lütfen e-posta adresi girin');
      return;
    }

    try {
      await axios.post(`${API_URL}/workspaces/${currentWorkspace?._id}/invite`, {
        email: inviteEmail,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Başarılı', 'Davet başarıyla gönderildi');
      setModalVisible(false);
      setInviteEmail('');
      fetchTeam();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', error.response?.data?.detail || 'Davet gönderilemedi');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomGradient = (index: number) => {
    const gradients = [
      theme.colors.gradients.primary,
      theme.colors.gradients.secondary,
      theme.colors.gradients.success,
      theme.colors.gradients.warning,
    ];
    return gradients[index % gradients.length];
  };

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient colors={theme.colors.gradients.primary} style={styles.emptyIconGradient}>
                  <Ionicons name="people-outline" size={48} color={theme.colors.text.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Çalışma Alanı Seçilmedi</Text>
              <Text style={styles.emptySubtitle}>Takımı görmek için bir çalışma alanı seçin</Text>
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
            <Text style={styles.headerTitle}>Takım</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(true);
              }}
            >
              <LinearGradient colors={theme.colors.gradients.primary} style={styles.addButtonGradient}>
                <Ionicons name="person-add" size={20} color={theme.colors.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats */}
          <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.statCard}>
              <LinearGradient colors={theme.colors.gradients.primary} style={styles.statIconContainer}>
                <Ionicons name="people" size={20} color={theme.colors.text.primary} />
              </LinearGradient>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Üye</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={theme.colors.gradients.secondary} style={styles.statIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.text.primary} />
              </LinearGradient>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Admin</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={theme.colors.gradients.success} style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.text.primary} />
              </LinearGradient>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Aktif</Text>
            </View>
          </Animated.View>

          {/* Search */}
          <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color={theme.colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Üye ara..."
                placeholderTextColor={theme.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
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
            ) : filteredMembers.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <Ionicons name="people-outline" size={64} color={theme.colors.text.muted} />
                <Text style={styles.emptyListTitle}>Üye Bulunamadı</Text>
                <Text style={styles.emptyListSubtitle}>
                  {searchQuery ? 'Arama kriterlerinize uygun üye yok' : 'Takıma üye davet edin'}
                </Text>
              </View>
            ) : (
              <View style={styles.membersContainer}>
                {filteredMembers.map((member, index) => (
                  <Animated.View
                    key={member._id}
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
                      style={styles.memberCard}
                      activeOpacity={0.8}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                      <View style={styles.memberAvatar}>
                        <LinearGradient colors={getRandomGradient(index)} style={styles.avatarGradient}>
                          <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
                        </LinearGradient>
                        <View style={styles.onlineIndicator} />
                      </View>

                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.full_name}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        <View style={styles.memberRole}>
                          <View style={styles.roleBadge}>
                            <Ionicons name="person" size={12} color={theme.colors.accent.primary} />
                            <Text style={styles.roleText}>{member.role || 'Üye'}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.memberStats}>
                        <View style={styles.memberStat}>
                          <Ionicons name="folder-outline" size={16} color={theme.colors.text.muted} />
                          <Text style={styles.memberStatText}>{member.projects_count}</Text>
                        </View>
                        <View style={styles.memberStat}>
                          <Ionicons name="checkbox-outline" size={16} color={theme.colors.text.muted} />
                          <Text style={styles.memberStatText}>{member.tasks_count}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Invite Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Üye Davet Et</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inviteIconContainer}>
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.inviteIconGradient}>
                      <Ionicons name="mail" size={32} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>

                  <Text style={styles.inviteDescription}>
                    Davet etmek istediğiniz kişinin e-posta adresini girin. Bir davet bağlantısı gönderilecektir.
                  </Text>

                  <Text style={styles.inputLabel}>E-posta Adresi</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="ornek@email.com"
                    placeholderTextColor={theme.colors.text.muted}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.inviteButtonGradient}>
                      <Ionicons name="send" size={20} color={theme.colors.text.primary} />
                      <Text style={styles.inviteButtonText}>Davet Gönder</Text>
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
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
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
  scrollView: {
    flex: 1,
  },
  membersContainer: {
    paddingHorizontal: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  memberAvatar: {
    position: 'relative',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.accent.success,
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 8,
  },
  memberRole: {
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },
  memberStats: {
    gap: 8,
  },
  memberStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberStatText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '500',
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
    alignItems: 'center',
  },
  inviteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 20,
  },
  inviteIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  inviteButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  inviteButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
