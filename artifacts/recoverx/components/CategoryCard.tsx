import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Category, CATEGORY_CONFIG } from '@/types/recovery';

interface Props {
  category: Category;
  scannedCount?: number;
  onPress: () => void;
  delay?: number;
}

export function CategoryCard({ category, scannedCount, onPress, delay = 0 }: Props) {
  const colors = useColors();
  const config = CATEGORY_CONFIG[category];
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 500, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 500, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ scale }, { translateY }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={styles.touch}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={[styles.card, { borderColor: colors.border }]}
        >
          {/* Subtle glow background */}
          <View style={[styles.glowBg, { backgroundColor: config.color + '08' }]} />

          {/* Icon circle */}
          <View style={[styles.iconRing, { borderColor: config.color + '40' }]}>
            <LinearGradient
              colors={[config.gradient[0] + '55', config.gradient[1] + '33']}
              style={styles.iconBg}
            >
              <Ionicons name={config.icon as any} size={26} color={config.color} />
            </LinearGradient>
          </View>

          <Text style={styles.label}>{config.label}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>{config.description}</Text>

          {scannedCount !== undefined && scannedCount > 0 && (
            <View style={[styles.badge, { backgroundColor: config.color + '18', borderColor: config.color + '50' }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>
                {scannedCount.toLocaleString()} found
              </Text>
            </View>
          )}

          {/* Bottom gradient line */}
          <LinearGradient
            colors={[config.gradient[0], config.gradient[1]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.glowBar}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '48%', marginBottom: 14 },
  touch: { borderRadius: 20, overflow: 'hidden' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingBottom: 24,
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 170,
  },
  glowBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  iconRing: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14, overflow: 'hidden',
  },
  iconBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', marginBottom: 5 },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  badge: {
    marginTop: 10, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  glowBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
});
