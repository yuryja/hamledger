import { defineStore } from 'pinia';
import type { DxClusterFilters, DxSpot } from '../types/dxCluster';

interface DxClusterState {
  spots: DxSpot[];
  loading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
  filters: DxClusterFilters;
}

export const useDxClusterStore = defineStore('dxCluster', {
  state: (): DxClusterState => ({
    spots: [],
    loading: false,
    error: null,
    lastFetchTime: null,
    filters: {
      selectedCdx: ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'],
      selectedCde: ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'],
      selectedBand: '40',
      selectedModes: ['PHONE'],
      validatedOnly: true,
      pageLength: 65,
    },
  }),

  getters: {
    actualFrequencyRange(): { min: number; max: number } {
      if (this.spots.length === 0) {
        // Fallback to band ranges if no spots
        const bandRanges: { [key: string]: { min: number; max: number } } = {
          '10': { min: 28000, max: 29700 },
          '15': { min: 21000, max: 21450 },
          '20': { min: 14000, max: 14350 },
          '40': { min: 7000, max: 7300 },
          '80': { min: 3500, max: 4000 },
          '160': { min: 1800, max: 2000 },
        };
        return bandRanges[this.filters.selectedBand] || { min: 14000, max: 14350 };
      }

      const frequencies = this.spots.map(spot => parseFloat(spot.Frequency));
      const minFreq = Math.min(...frequencies);
      const maxFreq = Math.max(...frequencies);

      // Add 5% padding on both sides
      const padding = (maxFreq - minFreq) * 0.05;

      return {
        min: Math.max(minFreq - padding, 0),
        max: maxFreq + padding,
      };
    },
  },

  actions: {
    async fetchSpots() {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        params.append('a', this.filters.pageLength.toString());
        params.append('b', this.filters.selectedBand);

        this.filters.selectedCdx.forEach(cdx => params.append('cdx', cdx));
        this.filters.selectedCde.forEach(cde => params.append('cde', cde));
        this.filters.selectedModes.forEach(mode => params.append('m', mode));

        if (this.filters.validatedOnly) {
          params.append('valid', '1');
        }

        const result = await window.electronAPI.fetchDxSpots(params.toString());

        if (!result.success) {
          throw new Error(result.error || 'API hívás sikertelen');
        }

        // Process and deduplicate spots
        const rawSpots = result.data.map((spot: DxSpot) => ({
          Nr: spot.Nr || 0,
          Spotter: spot.Spotter || '',
          Frequency: spot.Frequency || '0',
          DXCall: spot.DXCall || '',
          Time: spot.Time || '',
          Date: spot.Date || '',
          Beacon: spot.Beacon || false,
          MM: spot.MM || false,
          AM: spot.AM || false,
          Valid: spot.Valid || false,
          EQSL: spot.EQSL,
          LOTW: spot.LOTW,
          LOTW_Date: spot.LOTW_Date,
          DXHomecall: spot.DXHomecall || '',
          Comment: spot.Comment || '',
          Flag: spot.Flag || '',
          Band: spot.Band || 0,
          Mode: spot.Mode || 'UNKNOWN',
          Continent_dx: spot.Continent_dx || '',
          Continent_spotter: spot.Continent_spotter || '',
          DXLocator: spot.DXLocator,
        }));

        // Deduplicate spots by callsign and frequency
        const spotMap = new Map<string, DxSpot>();

        rawSpots.forEach((spot: DxSpot) => {
          const key = `${spot.DXCall}-${spot.Frequency}`;

          if (spotMap.has(key)) {
            const existingSpot = spotMap.get(key)!;
            // Add spotter to the list if not already present
            if (!existingSpot.Spotters.includes(spot.Spotter)) {
              existingSpot.Spotters.push(spot.Spotter);
            }
            // Keep the most recent time
            const existingTime = new Date(
              `20${existingSpot.Date.split('/')[2]}-${existingSpot.Date.split('/')[1]}-${existingSpot.Date.split('/')[0]}T${existingSpot.Time}:00Z`
            );
            const newTime = new Date(
              `20${spot.Date.split('/')[2]}-${spot.Date.split('/')[1]}-${spot.Date.split('/')[0]}T${spot.Time}:00Z`
            );

            if (newTime > existingTime) {
              existingSpot.Time = spot.Time;
              existingSpot.Date = spot.Date;
              existingSpot.Spotter = spot.Spotter; // Update primary spotter to most recent
            }
          } else {
            // First occurrence of this callsign/frequency combination
            spotMap.set(key, {
              ...spot,
              Spotters: [spot.Spotter],
            });
          }
        });

        this.spots = Array.from(spotMap.values());
        this.lastFetchTime = new Date();
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Ismeretlen hiba történt';
        console.error('DX Cluster fetch error:', err);
      } finally {
        this.loading = false;
      }
    },

    startAutoRefresh() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }

      // Initial fetch
      this.fetchSpots();

      // Set up 10-second interval
      refreshInterval = setInterval(() => {
        this.fetchSpots();
      }, 10000);
    },

    stopAutoRefresh() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    },

    updateFilters(newFilters: Partial<DxClusterFilters>) {
      this.filters = { ...this.filters, ...newFilters };
      // Trigger immediate refresh when filters change
      this.fetchSpots();
    },

    selectBand(band: string) {
      this.updateFilters({ selectedBand: band });
    },

    toggleFilter(
      filterArray: keyof Pick<DxClusterFilters, 'selectedCdx' | 'selectedCde' | 'selectedModes'>,
      value: string
    ) {
      const currentArray = [...this.filters[filterArray]];
      const index = currentArray.indexOf(value);

      if (index > -1) {
        currentArray.splice(index, 1);
      } else {
        currentArray.push(value);
      }

      this.updateFilters({ [filterArray]: currentArray });
    },
  },
});

// Auto-refresh interval - moved outside store to avoid reactivity issues
let refreshInterval: NodeJS.Timeout | null = null;
