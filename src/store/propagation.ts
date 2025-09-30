import { defineStore } from 'pinia';

interface PropData {
  sfi: number;
  aIndex: number;
  kIndex: number;
}

export const usePropagationStore = defineStore('propagation', {
  state: () => ({
    propData: {
      sfi: 153,
      aIndex: 6,
      kIndex: 2,
    } as PropData,
  }),

  actions: {
    async updatePropagationData() {
      // TODO: Implement actual propagation data fetching
      // For now using mock data
    },
  },
});
