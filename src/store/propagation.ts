/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import type { PropagationData } from '../types/propagation';

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
    };
  }
}

export const usePropagationStore = defineStore('propagation', {
  state: () => ({
    propData: {
      sfi: 153,
      aIndex: 6,
      kIndex: 2,
      lastUpdated: undefined,
      station: undefined,
    } as PropagationData,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async updatePropagationData() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await window.electronAPI.fetchPropagationData();
        
        if (response.success && response.data && response.data.length > 0) {
          // Használjuk a legfrissebb adatot (első elem)
          const latestData = response.data[0];
          
          this.propData = {
            sfi: latestData.sfi,
            aIndex: latestData.a,
            kIndex: latestData.k,
            lastUpdated: latestData.time,
            station: latestData.station,
            aurora: latestData.aurora,
          };
        } else {
          this.error = response.error || 'Failed to load propagation data';
        }
      } catch (error) {
        console.error('Error loading propagation data:', error);
        this.error = 'Network error occurred';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
