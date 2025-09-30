import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DxSpot {
  Nr: number
  Spotter: string
  Frequency: string
  DXCall: string
  Time: string
  Date: string
  Beacon: boolean
  MM: boolean
  AM: boolean
  Valid: boolean
  EQSL?: boolean
  LOTW?: boolean
  LOTW_Date?: string
  DXHomecall: string
  Comment: string
  Flag: string
  Band: number
  Mode: string
  Continent_dx: string
  Continent_spotter: string
  DXLocator?: string
}

export interface DxClusterFilters {
  selectedCdx: string[]
  selectedCde: string[]
  selectedBand: string
  selectedModes: string[]
  validatedOnly: boolean
  pageLength: number
}

export const useDxClusterStore = defineStore('dxCluster', () => {
  // State
  const spots = ref<DxSpot[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<Date | null>(null)
  
  // Filters
  const filters = ref<DxClusterFilters>({
    selectedCdx: ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'],
    selectedCde: ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'],
    selectedBand: '40',
    selectedModes: ['PHONE'],
    validatedOnly: true,
    pageLength: 65
  })

  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null

  // Actions
  const fetchSpots = async () => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      params.append('a', filters.value.pageLength.toString())
      params.append('b', filters.value.selectedBand)
      
      filters.value.selectedCdx.forEach(cdx => params.append('cdx', cdx))
      filters.value.selectedCde.forEach(cde => params.append('cde', cde))
      filters.value.selectedModes.forEach(mode => params.append('m', mode))
      
      if (filters.value.validatedOnly) {
        params.append('valid', '1')
      }
      
      const result = await window.electronAPI.fetchDxSpots(params.toString())
      
      if (!result.success) {
        throw new Error(result.error || 'API hívás sikertelen')
      }
      
      spots.value = result.data.map((spot: any) => ({
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
        DXLocator: spot.DXLocator
      }))
      
      lastFetchTime.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ismeretlen hiba történt'
      console.error('DX Cluster fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    
    // Initial fetch
    fetchSpots()
    
    // Set up 10-second interval
    refreshInterval = setInterval(() => {
      fetchSpots()
    }, 10000)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  const updateFilters = (newFilters: Partial<DxClusterFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    // Trigger immediate refresh when filters change
    fetchSpots()
  }

  const selectBand = (band: string) => {
    updateFilters({ selectedBand: band })
  }

  const toggleFilter = (filterArray: keyof Pick<DxClusterFilters, 'selectedCdx' | 'selectedCde' | 'selectedModes'>, value: string) => {
    const currentArray = [...filters.value[filterArray]]
    const index = currentArray.indexOf(value)
    
    if (index > -1) {
      currentArray.splice(index, 1)
    } else {
      currentArray.push(value)
    }
    
    updateFilters({ [filterArray]: currentArray })
  }

  // Computed
  const actualFrequencyRange = computed(() => {
    if (spots.value.length === 0) {
      // Fallback to band ranges if no spots
      const bandRanges: { [key: string]: { min: number, max: number } } = {
        '10': { min: 28000, max: 29700 },
        '15': { min: 21000, max: 21450 },
        '20': { min: 14000, max: 14350 },
        '40': { min: 7000, max: 7300 },
        '80': { min: 3500, max: 4000 },
        '160': { min: 1800, max: 2000 }
      }
      return bandRanges[filters.value.selectedBand] || { min: 14000, max: 14350 }
    }
    
    const frequencies = spots.value.map(spot => parseFloat(spot.Frequency))
    const minFreq = Math.min(...frequencies)
    const maxFreq = Math.max(...frequencies)
    
    // Add 5% padding on both sides
    const padding = (maxFreq - minFreq) * 0.05
    
    return {
      min: Math.max(minFreq - padding, 0),
      max: maxFreq + padding
    }
  })

  return {
    // State
    spots: computed(() => spots.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    lastFetchTime: computed(() => lastFetchTime.value),
    filters: computed(() => filters.value),
    actualFrequencyRange,
    
    // Actions
    fetchSpots,
    startAutoRefresh,
    stopAutoRefresh,
    updateFilters,
    selectBand,
    toggleFilter
  }
})
