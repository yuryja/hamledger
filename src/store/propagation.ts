import { defineStore } from 'pinia';
import type { PropagationData } from '../types/propagation';
import '../types/electron';

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
