import { create } from 'zustand';

interface Friend {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
}

interface ChatState {
    activeFriend: Friend | null;
    setActiveFriend: (friend: Friend | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    activeFriend: null,
    setActiveFriend: (friend) => set({ activeFriend: friend }),
}));
