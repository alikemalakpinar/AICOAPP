import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ACTION_WIDTH = 80;

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  leftActionColor?: string;
  rightActionColor?: string;
  leftActionIcon?: keyof typeof Ionicons.glyphMap;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onDelete,
  onComplete,
  onEdit,
  leftActionColor = theme.colors.accent.success,
  rightActionColor = theme.colors.accent.error,
  leftActionIcon = 'checkmark-circle',
  rightActionIcon = 'trash',
  disabled = false,
}: SwipeableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const leftActionScale = useRef(new Animated.Value(0)).current;
  const rightActionScale = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedDx = Math.max(-ACTION_WIDTH * 1.5, Math.min(ACTION_WIDTH * 1.5, gestureState.dx));
        translateX.setValue(clampedDx);

        // Scale actions based on swipe distance
        if (gestureState.dx > 0) {
          const scale = Math.min(1, gestureState.dx / ACTION_WIDTH);
          leftActionScale.setValue(scale);
          rightActionScale.setValue(0);
        } else {
          const scale = Math.min(1, Math.abs(gestureState.dx) / ACTION_WIDTH);
          rightActionScale.setValue(scale);
          leftActionScale.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD && (onComplete || onEdit)) {
          // Swiped right - complete/edit action
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(translateX, {
            toValue: ACTION_WIDTH,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            // Reset after action
            setTimeout(() => {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
              }).start();
              if (onComplete) onComplete();
              else if (onEdit) onEdit();
            }, 200);
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD && onDelete) {
          // Swiped left - delete action
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            setTimeout(() => {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
              }).start();
              onDelete();
            }, 200);
          });
        } else {
          // Reset position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }

        // Reset scales
        Animated.timing(leftActionScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        Animated.timing(rightActionScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left Action (Complete/Edit) */}
      <Animated.View
        style={[
          styles.actionContainer,
          styles.leftAction,
          {
            opacity: leftActionOpacity,
            transform: [{ scale: leftActionScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[leftActionColor, leftActionColor + 'dd']}
          style={styles.actionGradient}
        >
          <Ionicons name={leftActionIcon} size={28} color="#ffffff" />
          <Text style={styles.actionText}>
            {onComplete ? 'Tamamla' : 'Düzenle'}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Right Action (Delete) */}
      <Animated.View
        style={[
          styles.actionContainer,
          styles.rightAction,
          {
            opacity: rightActionOpacity,
            transform: [{ scale: rightActionScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[rightActionColor + 'dd', rightActionColor]}
          style={styles.actionGradient}
        >
          <Ionicons name={rightActionIcon} size={28} color="#ffffff" />
          <Text style={styles.actionText}>Sil</Text>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

interface SwipeableTaskCardProps {
  task: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
  };
  onDelete: () => void;
  onComplete: () => void;
  onPress: () => void;
}

export function SwipeableTaskCard({ task, onDelete, onComplete, onPress }: SwipeableTaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.priority.high;
      case 'medium': return theme.colors.priority.medium;
      case 'low': return theme.colors.priority.low;
      default: return theme.colors.text.muted;
    }
  };

  return (
    <SwipeableCard
      onDelete={onDelete}
      onComplete={task.status !== 'completed' ? onComplete : undefined}
      leftActionIcon={task.status === 'completed' ? 'refresh' : 'checkmark-circle'}
    >
      <TouchableOpacity
        style={styles.taskCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskTitle,
                task.status === 'completed' && styles.taskTitleCompleted,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {task.deadline && (
              <View style={styles.taskMeta}>
                <Ionicons name="calendar-outline" size={12} color={theme.colors.text.muted} />
                <Text style={styles.taskDeadline}>{task.deadline}</Text>
              </View>
            )}
          </View>
          {task.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent.success} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SwipeableCard>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  actionGradient: {
    width: ACTION_WIDTH,
    height: '100%',
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  content: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  taskCard: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDeadline: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  completedBadge: {
    marginLeft: 8,
  },
});
