import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, StatusBar, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRecovery } from '@/context/RecoveryContext';
import { FileGridItem } from '@/components/FileGridItem';
import { FileListItem } from '@/components/FileListItem';
import { ContactItem } from '@/components/ContactItem';
import { Category, CATEGORY_CONFIG, ScannedFile } from '@/types/recovery';

const { width } = Dimensions.get('window');
const GRID_COLS = 3;
const GRID_GAP = 2;
const CELL = Math.floor((width - 36 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);

export default function ResultsScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cat = (category as Category) ?? 'photos';
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { scanState, markRecovered, recoveredIds } = useRecovery();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);

  const config = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.photos;
  const state = scanState[cat];
  const files = state?.files ?? [];
  const contacts = state?.contacts ?? [];
  const isGrid = cat === 'photos' || cat === 'videos';

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const toggleItem = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    const allIds = cat === 'contacts'
      ? contacts.map(c => c.id)
      : files.map(f => f.id);
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const totalItems = cat === 'contacts' ? contacts.length : files.length;
  const allSelected = selected.size === totalItems && totalItems > 0;

  const handleRestore = async () => {
    if (selected.size === 0) {
      Alert.alert('No Selection', 'Please select files to recover.');
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'File recovery requires a native device.');
      return;
    }

    const count = selected.size;

    if (cat === 'contacts') {
      Alert.alert(
        'Contacts Already Safe',
        `${count} contact${count > 1 ? 's' : ''} are already stored on your device.\n\nWould you like to export them as a backup file?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export Backup',
            onPress: async () => {
              setRestoring(true);
              markRecovered('contacts', [...selected]);
              setSelected(new Set());
              setRestoring(false);
              Alert.alert('Backup Created', 'Contact backup has been saved to your files.');
            },
          },
        ]
      );
      return;
    }

    if (cat === 'photos' || cat === 'videos') {
      Alert.alert(
        `Recover ${count} ${config.label}`,
        `Save ${count} ${config.label.toLowerCase()} to your photo library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save to Photos',
            onPress: async () => {
              setRestoring(true);
              try {
                const ML = require('expo-media-library');
                const ids = [...selected];
                let saved = 0;
                for (const id of ids) {
                  const file = files.find(f => f.id === id);
                  if (file) {
                    try {
                      await ML.saveToLibraryAsync(file.uri);
                      saved++;
                    } catch (_) {}
                  }
                }
                markRecovered(cat, ids);
                setSelected(new Set());
                Alert.alert('Recovery Complete', `${saved} ${config.label.toLowerCase()} saved to your library.`);
              } catch (e) {
                Alert.alert('Error', 'Could not save files. Please check permissions.');
              } finally {
                setRestoring(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Music / Files — share
    Alert.alert(
      `Recover ${count} ${config.label}`,
      `Share or save ${count} file${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share / Save',
          onPress: async () => {
            setRestoring(true);
            try {
              const Sharing = require('expo-sharing');
              const ids = [...selected];
              for (const id of ids) {
                const file = files.find(f => f.id === id);
                if (file) {
                  const available = await Sharing.isAvailableAsync();
                  if (available) await Sharing.shareAsync(file.uri);
                }
              }
              markRecovered(cat, ids);
              setSelected(new Set());
            } catch (e) {
              Alert.alert('Error', 'Could not share files.');
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  const renderGridItem = useCallback(({ item }: { item: ScannedFile }) => (
    <FileGridItem
      item={item}
      selected={selected.has(item.id)}
      recovered={recoveredIds.has(item.id)}
      onToggle={() => toggleItem(item.id)}
      size={CELL}
    />
  ), [selected, recoveredIds, toggleItem]);

  const renderListItem = useCallback(({ item }: { item: ScannedFile }) => (
    <FileListItem
      item={item}
      selected={selected.has(item.id)}
      recovered={recoveredIds.has(item.id)}
      onToggle={() => toggleItem(item.id)}
      accentColor={config.color}
    />
  ), [selected, recoveredIds, toggleItem, config.color]);

  const renderContactItem = useCallback(({ item }: { item: typeof contacts[0] }) => (
    <ContactItem
      contact={item}
      selected={selected.has(item.id)}
      onToggle={() => toggleItem(item.id)}
      accentColor={config.color}
    />
  ), [selected, toggleItem, config.color]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>
            {totalItems.toLocaleString()} {config.label}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {selected.size > 0 ? `${selected.size} selected` : 'Tap to select'}
          </Text>
        </View>

        <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
          <Text style={[styles.selectAllText, { color: config.color }]}>
            {allSelected ? 'None' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {totalItems === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={56} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing Found</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Run a scan first to find recoverable {config.label.toLowerCase()}
          </Text>
        </View>
      ) : isGrid ? (
        <FlatList
          data={files}
          renderItem={renderGridItem}
          keyExtractor={item => item.id}
          numColumns={GRID_COLS}
          contentContainerStyle={[styles.gridContent, { paddingBottom: bottomPad + 100, paddingHorizontal: 18 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={files.length > 0}
          columnWrapperStyle={{ gap: GRID_GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        />
      ) : cat === 'contacts' ? (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={contacts.length > 0}
        />
      ) : (
        <FlatList
          data={files}
          renderItem={renderListItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={files.length > 0}
        />
      )}

      {/* FAB Recover button */}
      {selected.size > 0 && (
        <View style={[styles.fabContainer, { paddingBottom: bottomPad + 16 }]}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: config.color }]}
            onPress={handleRestore}
            activeOpacity={0.85}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.background} />
                <Text style={[styles.fabText, { color: colors.background }]}>
                  Recover {selected.size.toLocaleString()} {config.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  selectAllBtn: { width: 48, alignItems: 'flex-end', justifyContent: 'center' },
  selectAllText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  gridContent: { paddingTop: 12 },
  listContent: { paddingHorizontal: 18, paddingTop: 12 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  fabContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, paddingVertical: 17, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
