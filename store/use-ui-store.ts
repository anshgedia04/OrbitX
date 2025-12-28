import { create } from 'zustand';

interface UIState {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;

    foldersUpdated: number;
    triggerFolderRefresh: () => void;

    // Storage
    storageUsage: { used: number; limit: number };
    setStorageUsage: (usage: { used: number; limit: number }) => void;

    // Modals
    isStorageLimitModalOpen: boolean;
    setStorageLimitModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    viewMode: 'grid',
    setViewMode: (mode) => set({ viewMode: mode }),

    foldersUpdated: 0,
    triggerFolderRefresh: () => set((state) => ({ foldersUpdated: state.foldersUpdated + 1 })),

    storageUsage: { used: 0, limit: 40 * 1024 * 1024 }, // Default 40MB
    setStorageUsage: (usage) => set({ storageUsage: usage }),

    isStorageLimitModalOpen: false,
    setStorageLimitModalOpen: (open) => set({ isStorageLimitModalOpen: open }),
}));
