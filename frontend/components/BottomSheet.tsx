import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number | 'auto' | 'full';
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  scrollable?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  height = 'auto',
  showHandle = true,
  showCloseButton = true,
  closeOnBackdrop = true,
  scrollable = false,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const getSheetHeight = () => {
    if (height === 'full') return SCREEN_HEIGHT * 0.9;
    if (height === 'auto') return undefined;
    return height;
  };

  const sheetHeight = getSheetHeight();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOnBackdrop ? handleClose : undefined}
          >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            sheetHeight ? { height: sheetHeight } : {},
            { transform: [{ translateY }] },
          ]}
        >
          {showHandle && (
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ContentWrapper
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={scrollable ? styles.scrollContent : undefined}
          >
            {children}
          </ContentWrapper>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Action Sheet variant - list of actions
interface ActionSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, title, options }: ActionSheetProps) {
  const handleOptionPress = (option: ActionSheetOption) => {
    if (option.disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => option.onPress(), 200);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} showCloseButton={false}>
      <View style={actionStyles.options}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              actionStyles.option,
              option.disabled && actionStyles.optionDisabled,
              index === options.length - 1 && actionStyles.optionLast,
            ]}
            onPress={() => handleOptionPress(option)}
            activeOpacity={0.7}
            disabled={option.disabled}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={22}
                color={
                  option.disabled
                    ? theme.colors.text.disabled
                    : option.destructive
                    ? theme.colors.semantic.error
                    : theme.colors.text.primary
                }
                style={actionStyles.optionIcon}
              />
            )}
            <Text
              style={[
                actionStyles.optionLabel,
                option.destructive && actionStyles.optionDestructive,
                option.disabled && actionStyles.optionLabelDisabled,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={actionStyles.cancelButton} onPress={onClose} activeOpacity={0.7}>
        <Text style={actionStyles.cancelLabel}>İptal</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

// Selection Sheet variant - single select list
interface SelectionOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface SelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: SelectionOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function SelectionSheet({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectionSheetProps) {
  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(value);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={options.length > 6}>
      <View style={selectionStyles.options}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              selectionStyles.option,
              selectedValue === option.value && selectionStyles.optionSelected,
              index === options.length - 1 && selectionStyles.optionLast,
            ]}
            onPress={() => handleSelect(option.value)}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View
                style={[
                  selectionStyles.optionIconContainer,
                  { backgroundColor: (option.color || theme.colors.accent.primary) + '20' },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={option.color || theme.colors.accent.primary}
                />
              </View>
            )}
            <Text
              style={[
                selectionStyles.optionLabel,
                selectedValue === option.value && selectionStyles.optionLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            {selectedValue === option.value && (
              <Ionicons name="checkmark" size={22} color={theme.colors.accent.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    ...theme.shadows.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.medium,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

const actionStyles = StyleSheet.create({
  options: {
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  optionDestructive: {
    color: theme.colors.semantic.error,
  },
  optionLabelDisabled: {
    color: theme.colors.text.disabled,
  },
  cancelButton: {
    backgroundColor: theme.colors.background.elevated,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});

const selectionStyles = StyleSheet.create({
  options: {},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: theme.colors.accent.muted,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
});
