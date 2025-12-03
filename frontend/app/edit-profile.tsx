import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { theme } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function EditProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
  }, []);

  useEffect(() => {
    const changed = fullName !== user?.full_name || email !== user?.email;
    setHasChanges(changed);
  }, [fullName, email, user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Hata', 'Ad soyad alanı boş olamaz');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'E-posta alanı boş olamaz');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_URL}/user/me`, {
        full_name: fullName,
        email: email,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Değişiklikler Kaydedilmedi',
        'Değişiklikleriniz kaydedilmedi. Çıkmak istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çık', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

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
                  handleBack();
                }}
              >
                <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profili Düzenle</Text>
              <TouchableOpacity
                style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!hasChanges || saving}
              >
                <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Avatar Section */}
              <Animated.View style={[styles.avatarSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={theme.colors.gradients.primaryVibrant}
                    style={styles.avatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>
                      {fullName ? getInitials(fullName) : 'U'}
                    </Text>
                  </LinearGradient>
                  <TouchableOpacity
                    style={styles.editAvatarButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('Yakında', 'Fotoğraf yükleme özelliği yakında eklenecek');
                    }}
                  >
                    <LinearGradient colors={theme.colors.gradients.primary} style={styles.editAvatarGradient}>
                      <Ionicons name="camera" size={16} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Text style={styles.avatarHint}>Profil fotoğrafını değiştirmek için dokun</Text>
              </Animated.View>

              {/* Form */}
              <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Adınız ve soyadınız"
                      placeholderTextColor={theme.colors.text.muted}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>E-posta</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="ornek@email.com"
                      placeholderTextColor={theme.colors.text.muted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefon (Opsiyonel)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color={theme.colors.text.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="+90 555 123 4567"
                      placeholderTextColor={theme.colors.text.muted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Biyografi (Opsiyonel)</Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Kendiniz hakkında birkaç cümle yazın..."
                      placeholderTextColor={theme.colors.text.muted}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Info Card */}
              <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="information-circle" size={24} color={theme.colors.accent.info} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Hesap Güvenliği</Text>
                  <Text style={styles.infoText}>
                    Şifrenizi değiştirmek için Ayarlar {'>'} Şifre Değiştir bölümünü kullanın.
                  </Text>
                </View>
              </Animated.View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.accent.primary + '20',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.background.cardSolid,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.muted,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.background.primary,
  },
  editAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.accent.info + '10',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: theme.colors.accent.info + '30',
    gap: 12,
  },
  infoIconContainer: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
