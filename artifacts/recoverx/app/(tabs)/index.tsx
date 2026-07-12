import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Platform,
  Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRecovery } from '@/context/RecoveryContext';
import { CategoryCard } from '@/components/CategoryCard';
import { Category } from '@/types/recovery';

const { width } = Dimensions.get('window');
const CATEGORIES: Category[] = ['photos', 'videos', 'music', 'files', 'contacts'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { scanState } = useRecovery();
  const scrollY = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handlePress = (category: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/scan/${category}`);
  };

  const totalFound = CATEGORIES.reduce((acc, cat) => {
    return acc + scanState[cat].files.length + scanState[cat].contacts.length;
  }, 0);

  const completedScans = CATEGORIES.filter(
    cat => scanState[cat].status === 'done'
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Sticky header border (appears on scroll) */}
      <Animated.View
        style={[styles.stickyBorder, { opacity: headerOpacity, borderColor: colors.border }]}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* Logo header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={['#0044AA', '#00CFFF']}
              style={styles.logoIcon}
            >
              <Ionicons name="shield-checkmark" size={22} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.logoText}>RecoverX</Text>
              <Text style={[styles.logoSub, { color: colors.mutedForeground }]}>
                Deep Recovery Engine
              </Text>
            </View>
          </View>
        </View>

        {/* Stats bar */}
        {completedScans > 0 && (
          <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#00CFFF' }]}>{totalFound.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Files Found</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#00E87A' }]}>{completedScans}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Scans Done</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#FFB300' }]}>
                {CATEGORIES.length - completedScans}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
            </View>
          </View>
        )}

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Choose Recovery Type
          </Text>
          <View style={[styles.sectionLine, { backgroundColor: '#00CFFF' }]} />
        </View>

        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Deep scan your device to find recoverable data
        </Text>

        {/* 2-column category grid */}
        <View style={styles.grid}>
          {CATEGORIES.slice(0, 4).map((cat, i) => (
            <CategoryCard
              key={cat}
              category={cat}
              scannedCount={
                scanState[cat].files.length + scanState[cat].contacts.length || undefined
              }
              onPress={() => handlePress(cat)}
              delay={i * 80}
            />
          ))}
        </View>

        {/* Contacts full-width card */}
        <View style={styles.fullWidthCard}>
          <CategoryCard
            key="contacts"
            category="contacts"
            scannedCount={
              scanState.contacts.contacts.length || undefined
            }
            onPress={() => handlePress('contacts')}
            delay={320}
          />
        </View>

        {/* Info note */}
        <View style={[styles.infoBox, { backgroundColor: '#00CFFF11', borderColor: '#00CFFF22' }]}>
          <Ionicons name="information-circle-outline" size={16} color="#00CFFF" />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Scan continues in background. Results persist between sessions.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18 },
  stickyBorder: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 1, borderBottomWidth: 1, zIndex: 10,
  },
  header: { marginBottom: 22 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 26, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: -0.5,
  },
  logoSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statsBar: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 26, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, height: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sectionLine: { flex: 1, height: 1.5, borderRadius: 1, opacity: 0.4 },
  sectionSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  fullWidthCard: { width: '100%' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
