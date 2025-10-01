/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{ imported: boolean; count?: number; error?: any }>;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<void>;
      updateQso: (qso: any) => Promise<any>;
      fetchDxSpots: (params: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      fetchPropagationData: () => Promise<{ success: boolean; data?: any; error?: string }>;
      fetchWeather: (
        lat: number,
        lon: number
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldConnect: (
        host: string,
        port: number,
        model?: number,
        device?: string
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldDisconnect: () => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldCommand: (command: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldGetCapabilities: () => Promise<{ success: boolean; data?: any; error?: string }>;
      executeCommand: (command: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldRestart: () => Promise<{ success: boolean; data?: any; error?: string }>;
    };
  }
}

export {};
