// src/electron/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{imported: boolean, count?: number, error?: any}>;
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  addQso: (qso: any) => ipcRenderer.invoke('qso:add', qso),
  getAllDocs: () => ipcRenderer.invoke('qso:getAllDocs'),
  importAdif: () => ipcRenderer.invoke('adif:import')
})
