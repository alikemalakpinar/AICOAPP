import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernCard } from '../../components/ModernCard';
import { ChipButton } from '../../components/ChipButton';
import { EmptyState } from '../../components/EmptyState';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { GradientButton } from '../../components/GradientButton';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

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
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

  const fetchRequests = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/requests?workspace_id=${currentWorkspace._id}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
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
      Alert.alert('Hata', 'Talep oluşturulamadı');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Talepler</Text>
          </View>
          <EmptyState
            icon="briefcase-outline"
            title="Çalışma Alanı Seçilmedi"
            subtitle="Lütfen bir çalışma alanı seçin"
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Talepler</Text>
          </View>
          <View style={styles.loadingContainer}>
            <LoadingAnimation />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Talepler</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setModalVisible(true);
            }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {requests.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="Henüz Talep Yok"
              subtitle="Yeni talep oluşturmak için + butonuna tıklayın"
              action={
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={styles.createButton}
                >
                  <Text style={styles.createButtonText}>İlk Talebi Oluştur</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            <View style={styles.requestsContainer}>
              {requests.map((request) => (
                <ModernCard key={request._id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(request.priority) + '20' },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(request.priority) },
                        ]}
                      />
                    </View>
                  </View>
                  {request.description && (
                    <Text style={styles.requestDescription} numberOfLines={2}>
                      {request.description}
                    </Text>
                  )}
                  <View style={styles.requestFooter}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{request.category}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(request.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {request.status === 'pending'
                          ? 'Bekliyor'
                          : request.status === 'in_progress'
                          ? 'İşlemde'
                          : request.status === 'completed'
                          ? 'Tamamlandı'
                          : 'Reddedildi'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestDate}>
                    {format(new Date(request.created_at), 'dd MMM yyyy')}
                  </Text>
                </ModernCard>
              ))}
            </View>
          )}
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Talep Oluştur</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Talep başlığı"
                placeholderTextColor="#9ca3af"
                value={newRequest.title}
                onChangeText={(text) => setNewRequest({ ...newRequest, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Açıklama (opsiyonel)"
                placeholderTextColor="#9ca3af"
                value={newRequest.description}
                onChangeText={(text) => setNewRequest({ ...newRequest, description: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Öncelik</Text>
              <View style={styles.optionsRow}>
                {['low', 'medium', 'high'].map((priority) => (
                  <ChipButton
                    key={priority}
                    label={priority === 'low' ? 'Düşük' : priority === 'medium' ? 'Orta' : 'Yüksek'}
                    selected={newRequest.priority === priority}
                    onPress={() => setNewRequest({ ...newRequest, priority })}
                    color={getPriorityColor(priority)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Kategori</Text>
              <View style={styles.optionsRow}>
                {['general', 'technical', 'support', 'feature'].map((category) => (
                  <ChipButton
                    key={category}
                    label={
                      category === 'general'
                        ? 'Genel'
                        : category === 'technical'
                        ? 'Teknik'
                        : category === 'support'
                        ? 'Destek'
                        : 'Özellik'
                    }
                    selected={newRequest.category === category}
                    onPress={() => setNewRequest({ ...newRequest, category })}
                  />
                ))}
              </View>

              <GradientButton onPress={handleCreateRequest} title="Talep Oluştur" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  requestsContainer: {
    padding: 20,
  },
  requestCard: {
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    fontSize: 18,
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
  requestDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
});
