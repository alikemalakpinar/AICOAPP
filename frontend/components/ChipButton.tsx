import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ChipButtonProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export const ChipButton: React.FC<ChipButtonProps> = ({
  label,
  selected = false,
  onPress,
  color = '#3b82f6',
  style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && [styles.selected, { backgroundColor: color }],
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selected: {
    backgroundColor: '#3b82f6',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  labelSelected: {
    color: '#ffffff',
  },
});
