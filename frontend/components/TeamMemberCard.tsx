import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface TeamMemberCardProps {
  name: string;
  role: string;
  avatar?: string;
  tasksCount: number;
  onPress?: () => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  role,
  avatar,
  tasksCount,
  onPress,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
      </View>
      <View style={styles.badge}>
        <Ionicons name="checkbox-outline" size={14} color="#3b82f6" />
        <Text style={styles.badgeText}>{tasksCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
