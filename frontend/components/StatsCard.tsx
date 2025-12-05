import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  colors: readonly [string, string, ...string[]];
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, colors, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={32} color="#ffffff" />
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '47%',
    marginBottom: 12,
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
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
});
