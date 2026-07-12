import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, ScanState, ScanStatus, ScannedFile, ScannedContact } from '@/types/recovery';

const DEFAULT_STATE: ScanState = { status: 'idle', files: [], contacts: [] };

interface RecoveryContextValue {
  scanState: Record<Category, ScanState>;
  startScan: (category: Category) => void;
  addFile: (category: Category, file: ScannedFile) => void;
  addContact: (category: Category, contact: ScannedContact) => void;
  setScanStatus: (category: Category, status: ScanStatus) => void;
  clearScan: (category: Category) => void;
  markRecovered: (category: Category, ids: string[]) => void;
  recoveredIds: Set<string>;
}

const RecoveryContext = createContext<RecoveryContextValue | null>(null);

export function RecoveryProvider({ children }: { children: ReactNode }) {
  const [scanState, setScanState] = useState<Record<Category, ScanState>>({
    photos: { ...DEFAULT_STATE },
    videos: { ...DEFAULT_STATE },
    music: { ...DEFAULT_STATE },
    files: { ...DEFAULT_STATE },
    contacts: { ...DEFAULT_STATE },
  });
  const [recoveredIds, setRecoveredIds] = useState<Set<string>>(new Set());

  const startScan = useCallback((category: Category) => {
    setScanState(prev => ({
      ...prev,
      [category]: { status: 'scanning', files: [], contacts: [] },
    }));
  }, []);

  const addFile = useCallback((category: Category, file: ScannedFile) => {
    setScanState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        files: [...prev[category].files, file],
      },
    }));
  }, []);

  const addContact = useCallback((category: Category, contact: ScannedContact) => {
    setScanState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        contacts: [...prev[category].contacts, contact],
      },
    }));
  }, []);

  const setScanStatus = useCallback((category: Category, status: ScanStatus) => {
    setScanState(prev => ({
      ...prev,
      [category]: { ...prev[category], status },
    }));
  }, []);

  const clearScan = useCallback((category: Category) => {
    setScanState(prev => ({
      ...prev,
      [category]: { ...DEFAULT_STATE },
    }));
  }, []);

  const markRecovered = useCallback((category: Category, ids: string[]) => {
    setRecoveredIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    AsyncStorage.setItem('recoveredIds', JSON.stringify([...recoveredIds, ...ids]));
  }, [recoveredIds]);

  return (
    <RecoveryContext.Provider value={{
      scanState, startScan, addFile, addContact,
      setScanStatus, clearScan, markRecovered, recoveredIds,
    }}>
      {children}
    </RecoveryContext.Provider>
  );
}

export function useRecovery() {
  const ctx = useContext(RecoveryContext);
  if (!ctx) throw new Error('useRecovery must be used inside RecoveryProvider');
  return ctx;
}
