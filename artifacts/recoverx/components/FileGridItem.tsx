import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ScannedFile } from '@/types/recovery';

interface Props {
  item: ScannedFile;
  selected: boolean;
  recovered: boolean;
  onToggle: () => void;
  size: number;
}

export function FileGridItem({ item, selected, recovered, onToggle, size }: Props) {
  const colors = useColors();

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: item.thumbnail ?? item.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Dark overlay when selected */}
      {selected && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,207,255,0.25)' }]} />
      )}

      {/* Recovered badge */}
      {recovered && (
        <View style={[styles.recoveredBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={10} color="#000" />
        </View>
      )}

      {/* Video duration */}
      {item.type === 'videos' && item.duration && item.duration > 0 && (
        <View style={styles.duration}>
          <Ionicons name="play" size={8} color="#FFF" />
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      )}

      {/* Checkbox */}
      <View style={[
        styles.checkbox,
        selected
          ? { backgroundColor: '#00CFFF', borderColor: '#00CFFF' }
          : { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.5)' }
      ]}>
        {selected && <Ionicons name="checkmark" size={12} color="#060B15" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { margin: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#0D1929' },
  overlay: { ...StyleSheet.absoluteFillObject },
  checkbox: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  recoveredBadge: {
    position: 'absolute', top: 6, left: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  duration: {
    position: 'absolute', bottom: 4, right: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  durationText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_500Medium' },
});
