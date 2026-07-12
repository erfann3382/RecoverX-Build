import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ScannedFile } from '@/types/recovery';

interface Props {
  item: ScannedFile;
  selected: boolean;
  recovered: boolean;
  onToggle: () => void;
  accentColor: string;
}

const EXT_ICONS: Record<string, string> = {
  mp3: 'musical-note', wav: 'musical-note', aac: 'musical-note', flac: 'musical-note', ogg: 'musical-note',
  pdf: 'document-text', doc: 'document-text', docx: 'document-text', txt: 'document-text',
  xls: 'grid', xlsx: 'grid', csv: 'grid',
  ppt: 'easel', pptx: 'easel',
  zip: 'archive', rar: 'archive', tar: 'archive',
  apk: 'phone-portrait',
};

function getIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_ICONS[ext] ?? 'document-outline';
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function FileListItem({ item, selected, recovered, onToggle, accentColor }: Props) {
  const colors = useColors();

  const icon = getIcon(item.name);
  const meta = item.duration && item.duration > 0
    ? formatDuration(item.duration)
    : formatSize(item.size);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      style={[
        styles.row,
        {
          backgroundColor: selected ? accentColor + '14' : colors.card,
          borderColor: selected ? accentColor + '55' : colors.border,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
        <Ionicons name={icon as any} size={20} color={accentColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{meta}</Text>
        ) : null}
      </View>

      {/* Recovered indicator */}
      {recovered && (
        <View style={[styles.recoveredDot, { backgroundColor: colors.success }]} />
      )}

      {/* Checkbox */}
      <View style={[
        styles.checkbox,
        selected
          ? { backgroundColor: accentColor, borderColor: accentColor }
          : { backgroundColor: 'transparent', borderColor: colors.border },
      ]}>
        {selected && <Ionicons name="checkmark" size={13} color="#060B15" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  recoveredDot: { width: 8, height: 8, borderRadius: 4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
});
