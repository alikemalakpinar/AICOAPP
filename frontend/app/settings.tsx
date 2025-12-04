import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'link' | 'action' | 'info';
  value?: boolean;
  onPress?: () => void;
  gradient: readonly [string, string];
  danger?: boolean;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export default function Settings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [analytics, setAnalytics] = useState(true);

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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setPushNotifications(settings.pushNotifications ?? true);
        setEmailNotifications(settings.emailNotifications ?? false);
        setBiometric(settings.biometric ?? false);
        setAnalytics(settings.analytics ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings[key] = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
    saveSettings(key, value);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz silinecektir. Devam etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Bilgi', 'Hesap silme işlemi henüz aktif değil.');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert('Önbelleği Temizle', 'Uygulama önbelleği temizlenecek. Devam etmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Başarılı', 'Önbellek temizlendi');
        },
      },
    ]);
  };

  const sections: SettingSection[] = [
    {
      title: 'Hesap',
      items: [
        {
          icon: 'person-outline',
          title: 'Profil Bilgileri',
          subtitle: 'Ad, e-posta ve fotoğraf',
          type: 'link',
          gradient: theme.colors.gradients.primary,
          onPress: () => router.push('/edit-profile'),
        },
        {
          icon: 'key-outline',
          title: 'Şifre Değiştir',
          subtitle: 'Hesap şifrenizi güncelleyin',
          type: 'link',
          gradient: theme.colors.gradients.secondary,
          onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
          icon: 'finger-print-outline',
          title: 'Biyometrik Giriş',
          subtitle: 'Yüz tanıma veya parmak izi',
          type: 'toggle',
          value: biometric,
          gradient: theme.colors.gradients.info,
          onPress: () => handleToggle('biometric', !biometric, setBiometric),
        },
      ],
    },
    {
      title: 'Bildirimler',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Bildirimlere İzin Ver',
          subtitle: 'Tüm bildirimleri aç/kapat',
          type: 'toggle',
          value: notifications,
          gradient: theme.colors.gradients.warning,
          onPress: () => handleToggle('notifications', !notifications, setNotifications),
        },
        {
          icon: 'phone-portrait-outline',
          title: 'Push Bildirimleri',
          subtitle: 'Anlık bildirimler al',
          type: 'toggle',
          value: pushNotifications,
          gradient: theme.colors.gradients.success,
          onPress: () => handleToggle('pushNotifications', !pushNotifications, setPushNotifications),
        },
        {
          icon: 'mail-outline',
          title: 'E-posta Bildirimleri',
          subtitle: 'Önemli güncellemeleri e-posta ile al',
          type: 'toggle',
          value: emailNotifications,
          gradient: theme.colors.gradients.tertiary,
          onPress: () => handleToggle('emailNotifications', !emailNotifications, setEmailNotifications),
        },
      ],
    },
    {
      title: 'Görünüm',
      items: [
        {
          icon: 'moon-outline',
          title: 'Tema',
          subtitle: 'Koyu mod (aktif)',
          type: 'link',
          gradient: theme.colors.gradients.secondary,
          onPress: () => Alert.alert('Bilgi', 'Şu an sadece koyu tema desteklenmektedir'),
        },
        {
          icon: 'language-outline',
          title: 'Dil',
          subtitle: 'Türkçe',
          type: 'link',
          gradient: theme.colors.gradients.info,
          onPress: () => Alert.alert('Bilgi', 'Şu an sadece Türkçe desteklenmektedir'),
        },
      ],
    },
    {
      title: 'Gizlilik ve Güvenlik',
      items: [
        {
          icon: 'analytics-outline',
          title: 'Kullanım Verileri',
          subtitle: 'Anonim kullanım verilerini paylaş',
          type: 'toggle',
          value: analytics,
          gradient: theme.colors.gradients.primary,
          onPress: () => handleToggle('analytics', !analytics, setAnalytics),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Gizlilik Politikası',
          type: 'link',
          gradient: theme.colors.gradients.success,
          onPress: () => Linking.openURL('https://example.com/privacy'),
        },
        {
          icon: 'document-text-outline',
          title: 'Kullanım Koşulları',
          type: 'link',
          gradient: theme.colors.gradients.warning,
          onPress: () => Linking.openURL('https://example.com/terms'),
        },
      ],
    },
    {
      title: 'Depolama',
      items: [
        {
          icon: 'trash-outline',
          title: 'Önbelleği Temizle',
          subtitle: 'Geçici dosyaları sil',
          type: 'action',
          gradient: theme.colors.gradients.warning,
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: 'Hakkında',
      items: [
        {
          icon: 'information-circle-outline',
          title: 'Uygulama Versiyonu',
          subtitle: '1.0.0 (Build 1)',
          type: 'info',
          gradient: theme.colors.gradients.info,
        },
        {
          icon: 'star-outline',
          title: 'Uygulamayı Değerlendir',
          type: 'link',
          gradient: theme.colors.gradients.premium as unknown as readonly [string, string],
          onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
          icon: 'chatbubble-outline',
          title: 'Geri Bildirim Gönder',
          type: 'link',
          gradient: theme.colors.gradients.secondary,
          onPress: () => Linking.openURL('mailto:support@aico.app'),
        },
      ],
    },
    {
      title: 'Hesap İşlemleri',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Çıkış Yap',
          type: 'action',
          gradient: theme.colors.gradients.warning,
          onPress: handleLogout,
        },
        {
          icon: 'trash-bin-outline',
          title: 'Hesabı Sil',
          subtitle: 'Tüm verileriniz silinecek',
          type: 'action',
          gradient: theme.colors.gradients.error,
          danger: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

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
            <Text style={styles.headerTitle}>Ayarlar</Text>
            <View style={{ width: 44 }} />
          </Animated.View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {sections.map((section, sectionIndex) => (
              <Animated.View
                key={sectionIndex}
                style={[
                  styles.section,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + sectionIndex * 3],
                      }),
                    }],
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      style={[
                        styles.settingItem,
                        itemIndex < section.items.length - 1 && styles.settingItemBorder,
                      ]}
                      onPress={item.onPress}
                      activeOpacity={item.type === 'info' ? 1 : 0.7}
                      disabled={item.type === 'info'}
                    >
                      <View style={styles.settingIconContainer}>
                        <LinearGradient colors={item.gradient as [string, string]} style={styles.settingIcon}>
                          <Ionicons name={item.icon} size={20} color={theme.colors.text.primary} />
                        </LinearGradient>
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={[styles.settingTitle, item.danger && styles.settingTitleDanger]}>
                          {item.title}
                        </Text>
                        {item.subtitle && (
                          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                      {item.type === 'toggle' && (
                        <Switch
                          value={item.value}
                          onValueChange={() => item.onPress?.()}
                          trackColor={{ false: theme.colors.border.medium, true: theme.colors.accent.primary + '60' }}
                          thumbColor={item.value ? theme.colors.accent.primary : theme.colors.text.muted}
                        />
                      )}
                      {item.type === 'link' && (
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: theme.colors.background.cardSolid,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  settingIconContainer: {
    marginRight: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: theme.colors.accent.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
});
