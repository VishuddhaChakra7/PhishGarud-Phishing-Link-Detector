import { create } from 'zustand';

export interface ScanState {
  activeScanId: string | null;
  isScanning: boolean;
  scanStep: string;
  completedStages: string[];
  scanResult: any | null;
  whois: any | null;
  ssl: any | null;
  redirects: any | null;
  page: any | null;
  brand: any | null;
  threats: any | null;
  
  // Actions
  startNewScan: (scanId: string) => void;
  setScanning: (status: boolean) => void;
  setScanStep: (step: string) => void;
  addCompletedStage: (stage: string) => void;
  updateStageData: (stage: string, data: any) => void;
  setFinalResult: (result: any) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  activeScanId: null,
  isScanning: false,
  scanStep: "Initializing scanner...",
  completedStages: [],
  scanResult: null,
  whois: null,
  ssl: null,
  redirects: null,
  page: null,
  brand: null,
  threats: null,

  startNewScan: (scanId) => set({
    activeScanId: scanId,
    isScanning: true,
    scanStep: "Analyzing lexical patterns...",
    completedStages: [],
    scanResult: null,
    whois: null,
    ssl: null,
    redirects: null,
    page: null,
    brand: null,
    threats: null,
  }),
  
  setScanning: (status) => set({ isScanning: status }),
  setScanStep: (step) => set({ scanStep: step }),
  addCompletedStage: (stage) => set((state) => ({
    completedStages: [...state.completedStages, stage]
  })),
  
  updateStageData: (stage, data) => set(() => {
    const updates: Partial<ScanState> = {};
    if (stage === 'whois') updates.whois = data;
    else if (stage === 'ssl') updates.ssl = data;
    else if (stage === 'redirects') updates.redirects = data;
    else if (stage === 'page') updates.page = data;
    else if (stage === 'brand') updates.brand = data;
    else if (stage === 'threats') updates.threats = data;
    return updates;
  }),
  
  setFinalResult: (result) => set({
    scanResult: result,
    isScanning: false,
    whois: result.whois,
    ssl: result.ssl,
    redirects: result.redirects,
    page: result.page_analysis,
    brand: result.brand_match,
    threats: result.threat_feeds,
  }),
  
  resetScan: () => set({
    activeScanId: null,
    isScanning: false,
    scanStep: "",
    completedStages: [],
    scanResult: null,
    whois: null,
    ssl: null,
    redirects: null,
    page: null,
    brand: null,
    threats: null,
  })
}));
