import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Category, ScannedFile, ScannedContact } from '@/types/recovery';

/* eslint-disable @typescript-eslint/no-require-imports */
let MediaLibrary: typeof import('expo-media-library') | null = null;
let ExpoContacts: typeof import('expo-contacts') | null = null;

if (Platform.OS !== 'web') {
  MediaLibrary = require('expo-media-library');
  ExpoContacts = require('expo-contacts');
}

export async function requestPermissions(category: Category): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (category === 'photos' || category === 'videos' || category === 'music') {
    if (!MediaLibrary) return false;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  if (category === 'contacts') {
    if (!ExpoContacts) return false;
    const { status } = await ExpoContacts.requestPermissionsAsync();
    return status === 'granted';
  }

  return true; // files — sandbox only
}

export async function scanCategory(
  category: Category,
  onFile: (file: ScannedFile) => void,
  onContact: (contact: ScannedContact) => void,
  signal: AbortSignal
): Promise<void> {
  if (Platform.OS === 'web') return;

  switch (category) {
    case 'photos':
      await scanMedia('photo', 'photos', onFile, signal);
      break;
    case 'videos':
      await scanMedia('video', 'videos', onFile, signal);
      break;
    case 'music':
      await scanMedia('audio', 'music', onFile, signal);
      break;
    case 'contacts':
      await scanContacts(onContact, signal);
      break;
    case 'files':
      await scanFiles(onFile, signal);
      break;
  }
}

async function scanMedia(
  mediaType: 'photo' | 'video' | 'audio',
  category: Category,
  onFile: (file: ScannedFile) => void,
  signal: AbortSignal
): Promise<void> {
  if (!MediaLibrary) return;

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore && !signal.aborted) {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: mediaType as Parameters<typeof MediaLibrary.getAssetsAsync>[0]['mediaType'],
      first: 30,
      after: cursor,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    for (const asset of result.assets) {
      if (signal.aborted) break;
      onFile({
        id: asset.id,
        name: asset.filename,
        uri: asset.uri,
        createdAt: asset.creationTime,
        modifiedAt: asset.modificationTime,
        type: category,
        thumbnail: asset.uri,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      });
      await sleep(18);
    }

    hasMore = result.hasNextPage;
    cursor = result.endCursor;
    if (hasMore) await sleep(60);
  }
}

async function scanContacts(
  onContact: (contact: ScannedContact) => void,
  signal: AbortSignal
): Promise<void> {
  if (!ExpoContacts) return;

  const { data } = await ExpoContacts.getContactsAsync({
    fields: [
      ExpoContacts.Fields.Name,
      ExpoContacts.Fields.PhoneNumbers,
      ExpoContacts.Fields.Emails,
      ExpoContacts.Fields.Image,
    ],
  });

  for (const c of data) {
    if (signal.aborted) break;
    onContact({
      id: c.id ?? String(Math.random()),
      name: c.name ?? 'Unknown',
      phones: c.phoneNumbers?.map(p => p.number ?? '').filter(Boolean) ?? [],
      emails: c.emails?.map(e => e.email ?? '').filter(Boolean) ?? [],
      imageUri: c.imageAvailable ? c.image?.uri : undefined,
    });
    await sleep(22);
  }
}

async function scanFiles(
  onFile: (file: ScannedFile) => void,
  signal: AbortSignal
): Promise<void> {
  const dirs = [FileSystem.documentDirectory, FileSystem.cacheDirectory].filter(
    (d): d is string => !!d
  );
  for (const dir of dirs) {
    if (signal.aborted) break;
    await scanDir(dir, onFile, signal, 0);
  }
}

async function scanDir(
  dir: string,
  onFile: (file: ScannedFile) => void,
  signal: AbortSignal,
  depth: number
): Promise<void> {
  if (depth > 3 || signal.aborted) return;
  try {
    const entries = await FileSystem.readDirectoryAsync(dir);
    for (const entry of entries) {
      if (signal.aborted) break;
      const uri = (dir.endsWith('/') ? dir : dir + '/') + entry;
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if ((info as { isDirectory?: boolean }).isDirectory) {
          await scanDir(uri + '/', onFile, signal, depth + 1);
        } else {
          onFile({
            id: uri,
            name: entry,
            uri,
            size: (info as { size?: number }).size,
            modifiedAt: (info as { modificationTime?: number }).modificationTime,
            type: 'files',
          });
          await sleep(25);
        }
      } catch (_) {}
    }
  } catch (_) {}
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}
