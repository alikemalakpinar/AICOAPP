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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { theme } from '../theme';

const { height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

type CreateType = 'project' | 'task' | 'request' | null;

export default function Create() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [selectedType, setSelectedType] = useState<CreateType>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
  }, []);

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

  const handleCreate = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Lütfen başlık girin');
      return;
    }

    if (!currentWorkspace) {
      Alert.alert('Hata', 'Çalışma alanı seçilmemiş');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let data = {};

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
            status: 'pending',
            priority: 'medium',
            workspace_id: currentWorkspace._id,
          };
          break;
        case 'request':
          endpoint = `${API_URL}/requests`;
          data = {
            title,
            description,
            status: 'pending',
            priority: 'medium',
            category: 'general',
            workspace_id: currentWorkspace._id,
          };
          break;
      }

      await axios.post(endpoint, data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Oluşturma başarısız oldu');
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

            {!selectedType ? (
              <>
                {/* Title */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>Ne Oluşturmak İstiyorsunuz?</Text>
                  <Text style={styles.subtitle}>Başlamak için bir seçenek seçin</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {createOptions.map((option, index) => (
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
                        <Ionicons name={option.icon} size={28} color={theme.colors.text.primary} />
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
                    setTitle('');
                    setDescription('');
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

                  <Text style={styles.inputLabel}>Başlık</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      selectedType === 'project' ? 'Proje adı' :
                        selectedType === 'task' ? 'Görev başlığı' : 'Talep başlığı'
                    }
                    placeholderTextColor={theme.colors.text.muted}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>Açıklama (Opsiyonel)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Açıklama ekleyin..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                  />

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                    disabled={loading}
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
                        <Text style={styles.createButtonText}>Oluştur</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
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
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  contentGradient: {
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    backgroundColor: theme.colors.background.primary,
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
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: 24,
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
  loadingIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
    borderTopColor: 'transparent',
  },
});
