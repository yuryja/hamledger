import { defineStore } from 'pinia';
import type { PropagationData, WWVData } from '../types/propagation';

declare global {
  interface Window {
    electronAPI: {
      fetchPropagationData: () => Promise<{ success: boolean; data?: WWVData[]; error?: string }>;
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
          };
        } else {
          this.error = response.error || 'Nem sikerült betölteni a propagációs adatokat';
        }
      } catch (error) {
        console.error('Hiba a propagációs adatok betöltésekor:', error);
        this.error = 'Hálózati hiba történt';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
