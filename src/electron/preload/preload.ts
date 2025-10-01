/* eslint-disable @typescript-eslint/no-explicit-any */
// src/electron/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import '../../types/electron';

contextBridge.exposeInMainWorld('electronAPI', {
  addQso: (qso: any) => ipcRenderer.invoke('qso:add', qso),
  getAllDocs: () => ipcRenderer.invoke('qso:getAllDocs'),
  importAdif: () => ipcRenderer.invoke('adif:import'),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  updateQso: (qso: any) => ipcRenderer.invoke('qso:update', qso),
  fetchDxSpots: (params: string) => ipcRenderer.invoke('fetchDxSpots', params),
  fetchPropagationData: () => ipcRenderer.invoke('fetchPropagationData'),
  fetchWeather: (lat: number, lon: number) => ipcRenderer.invoke('fetchWeather', lat, lon),
});
