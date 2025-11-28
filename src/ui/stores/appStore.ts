import { create } from 'zustand';
import type { PluginConfig, FrameInfo, FrameAnalysis, CritiqueResult } from '../../shared/types';

export type AppStatus = 'idle' | 'capturing' | 'extracting' | 'analyzing' | 'error';
export type AppView = 'main' | 'settings';

interface AppState {
  // Config
  config: PluginConfig | null;
  setConfig: (config: PluginConfig | null) => void;

  // View
  view: AppView;
  setView: (view: AppView) => void;

  // Frame selection
  selectedFrame: FrameInfo | null;
  setSelectedFrame: (frame: FrameInfo | null) => void;

  // Analysis state
  status: AppStatus;
  setStatus: (status: AppStatus) => void;

  // Analysis data
  screenshot: string | null;
  frameData: FrameAnalysis | null;
  setAnalysisData: (screenshot: string, frameData: FrameAnalysis) => void;

  // Critique result
  critique: CritiqueResult | null;
  setCritique: (critique: CritiqueResult | null) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Config
  config: null,
  setConfig: (config) => set({ config }),

  // View
  view: 'main',
  setView: (view) => set({ view }),

  // Frame selection
  selectedFrame: null,
  setSelectedFrame: (frame) => set({ selectedFrame: frame, critique: null, error: null }),

  // Analysis state
  status: 'idle',
  setStatus: (status) => set({ status }),

  // Analysis data
  screenshot: null,
  frameData: null,
  setAnalysisData: (screenshot, frameData) => set({ screenshot, frameData }),

  // Critique result
  critique: null,
  setCritique: (critique) => set({ critique, status: 'idle' }),

  // Error
  error: null,
  setError: (error) => set({ error, status: 'error' }),

  // Reset
  reset: () => set({
    status: 'idle',
    screenshot: null,
    frameData: null,
    critique: null,
    error: null,
  }),
}));
