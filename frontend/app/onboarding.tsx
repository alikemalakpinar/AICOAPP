import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: [string, string];
  bgElements: { size: number; top: number; left: number; opacity: number }[];
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    icon: 'rocket',
    title: 'Fikirleri Eyleme\nDönüştürün',
    description: 'Projelerinizi organize edin, görevler atayın ve her adımı takip edin.',
    gradient: ['#00d4ff', '#0099cc'],
    bgElements: [
      { size: 200, top: 50, left: -50, opacity: 0.1 },
      { size: 150, top: 200, left: width - 100, opacity: 0.08 },
      { size: 100, top: 350, left: 50, opacity: 0.06 },
    ],
  },
  {
    id: '2',
    icon: 'people',
    title: 'Takımınızla\nBirlikte Çalışın',
    description: 'Ekibinizi davet edin, görevleri paylaşın ve gerçek zamanlı işbirliği yapın.',
    gradient: ['#8b5cf6', '#7c3aed'],
    bgElements: [
      { size: 180, top: 80, left: width - 80, opacity: 0.1 },
      { size: 120, top: 250, left: -30, opacity: 0.08 },
      { size: 90, top: 400, left: width - 60, opacity: 0.06 },
    ],
  },
  {
    id: '3',
    icon: 'analytics',
    title: 'İlerlemenizi\nTakip Edin',
    description: 'Detaylı analizlerle projelerinizin durumunu anlık olarak görün.',
    gradient: ['#10b981', '#059669'],
    bgElements: [
      { size: 160, top: 100, left: 30, opacity: 0.1 },
      { size: 140, top: 280, left: width - 100, opacity: 0.08 },
      { size: 80, top: 420, left: -20, opacity: 0.06 },
    ],
  },
  {
    id: '4',
    icon: 'checkmark-done-circle',
    title: 'Başarıya\nUlaşın',
    description: 'Hedeflerinize ulaşın ve başarılarınızı kutlayın. Şimdi başlayın!',
    gradient: ['#f59e0b', '#d97706'],
    bgElements: [
      { size: 190, top: 60, left: width - 90, opacity: 0.1 },
      { size: 130, top: 220, left: -40, opacity: 0.08 },
      { size: 100, top: 380, left: width / 2 - 50, opacity: 0.06 },
    ],
  },
];

function OnboardingSlide({ item, index, scrollX }: { item: OnboardingItem; index: number; scrollX: Animated.Value }) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [50, 0, 50],
    extrapolate: 'clamp',
  });

  const iconRotate = scrollX.interpolate({
    inputRange,
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.slide}>
      {/* Background Elements */}
      {item.bgElements.map((el, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bgElement,
            {
              width: el.size,
              height: el.size,
              top: el.top,
              left: el.left,
              opacity: el.opacity,
              borderRadius: el.size / 2,
              backgroundColor: item.gradient[0],
              transform: [{ scale }],
            },
          ]}
        />
      ))}

      {/* Icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale }, { translateY }, { rotate: iconRotate }],
            opacity,
          },
        ]}
      >
        <View style={styles.icon3DLayer3}>
          <LinearGradient
            colors={[item.gradient[0] + '30', item.gradient[1] + '20']}
            style={styles.icon3DGradient}
          />
        </View>
        <View style={styles.icon3DLayer2}>
          <LinearGradient
            colors={[item.gradient[0] + '50', item.gradient[1] + '40']}
            style={styles.icon3DGradient}
          />
        </View>
        <LinearGradient
          colors={item.gradient}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={64} color="#ffffff" />
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
}

function Pagination({ data, scrollX }: { data: OnboardingItem[]; scrollX: Animated.Value }) {
  return (
    <View style={styles.pagination}>
      {data.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      router.replace('/(auth)/login');
    }
  };

  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={theme.colors.gradients.primary} style={styles.logo}>
                <Text style={styles.logoText}>A</Text>
              </LinearGradient>
              <Text style={styles.logoName}>AICO</Text>
            </View>
            {!isLastSlide && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Geç</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <FlatList
              ref={flatListRef}
              data={onboardingData}
              renderItem={({ item, index }) => (
                <OnboardingSlide item={item} index={index} scrollX={scrollX} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              scrollEventThrottle={16}
            />
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Pagination data={onboardingData} scrollX={scrollX} />

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={onboardingData[currentIndex].gradient}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextButtonText}>
                  {isLastSlide ? 'Başlayın' : 'Devam'}
                </Text>
                <Ionicons
                  name={isLastSlide ? 'checkmark' : 'arrow-forward'}
                  size={24}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  bgElement: {
    position: 'absolute',
  },
  iconContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon3DLayer3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 48,
    transform: [{ rotate: '15deg' }, { translateX: 15 }, { translateY: 15 }],
    overflow: 'hidden',
  },
  icon3DLayer2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 48,
    transform: [{ rotate: '8deg' }, { translateX: 8 }, { translateY: 8 }],
    overflow: 'hidden',
  },
  icon3DGradient: {
    flex: 1,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 42,
  },
  description: {
    fontSize: 17,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
