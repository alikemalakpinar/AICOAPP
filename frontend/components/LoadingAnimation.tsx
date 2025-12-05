import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../theme';

interface LoadingAnimationProps {
  size?: number;
  message?: string;
}

export const LoadingAnimation = ({ size = 100, message }: LoadingAnimationProps) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/loading.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export const SuccessAnimation = ({ size = 80, message }: LoadingAnimationProps) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/success.json')}
        autoPlay
        loop={false}
        style={{ width: size, height: size }}
      />
      {message && <Text style={styles.successMessage}>{message}</Text>}
    </View>
  );
};

export const EmptyAnimation = ({ size = 120, message }: LoadingAnimationProps) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/empty.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
    </View>
  );
};

export const RocketAnimation = ({ size = 100 }: { size?: number }) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/rocket.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  successMessage: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.semantic.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyMessage: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
