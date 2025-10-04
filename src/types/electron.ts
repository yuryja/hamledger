/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{ imported: boolean; count?: number; error?: any }>;
      selectAdifFile: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
      parseAdifFile: (
        filePath: string
      ) => Promise<{ success: boolean; totalCount?: number; error?: string }>;
      importAdifWithProgress: (
        filePath: string
      ) => Promise<{ success: boolean; count?: number; error?: string }>;
      onAdifImportProgress: (callback: (progress: { imported: number }) => void) => void;
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
      rigctldCommand: (
        command: string
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldGetCapabilities: () => Promise<{ success: boolean; data?: any; error?: string }>;
      executeCommand: (
        command: string
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      rigctldRestart: () => Promise<{ success: boolean; data?: any; error?: string }>;
      wsjtxStart: (port?: number) => Promise<{ success: boolean; error?: string }>;
      wsjtxStop: () => Promise<{ success: boolean; error?: string }>;
      wsjtxStatus: () => Promise<{ success: boolean; data?: { enabled: boolean; running: boolean } }>;
      onWSJTXDecode: (callback: (decode: any) => void) => void;
      onWSJTXQSOLogged: (callback: (qso: any) => void) => void;
    };
  }
}

export {};
