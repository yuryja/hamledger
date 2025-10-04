/* eslint-disable @typescript-eslint/no-explicit-any */
// src/electron/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  addQso: (qso: any) => ipcRenderer.invoke('qso:add', qso),
  getAllDocs: () => ipcRenderer.invoke('qso:getAllDocs'),
  importAdif: () => ipcRenderer.invoke('adif:import'),
  selectAdifFile: () => ipcRenderer.invoke('adif:selectFile'),
  parseAdifFile: (filePath: string) => ipcRenderer.invoke('adif:parseFile', filePath),
  importAdifWithProgress: (filePath: string) =>
    ipcRenderer.invoke('adif:importWithProgress', filePath),
  onAdifImportProgress: (callback: (progress: { imported: number }) => void) => {
    ipcRenderer.on('adif:importProgress', (_, progress) => callback(progress));
  },
  saveAdifFile: (content: string) => ipcRenderer.invoke('adif:saveFile', content),
  deleteQso: (qsoId: string) => ipcRenderer.invoke('qso:delete', qsoId),
  onHamlibDownloadProgress: (callback: (progress: { progress: number }) => void) => {
    ipcRenderer.on('hamlib:downloadProgress', (_, progress) => callback(progress));
  },
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  updateQso: (qso: any) => ipcRenderer.invoke('qso:update', qso),
  fetchDxSpots: (params: string) => ipcRenderer.invoke('fetchDxSpots', params),
  fetchPropagationData: () => ipcRenderer.invoke('fetchPropagationData'),
  fetchWeather: (lat: number, lon: number) => ipcRenderer.invoke('fetchWeather', lat, lon),
  rigctldConnect: (host: string, port: number, model?: number, device?: string) =>
    ipcRenderer.invoke('rigctld:connect', host, port, model, device),
  rigctldDisconnect: () => ipcRenderer.invoke('rigctld:disconnect'),
  rigctldCommand: (command: string) => ipcRenderer.invoke('rigctld:command', command),
  rigctldGetCapabilities: () => ipcRenderer.invoke('rigctld:capabilities'),
  rigctldRestart: () => ipcRenderer.invoke('rigctld:restart'),
  executeCommand: (command: string) => ipcRenderer.invoke('execute:command', command),
  downloadAndInstallHamlib: () => ipcRenderer.invoke('hamlib:downloadAndInstall'),
  checkRigctldInPath: () => ipcRenderer.invoke('hamlib:checkRigctldInPath'),
  addFirewallExceptions: () => ipcRenderer.invoke('firewall:addExceptions'),
});
