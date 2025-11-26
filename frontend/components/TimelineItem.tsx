import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface TimelineItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  time: Date;
  color: string;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  title,
  description,
  time,
  color,
  isLast = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={16} color="#ffffff" />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>{format(time, 'MMM dd, yyyy • HH:mm')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
