import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  setLoading: (status: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (status) => set({ isLoading: status }),
}));
