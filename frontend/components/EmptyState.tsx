import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  variant?: 'default' | 'tasks' | 'projects' | 'search' | 'notifications' | 'members';
}

const variantConfig = {
  default: {
    icon: 'file-tray-outline' as const,
    gradient: theme.colors.gradients.neutral,
  },
  tasks: {
    icon: 'checkbox-outline' as const,
    gradient: theme.colors.gradients.primary,
  },
  projects: {
    icon: 'folder-open-outline' as const,
    gradient: theme.colors.gradients.secondary,
  },
  search: {
    icon: 'search-outline' as const,
    gradient: theme.colors.gradients.info,
  },
  notifications: {
    icon: 'notifications-off-outline' as const,
    gradient: theme.colors.gradients.warning,
  },
  members: {
    icon: 'people-outline' as const,
    gradient: theme.colors.gradients.tertiary,
  },
};

export function EmptyState({
  icon,
  title,
  subtitle,
  description,
  actionLabel,
  onAction,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;
  const displayDescription = description || subtitle;

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={config.gradient}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={displayIcon} size={40} color="#ffffff" />
        </LinearGradient>
        <View style={styles.iconRing} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {displayDescription && <Text style={styles.description}>{displayDescription}</Text>}

      {action && <View style={styles.actionContainer}>{action}</View>}

      {!action && actionLabel && onAction && (
        <TouchableOpacity onPress={handleAction} activeOpacity={0.8}>
          <LinearGradient
            colors={theme.colors.gradients.primary}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.actionLabel}>{actionLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Pre-configured empty states
export function EmptyTasks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      variant="tasks"
      title="Henüz görev yok"
      description="Bu projede henüz görev bulunmuyor. Yeni bir görev ekleyerek başlayın."
      actionLabel="Görev Ekle"
      onAction={onAction}
    />
  );
}

export function EmptyProjects({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      variant="projects"
      title="Proje bulunamadı"
      description="Çalışma alanınızda henüz proje yok. İlk projenizi oluşturun."
      actionLabel="Proje Oluştur"
      onAction={onAction}
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      variant="search"
      title="Sonuç bulunamadı"
      description={query ? `"${query}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.` : 'Arama yapmak için bir şeyler yazın.'}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      variant="notifications"
      title="Bildirim yok"
      description="Yeni bildiriminiz bulunmuyor. Aktiviteler burada görünecek."
    />
  );
}

export function EmptyMembers({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      variant="members"
      title="Üye bulunamadı"
      description="Bu çalışma alanında henüz üye yok. Ekip üyelerini davet edin."
      actionLabel="Üye Davet Et"
      onAction={onAction}
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon="chatbubbles-outline"
      title="Yorum yok"
      description="İlk yorumu siz ekleyin ve tartışmayı başlatın."
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon="pulse-outline"
      title="Aktivite yok"
      description="Henüz aktivite kaydı bulunmuyor. İşlemler burada görünecek."
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
