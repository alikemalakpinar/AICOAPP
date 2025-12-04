import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Note {
  _id: string;
  title: string;
  content: string;
  workspace_id: string;
  project_id?: string;
  task_id?: string;
  is_pinned: boolean;
  color: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

const NOTE_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16'
];

export default function NotesScreen() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [isPinned, setIsPinned] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!currentWorkspace?._id) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/notes`, {
        params: { workspace_id: currentWorkspace._id },
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedColor(NOTE_COLORS[0]);
    setIsPinned(false);
    setEditingNote(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color);
    setIsPinned(note.is_pinned);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik girin.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        workspace_id: currentWorkspace?._id,
        color: selectedColor,
        is_pinned: isPinned,
        tags: []
      };

      if (editingNote) {
        await axios.put(`${API_URL}/api/notes/${editingNote._id}`, noteData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await axios.post(`${API_URL}/api/notes`, noteData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowModal(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Hata', 'Not kaydedilemedi.');
    }
  };

  const handleDelete = (note: Note) => {
    Alert.alert(
      'Notu Sil',
      `"${note.title}" notunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/notes/${note._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Hata', 'Not silinemedi.');
            }
          }
        }
      ]
    );
  };

  const togglePin = async (note: Note) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/notes/${note._id}/pin`,
        null,
        {
          params: { is_pinned: !note.is_pinned },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fetchNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteCard, { borderLeftColor: item.color }]}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTitleRow}>
          {item.is_pinned && (
            <Ionicons name="pin" size={14} color={theme.colors.accent.primary} style={styles.pinIcon} />
          )}
          <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={() => togglePin(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={item.is_pinned ? "pin" : "pin-outline"}
            size={18}
            color={item.is_pinned ? theme.colors.accent.primary : theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>
          {format(new Date(item.updated_at), 'd MMM yyyy, HH:mm', { locale: tr })}
        </Text>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notlar</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.accent.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Notlarda ara..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Henüz not yok</Text>
          <Text style={styles.emptyText}>Yeni bir not eklemek için + butonuna tıklayın</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accent.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.modalSave}>Kaydet</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.titleInput}
                placeholder="Başlık"
                placeholderTextColor={theme.colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.contentInput}
                placeholder="Not içeriği..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              {/* Color Picker */}
              <Text style={styles.colorLabel}>Renk</Text>
              <View style={styles.colorPicker}>
                {NOTE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pin Toggle */}
              <TouchableOpacity
                style={styles.pinToggle}
                onPress={() => setIsPinned(!isPinned)}
              >
                <Ionicons
                  name={isPinned ? "pin" : "pin-outline"}
                  size={20}
                  color={isPinned ? theme.colors.accent.primary : theme.colors.text.tertiary}
                />
                <Text style={[
                  styles.pinToggleText,
                  isPinned && { color: theme.colors.accent.primary }
                ]}>
                  Notu Sabitle
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinIcon: {
    marginRight: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  modalBody: {
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 200,
    lineHeight: 24,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 24,
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  pinToggleText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginLeft: 10,
  },
});
