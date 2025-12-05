import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  colors?: readonly [string, string, ...string[]];
}

const defaultColors = ['#3b82f6', '#8b5cf6'] as const;
const disabledColors = ['#4b5563', '#6b7280'] as const;

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  colors = defaultColors,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.container, (disabled || loading) && styles.disabled]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? disabledColors : colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
