import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRecovery } from '@/context/RecoveryContext';
import { RadarScanner } from '@/components/RadarScanner';
import { Category, CATEGORY_CONFIG } from '@/types/recovery';
import { requestPermissions, scanCategory } from '@/utils/scanner';

export default function ScanScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cat = (category as Category) ?? 'photos';
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { startScan, addFile, addContact, setScanStatus, scanState } = useRecovery();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);

  const abortRef = useRef(new AbortController());
  const config = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.photos;
  const state = scanState[cat];

  const isDone = state?.status === 'done';
  const isError = state?.status === 'error' || permissionDenied;
  const totalFound = (state?.files?.length ?? 0) + (state?.contacts?.length ?? 0);

  useEffect(() => {
    abortRef.current = new AbortController();
    startScan(cat);

    async function run() {
      if (Platform.OS === 'web') {
        setScanStatus(cat, 'error');
        setPermissionDenied(true);
        return;
      }
      const granted = await requestPermissions(cat);
      if (!granted) {
        setPermissionDenied(true);
        setScanStatus(cat, 'error');
        return;
      }

      await scanCategory(
        cat,
        (file) => {
          addFile(cat, file);
          setRecentItems(prev => [file.name, ...prev.slice(0, 9)]);
        },
        (contact) => {
          addContact(cat, contact);
          setRecentItems(prev => [contact.name, ...prev.slice(0, 9)]);
        },
        abortRef.current.signal
      );

      if (!abortRef.current.signal.aborted) {
        setScanStatus(cat, 'done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    run();
    return () => { abortRef.current.abort(); };
  }, [cat]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleStop = () => {
    abortRef.current.abort();
    setScanStatus(cat, 'done');
  };

  const handleViewResults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/results/${cat}`);
  };

  const handleBack = () => {
    abortRef.current.abort();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerDot, { backgroundColor: config.color }]} />
          <Text style={styles.headerTitle}>{config.label} Recovery</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Radar */}
      <View style={styles.radarSection}>
        <RadarScanner isScanning={!isDone && !isError} color={config.color} isDone={isDone} />

        <View style={styles.countBlock}>
          <Text style={[styles.countNum, { color: config.color }]}>
            {totalFound.toLocaleString()}
          </Text>
          <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
            {isDone ? 'recoverable files found' : 'files detected'}
          </Text>
        </View>

        {/* Status */}
        {!isDone && !isError && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              Deep scanning device storage...
            </Text>
          </View>
        )}
        {isDone && !isError && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Scan complete</Text>
          </View>
        )}
        {isError && (
          <View style={styles.statusRow}>
            <Ionicons name="lock-closed" size={16} color={colors.destructive} />
            <Text style={[styles.statusText, { color: colors.destructive }]}>
              {Platform.OS === 'web' ? 'Not available on web' : 'Permission denied'}
            </Text>
          </View>
        )}
      </View>

      {/* Live feed */}
      <View style={[styles.feedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.feedHeader}>
          <View style={[styles.feedDotLive, { backgroundColor: isDone ? colors.success : config.color }]} />
          <Text style={[styles.feedTitle, { color: colors.mutedForeground }]}>
            {isDone ? 'SCAN LOG' : 'LIVE SCAN'}
          </Text>
          {!isDone && !isError && totalFound > 0 && (
            <View style={[styles.liveBadge, { backgroundColor: config.color + '22', borderColor: config.color + '44' }]}>
              <Text style={[styles.liveBadgeText, { color: config.color }]}>ACTIVE</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.feedList} showsVerticalScrollIndicator={false}>
          {recentItems.length === 0 ? (
            <Text style={[styles.feedEmpty, { color: colors.mutedForeground }]}>
              {isError ? 'Grant permission to start scanning' : 'Initializing scanner...'}
            </Text>
          ) : (
            recentItems.map((name, i) => (
              <View key={`${name}-${i}`} style={styles.feedItem}>
                <View style={[
                  styles.feedItemDot,
                  { backgroundColor: i === 0 ? config.color : colors.border }
                ]} />
                <Text
                  style={[styles.feedItemText, {
                    color: i === 0 ? colors.foreground : colors.mutedForeground,
                    opacity: i === 0 ? 1 : Math.max(0.25, 1 - i * 0.1),
                  }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottom, { paddingBottom: bottomPad + 16 }]}>
        {isDone && totalFound > 0 && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: config.color }]}
            onPress={handleViewResults}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: colors.background }]}>
              View {totalFound.toLocaleString()} Recoverable Files
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.background} />
          </TouchableOpacity>
        )}

        {isDone && totalFound === 0 && !isError && (
          <View style={[styles.emptyResult, { borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.emptyResultText, { color: colors.mutedForeground }]}>
              No recoverable {config.label.toLowerCase()} found
            </Text>
          </View>
        )}

        {!isDone && !isError && (
          <TouchableOpacity
            style={[styles.stopBtn, { borderColor: colors.border }]}
            onPress={handleStop}
            activeOpacity={0.75}
          >
            <Ionicons name="stop-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Stop Scan</Text>
          </TouchableOpacity>
        )}

        {isError && (
          <TouchableOpacity
            style={[styles.stopBtn, { borderColor: colors.border }]}
            onPress={handleBack}
            activeOpacity={0.75}
          >
            <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  radarSection: { alignItems: 'center', paddingVertical: 28 },
  countBlock: { alignItems: 'center', marginTop: 20 },
  countNum: { fontSize: 48, fontFamily: 'Inter_700Bold', lineHeight: 56 },
  countLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  feedCard: {
    marginHorizontal: 18, borderRadius: 20, borderWidth: 1,
    padding: 16, flex: 1,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  feedDotLive: { width: 6, height: 6, borderRadius: 3 },
  feedTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  liveBadge: {
    marginLeft: 'auto' as any, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  liveBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  feedList: { flex: 1 },
  feedEmpty: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 16 },
  feedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5,
  },
  feedItemDot: { width: 5, height: 5, borderRadius: 2.5, flexShrink: 0 },
  feedItemText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  bottom: { paddingHorizontal: 18, paddingTop: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 16, gap: 10,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyResult: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
  },
  emptyResultText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
  },
  stopBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
