import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
}

export function ErrorState({
  title = 'Bir Hata Oluştu',
  message = 'Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
  icon = 'cloud-offline-outline',
  onRetry,
  retryText = 'Tekrar Dene',
  showRetry = true,
}: ErrorStateProps) {
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[theme.colors.semantic.error + '20', theme.colors.semantic.error + '10']}
          style={styles.iconGradient}
        >
          <Ionicons name={icon} size={48} color={theme.colors.semantic.error} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
          <LinearGradient colors={theme.colors.gradients.primary} style={styles.retryButtonGradient}>
            <Ionicons name="refresh" size={18} color="#ffffff" style={styles.retryIcon} />
            <Text style={styles.retryText}>{retryText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorState
      title="Bağlantı Hatası"
      message="İnternet bağlantınızı kontrol edin ve tekrar deneyin."
      icon="wifi-outline"
      onRetry={onRetry}
    />
  );
}

export function ServerError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorState
      title="Sunucu Hatası"
      message="Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin."
      icon="server-outline"
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorState
      title="Bulunamadı"
      message="Aradığınız içerik bulunamadı veya kaldırılmış olabilir."
      icon="search-outline"
      onRetry={onRetry}
      showRetry={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
