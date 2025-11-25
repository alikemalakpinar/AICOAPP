import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
  delay?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return { colors: ['#6b7280', '#4b5563'], label: 'Not Started', icon: 'time-outline' as const };
      case 'in_progress':
        return { colors: ['#3b82f6', '#2563eb'], label: 'In Progress', icon: 'rocket-outline' as const };
      case 'completed':
        return { colors: ['#10b981', '#059669'], label: 'Completed', icon: 'checkmark-circle-outline' as const };
      default:
        return { colors: ['#6b7280', '#4b5563'], label: status, icon: 'help-circle-outline' as const };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#1a1c2e', '#232540']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {project.name}
                </Text>
                {project.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.statusBadge}>
                <LinearGradient
                  colors={statusConfig.colors}
                  style={styles.statusGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name={statusConfig.icon} size={16} color="#ffffff" />
                  <Text style={styles.statusText}>{statusConfig.label}</Text>
                </LinearGradient>
              </View>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                <Text style={styles.date}>
                  {format(new Date(project.created_at), 'MMM dd')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
