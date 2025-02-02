// src/electron/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{imported: boolean, count?: number, error?: any}>;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<void>;
      updateQso: (qso: any) => Promise<any>;
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  addQso: (qso: any) => ipcRenderer.invoke('qso:add', qso),
  getAllDocs: () => ipcRenderer.invoke('qso:getAllDocs'),
  importAdif: () => ipcRenderer.invoke('adif:import'),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  updateQso: (qso: any) => ipcRenderer.invoke('qso:update', qso)
})
