import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...theme.animation.springBouncy,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/dashboard');
        } else {
          router.replace('/(auth)/login');
        }
      }, 800);
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={theme.gradients.primaryVibrant}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>A</Text>
            </LinearGradient>
            {/* 3D Shadow */}
            <View style={styles.logo3DShadow} />
          </Animated.View>
          <Text style={styles.appName}>AICO</Text>
          <Text style={styles.tagline}>Proje Yonetimi</Text>

          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../assets/animations/loading.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.glow,
  },
  logo3DShadow: {
    position: 'absolute',
    bottom: -8,
    left: 15,
    right: 15,
    height: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 30,
    transform: [{ scaleY: 0.3 }],
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  lottie: {
    width: 80,
    height: 80,
  },
});
