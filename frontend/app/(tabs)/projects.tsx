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

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  assigned_to: string[];
  created_at: string;
}

export default function Projects() {
  const { currentWorkspace } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'not_started' });

  const fetchProjects = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/projects?workspace_id=${currentWorkspace._id}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [currentWorkspace]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
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
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return '#6b7280';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyText}>No workspace selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
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
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyText}>No projects yet</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
              <Text style={styles.createButtonText}>Create First Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectsContainer}>
            {projects.map((project) => (
              <View key={project._id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(project.status)}</Text>
                  </View>
                </View>
                {project.description && (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
                <View style={styles.projectFooter}>
                  <View style={styles.projectInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                    <Text style={styles.projectDate}>
                      {format(new Date(project.created_at), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.projectAction}>
                    <Ionicons name="arrow-forward" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Project</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Project Name"
              placeholderTextColor="#6b7280"
              value={newProject.name}
              onChangeText={(text) => setNewProject({ ...newProject, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6b7280"
              value={newProject.description}
              onChangeText={(text) => setNewProject({ ...newProject, description: text })}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusOptions}>
              {['not_started', 'in_progress', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    newProject.status === status && styles.statusOptionActive,
                  ]}
                  onPress={() => setNewProject({ ...newProject, status })}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      newProject.status === status && styles.statusOptionTextActive,
                    ]}
                  >
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createModalButton} onPress={handleCreateProject}>
              <Text style={styles.createModalButtonText}>Create Project</Text>
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
  projectsContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#1a1c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  projectAction: {
    padding: 4,
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
    maxHeight: '80%',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#1e40af',
    borderColor: '#3b82f6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
