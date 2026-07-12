import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ScannedContact } from '@/types/recovery';

interface Props {
  contact: ScannedContact;
  selected: boolean;
  onToggle: () => void;
  accentColor: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = [
  '#FF5577', '#00CFFF', '#9B59FF', '#00E87A', '#FFB300',
  '#FF6B35', '#3498DB', '#E74C3C', '#2ECC71', '#9B59B6',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ContactItem({ contact, selected, onToggle, accentColor }: Props) {
  const colors = useColors();
  const bg = avatarColor(contact.name);
  const inits = initials(contact.name);
  const sub = contact.phones?.[0] ?? contact.emails?.[0] ?? '';

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      style={[
        styles.row,
        {
          backgroundColor: selected ? accentColor + '12' : colors.card,
          borderColor: selected ? accentColor + '55' : colors.border,
        },
      ]}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: bg + '33', borderColor: bg + '66' }]}>
        <Text style={[styles.initials, { color: bg }]}>{inits}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {contact.name}
        </Text>
        {sub ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>

      {/* Extras count */}
      {(contact.phones?.length ?? 0) + (contact.emails?.length ?? 0) > 1 && (
        <View style={[styles.extraBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
          <Ionicons name="call-outline" size={10} color={accentColor} />
          <Text style={[styles.extraText, { color: accentColor }]}>
            {contact.phones?.length ?? 0}
          </Text>
        </View>
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
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 8, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  extraBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  extraText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
});
