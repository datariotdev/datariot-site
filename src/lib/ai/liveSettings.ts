import { create } from 'zustand';
export const useOrvelisLive = create<{ enabled: boolean; toggle: () => void }>((set) => ({
    enabled: true, toggle: () => set(state => ({ enabled: !state.enabled })),
}));
