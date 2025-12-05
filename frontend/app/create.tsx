import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { theme, getPriorityColor, getPriorityLabel } from '../theme';
import { SelectionSheet } from '../components/BottomSheet';
import { useToast } from '../context/ToastContext';

const { height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

type CreateType = 'project' | 'task' | 'request' | null;

interface Project {
  _id: string;
  name: string;
  color: string;
}

interface Member {
  _id: string;
  full_name: string;
  email: string;
}

export default function Create() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<CreateType>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Task specific fields
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('medium');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sheet states
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [showPrioritySheet, setShowPrioritySheet] = useState(false);
  const [showAssigneeSheet, setShowAssigneeSheet] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch projects and members for task creation
    if (currentWorkspace) {
      fetchProjects();
      fetchMembers();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects?workspace_id=${currentWorkspace?._id}`);
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/workspaces/${currentWorkspace?._id}/members`);
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedProject('');
    setSelectedPriority('medium');
    setSelectedAssignee('');
    setDeadline(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Hata', 'Lütfen başlık girin');
      return;
    }

    if (!currentWorkspace) {
      toast.error('Hata', 'Çalışma alanı seçilmemiş');
      return;
    }

    // Task requires project
    if (selectedType === 'task' && !selectedProject) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Hata', 'Lütfen bir proje seçin');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let data: any = {};

      switch (selectedType) {
        case 'project':
          endpoint = `${API_URL}/projects`;
          data = {
            name: title,
            description,
            status: 'not_started',
            workspace_id: currentWorkspace._id,
            assigned_to: [],
          };
          break;
        case 'task':
          endpoint = `${API_URL}/tasks`;
          data = {
            title,
            description,
            project_id: selectedProject,
            status: 'todo',
            priority: selectedPriority,
            assigned_to: selectedAssignee || null,
            deadline: deadline?.toISOString() || null,
          };
          break;
        case 'request':
          endpoint = `${API_URL}/requests`;
          data = {
            title,
            description,
            status: 'pending',
            priority: selectedPriority,
            category: 'general',
            workspace_id: currentWorkspace._id,
          };
          break;
      }

      await axios.post(endpoint, data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Başarılı', `${selectedType === 'project' ? 'Proje' : selectedType === 'task' ? 'Görev' : 'Talep'} oluşturuldu`);
      handleClose();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.response?.data?.detail || 'Oluşturma başarısız oldu';
      toast.error('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createOptions = [
    {
      type: 'project' as CreateType,
      icon: 'folder' as const,
      title: 'Yeni Proje',
      description: 'Yeni bir proje oluşturun',
      gradient: theme.colors.gradients.primary,
    },
    {
      type: 'task' as CreateType,
      icon: 'checkbox' as const,
      title: 'Yeni Görev',
      description: 'Projeye görev ekleyin',
      gradient: theme.colors.gradients.secondary,
    },
    {
      type: 'request' as CreateType,
      icon: 'document-text' as const,
      title: 'Yeni Talep',
      description: 'Talep veya istek oluşturun',
      gradient: theme.colors.gradients.warning,
    },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Düşük', icon: 'arrow-down' as const, color: theme.colors.priority.low },
    { value: 'medium', label: 'Orta', icon: 'remove' as const, color: theme.colors.priority.medium },
    { value: 'high', label: 'Yüksek', icon: 'arrow-up' as const, color: theme.colors.priority.high },
    { value: 'critical', label: 'Kritik', icon: 'alert-circle' as const, color: theme.colors.priority.critical },
  ];

  const renderTaskForm = () => {
    const selectedProjectData = projects.find(p => p._id === selectedProject);
    const selectedMemberData = members.find(m => m._id === selectedAssignee);

    return (
      <>
        {/* Project Selection - Required */}
        <Text style={styles.inputLabel}>Proje *</Text>
        <TouchableOpacity
          style={[styles.selectButton, !selectedProject && styles.selectButtonEmpty]}
          onPress={() => setShowProjectSheet(true)}
          activeOpacity={0.7}
        >
          {selectedProjectData ? (
            <View style={styles.selectContent}>
              <View style={[styles.projectDot, { backgroundColor: selectedProjectData.color || '#6366f1' }]} />
              <Text style={styles.selectText}>{selectedProjectData.name}</Text>
            </View>
          ) : (
            <Text style={styles.selectPlaceholder}>Proje seçin</Text>
          )}
          <Ionicons name="chevron-down" size={20} color={theme.colors.text.muted} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.inputLabel}>Başlık *</Text>
        <TextInput
          style={styles.input}
          placeholder="Görev başlığı"
          placeholderTextColor={theme.colors.text.muted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.inputLabel}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Açıklama ekleyin..."
          placeholderTextColor={theme.colors.text.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Priority & Assignee Row */}
        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            <Text style={styles.inputLabel}>Öncelik</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPrioritySheet(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectContent}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(selectedPriority) }]} />
                <Text style={styles.selectText}>{getPriorityLabel(selectedPriority)}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.inputLabel}>Atanan</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowAssigneeSheet(true)}
              activeOpacity={0.7}
            >
              {selectedMemberData ? (
                <View style={styles.selectContent}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarText}>
                      {selectedMemberData.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.selectText} numberOfLines={1}>
                    {selectedMemberData.full_name.split(' ')[0]}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectPlaceholder}>Seçin</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Deadline */}
        <Text style={styles.inputLabel}>Son Tarih</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectContent}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.accent.primary} />
            <Text style={[styles.selectText, !deadline && styles.selectPlaceholder]}>
              {deadline ? format(deadline, 'd MMMM yyyy', { locale: tr }) : 'Tarih seçin'}
            </Text>
          </View>
          {deadline && (
            <TouchableOpacity onPress={() => setDeadline(null)} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={deadline || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDeadline(selectedDate);
              }
            }}
            minimumDate={new Date()}
            textColor={theme.colors.text.primary}
          />
        )}
      </>
    );
  };

  const renderSimpleForm = () => (
    <>
      <Text style={styles.inputLabel}>Başlık *</Text>
      <TextInput
        style={styles.input}
        placeholder={selectedType === 'project' ? 'Proje adı' : 'Talep başlığı'}
        placeholderTextColor={theme.colors.text.muted}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Text style={styles.inputLabel}>Açıklama</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Açıklama ekleyin..."
        placeholderTextColor={theme.colors.text.muted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {selectedType === 'request' && (
        <>
          <Text style={styles.inputLabel}>Öncelik</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowPrioritySheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectContent}>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(selectedPriority) }]} />
              <Text style={styles.selectText}>{getPriorityLabel(selectedPriority)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.background.card, theme.colors.background.secondary]}
          style={styles.contentGradient}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!selectedType ? (
                <>
                  {/* Title */}
                  <View style={styles.titleSection}>
                    <Text style={styles.title}>Ne Oluşturmak İstiyorsunuz?</Text>
                    <Text style={styles.subtitle}>Başlamak için bir seçenek seçin</Text>
                  </View>

                  {/* Options */}
                  <View style={styles.optionsContainer}>
                    {createOptions.map((option) => (
                      <TouchableOpacity
                        key={option.type}
                        style={styles.optionCard}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedType(option.type);
                        }}
                      >
                        <LinearGradient
                          colors={option.gradient}
                          style={styles.optionIconContainer}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name={option.icon} size={28} color="#ffffff" />
                        </LinearGradient>
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionTitle}>{option.title}</Text>
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.text.muted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(null);
                      resetForm();
                    }}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    <Text style={styles.backButtonText}>Geri</Text>
                  </TouchableOpacity>

                  {/* Form */}
                  <View style={styles.formSection}>
                    <Text style={styles.formTitle}>
                      {selectedType === 'project' ? 'Yeni Proje' :
                        selectedType === 'task' ? 'Yeni Görev' : 'Yeni Talep'}
                    </Text>

                    {selectedType === 'task' ? renderTaskForm() : renderSimpleForm()}

                    <TouchableOpacity
                      style={[styles.createButton, loading && styles.createButtonDisabled]}
                      onPress={handleCreate}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          selectedType === 'project' ? theme.colors.gradients.primary :
                            selectedType === 'task' ? theme.colors.gradients.secondary :
                              theme.colors.gradients.warning
                        }
                        style={styles.createButtonGradient}
                      >
                        {loading ? (
                          <View style={styles.loadingIndicator} />
                        ) : (
                          <>
                            <Ionicons name="add-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.createButtonText}>Oluştur</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Project Selection Sheet */}
      <SelectionSheet
        visible={showProjectSheet}
        onClose={() => setShowProjectSheet(false)}
        title="Proje Seçin"
        options={projects.map(p => ({
          value: p._id,
          label: p.name,
          icon: 'folder' as const,
          color: p.color || '#6366f1',
        }))}
        selectedValue={selectedProject}
        onSelect={setSelectedProject}
      />

      {/* Priority Selection Sheet */}
      <SelectionSheet
        visible={showPrioritySheet}
        onClose={() => setShowPrioritySheet(false)}
        title="Öncelik Seçin"
        options={priorityOptions}
        selectedValue={selectedPriority}
        onSelect={setSelectedPriority}
      />

      {/* Assignee Selection Sheet */}
      <SelectionSheet
        visible={showAssigneeSheet}
        onClose={() => setShowAssigneeSheet(false)}
        title="Kişi Seçin"
        options={[
          { value: '', label: 'Atanmamış', icon: 'person-outline' as const },
          ...members.map(m => ({
            value: m._id,
            label: m.full_name,
            icon: 'person' as const,
          })),
        ]}
        selectedValue={selectedAssignee}
        onSelect={setSelectedAssignee}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  contentGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  safeArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border.medium,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 17,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  formSection: {
    gap: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.background.input,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    color: theme.colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.input,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  selectButtonEmpty: {
    borderColor: theme.colors.semantic.warning + '50',
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  selectText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: theme.colors.text.muted,
  },
  clearButton: {
    padding: 4,
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
  },
});
