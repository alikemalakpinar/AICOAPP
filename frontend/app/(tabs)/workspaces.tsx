import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

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
  const { currentWorkspace, setCurrentWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get(`${API_URL}/workspaces`);
      setWorkspaces(response.data);
      
      // Auto-select first workspace if none selected
      if (!currentWorkspace && response.data.length > 0) {
        setCurrentWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      Alert.alert('Error', 'Please enter a workspace name');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/workspaces`, newWorkspace);
      setWorkspaces([response.data, ...workspaces]);
      setCurrentWorkspace(response.data);
      setModalVisible(false);
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create workspace');
    }
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    Alert.alert('Success', `Switched to ${workspace.name}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Workspaces</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workspaces</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {workspaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyText}>No workspaces yet</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
              <Text style={styles.createButtonText}>Create First Workspace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workspacesContainer}>
            {workspaces.map((workspace) => (
              <TouchableOpacity
                key={workspace._id}
                style={[
                  styles.workspaceCard,
                  currentWorkspace?._id === workspace._id && styles.workspaceCardActive,
                ]}
                onPress={() => handleSelectWorkspace(workspace)}
              >
                <View style={styles.workspaceIcon}>
                  <Ionicons
                    name="briefcase"
                    size={32}
                    color={currentWorkspace?._id === workspace._id ? '#3b82f6' : '#6b7280'}
                  />
                </View>
                <View style={styles.workspaceInfo}>
                  <View style={styles.workspaceHeader}>
                    <Text style={styles.workspaceName}>{workspace.name}</Text>
                    {currentWorkspace?._id === workspace._id && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  {workspace.description && (
                    <Text style={styles.workspaceDescription} numberOfLines={2}>
                      {workspace.description}
                    </Text>
                  )}
                  <View style={styles.workspaceFooter}>
                    <View style={styles.workspaceMeta}>
                      <Ionicons name="people-outline" size={16} color="#9ca3af" />
                      <Text style={styles.workspaceMetaText}>{workspace.member_ids.length} members</Text>
                    </View>
                    <Text style={styles.workspaceDate}>
                      Created {format(new Date(workspace.created_at), 'MMM dd')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Workspace</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Workspace Name"
              placeholderTextColor="#6b7280"
              value={newWorkspace.name}
              onChangeText={(text) => setNewWorkspace({ ...newWorkspace, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6b7280"
              value={newWorkspace.description}
              onChangeText={(text) => setNewWorkspace({ ...newWorkspace, description: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.createModalButton} onPress={handleCreateWorkspace}>
              <Text style={styles.createModalButtonText}>Create Workspace</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d1f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3148',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#1e40af',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  workspacesContainer: {
    padding: 16,
  },
  workspaceCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2d3148',
  },
  workspaceCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e2844',
  },
  workspaceIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#0c0d1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workspaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  workspaceDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  workspaceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workspaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workspaceMetaText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  workspaceDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  createButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1c2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#0c0d1f',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createModalButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createModalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
