export type Category = 'photos' | 'videos' | 'music' | 'files' | 'contacts';

export interface ScannedFile {
  id: string;
  name: string;
  uri: string;
  size?: number;
  createdAt?: number;
  modifiedAt?: number;
  type: Category;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
}

export interface ScannedContact {
  id: string;
  name: string;
  phones?: string[];
  emails?: string[];
  imageUri?: string;
}

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

export interface ScanState {
  status: ScanStatus;
  files: ScannedFile[];
  contacts: ScannedContact[];
}

export const CATEGORY_CONFIG: Record<Category, {
  label: string;
  icon: string;
  color: string;
  gradient: [string, string];
  description: string;
}> = {
  photos: {
    label: 'Photos',
    icon: 'images-outline',
    color: '#00CFFF',
    gradient: ['#0066AA', '#00CFFF'],
    description: 'Recover deleted images',
  },
  videos: {
    label: 'Videos',
    icon: 'videocam-outline',
    color: '#9B59FF',
    gradient: ['#5500CC', '#9B59FF'],
    description: 'Find lost video files',
  },
  music: {
    label: 'Music',
    icon: 'musical-notes-outline',
    color: '#00E87A',
    gradient: ['#006633', '#00E87A'],
    description: 'Restore audio tracks',
  },
  files: {
    label: 'Files',
    icon: 'document-outline',
    color: '#FFB300',
    gradient: ['#994400', '#FFB300'],
    description: 'Recover documents',
  },
  contacts: {
    label: 'Contacts',
    icon: 'people-outline',
    color: '#FF5577',
    gradient: ['#880033', '#FF5577'],
    description: 'Backup lost contacts',
  },
};
