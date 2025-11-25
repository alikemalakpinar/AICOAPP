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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface TeamMember {
  _id: string;
  email: string;
  full_name: string;
  avatar?: string;
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

  const fetchTeam = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/team?workspace_id=${currentWorkspace._id}`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [currentWorkspace]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeam();
  }, [currentWorkspace]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await axios.post(`${API_URL}/workspaces/${currentWorkspace?._id}/invite`, {
        email: inviteEmail,
      });
      Alert.alert('Success', 'Invitation sent successfully');
      setModalVisible(false);
      setInviteEmail('');
      fetchTeam();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send invitation');
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

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team</Text>
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
          <Text style={styles.title}>Team</Text>
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
        <Text style={styles.title}>Team Members</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="person-add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <View style={styles.membersContainer}>
          {members.map((member) => (
            <View key={member._id} style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
              </View>
              <View style={styles.memberStats}>
                <View style={styles.stat}>
                  <Ionicons name="folder-outline" size={16} color="#9ca3af" />
                  <Text style={styles.statText}>{member.projects_count}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="checkbox-outline" size={16} color="#9ca3af" />
                  <Text style={styles.statText}>{member.tasks_count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the email address of the person you want to invite to this workspace.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#6b7280"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
              <Text style={styles.inviteButtonText}>Send Invitation</Text>
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
  membersContainer: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  memberStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalDescription: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
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
  inviteButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
