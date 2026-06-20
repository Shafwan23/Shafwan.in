import { create } from 'zustand';

interface AppState {
  isCanvasReady: boolean;
  setCanvasReady: (ready: boolean) => void;
  activePortal: string | null;
  setActivePortal: (portal: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isCanvasReady: false,
  setCanvasReady: (ready) => set({ isCanvasReady: ready }),
  activePortal: null,
  setActivePortal: (portal) => set({ activePortal: portal }),
}));
