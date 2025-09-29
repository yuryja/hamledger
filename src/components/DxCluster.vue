<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

interface DxSpot {
  frequency: number
  mode: string
  callsign: string
  cdx: string
  cde: string
  time: string
  signal?: string
  validated?: boolean
}

const spots = ref<DxSpot[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filter states
const selectedCdx = ref<string[]>(['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'])
const selectedCde = ref<string[]>(['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'])
const selectedBands = ref<string[]>(['15', '40'])
const selectedModes = ref<string[]>(['PHONE'])
const validatedOnly = ref(true)
const pageLength = ref(65)

// Available options
const continents = ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN']
const bands = ['10', '15', '20', '40', '80', '160']
const modes = ['PHONE', 'CW', 'FT8', 'FT4', 'RTTY', 'PSK31']
const pageLengthOptions = [25, 50, 65, 100, 200]

const fetchSpots = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    params.append('a', pageLength.value.toString())
    
    selectedBands.value.forEach(band => params.append('b', band))
    selectedCdx.value.forEach(cdx => params.append('cdx', cdx))
    selectedCde.value.forEach(cde => params.append('cde', cde))
    selectedModes.value.forEach(mode => params.append('m', mode))
    
    if (validatedOnly.value) {
      params.append('valid', '1')
    }
    
    const result = await window.electronAPI.fetchDxSpots(params.toString())
    
    if (!result.success) {
      throw new Error(result.error || 'API hívás sikertelen')
    }
    
    spots.value = result.data.map((spot: any) => ({
      frequency: spot.frequency || 0,
      mode: spot.mode || 'UNKNOWN',
      callsign: spot.callsign || '',
      cdx: spot.cdx || '',
      cde: spot.cde || '',
      time: spot.time || '',
      signal: spot.signal,
      validated: spot.validated || false
    }))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ismeretlen hiba történt'
    console.error('DX Cluster fetch error:', err)
  } finally {
    loading.value = false
  }
}

const formatFrequency = (freq: number) => {
  if (freq >= 1000000) {
    return `${(freq / 1000000).toFixed(3)} MHz`
  } else if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)} kHz`
  }
  return `${freq} Hz`
}

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    }) + 'Z'
  } catch {
    return timeStr
  }
}

const toggleFilter = (filterArray: string[], value: string) => {
  const index = filterArray.indexOf(value)
  if (index > -1) {
    filterArray.splice(index, 1)
  } else {
    filterArray.push(value)
  }
}

// Watch for filter changes and refetch
watch([selectedCdx, selectedCde, selectedBands, selectedModes, validatedOnly, pageLength], 
  () => {
    fetchSpots()
  }, 
  { deep: true }
)

onMounted(() => {
  fetchSpots()
})
</script>

<template>
  <div class="dx-cluster">
    <h2 class="section-title">DX Cluster</h2>
    
    <!-- Filters -->
    <div class="filters-section">
      <!-- Remote Country (CDX) -->
      <div class="filter-group">
        <label class="filter-label">Távoli ország (CDX):</label>
        <div class="filter-buttons">
          <button 
            v-for="continent in continents" 
            :key="`cdx-${continent}`"
            :class="['filter-btn', { active: selectedCdx.includes(continent) }]"
            @click="toggleFilter(selectedCdx, continent)"
          >
            {{ continent }}
          </button>
        </div>
      </div>

      <!-- Spotter Country (CDE) -->
      <div class="filter-group">
        <label class="filter-label">Spotter ország (CDE):</label>
        <div class="filter-buttons">
          <button 
            v-for="continent in continents" 
            :key="`cde-${continent}`"
            :class="['filter-btn', { active: selectedCde.includes(continent) }]"
            @click="toggleFilter(selectedCde, continent)"
          >
            {{ continent }}
          </button>
        </div>
      </div>

      <!-- Bands -->
      <div class="filter-group">
        <label class="filter-label">Sáv:</label>
        <div class="filter-buttons">
          <button 
            v-for="band in bands" 
            :key="`band-${band}`"
            :class="['filter-btn', { active: selectedBands.includes(band) }]"
            @click="toggleFilter(selectedBands, band)"
          >
            {{ band }}m
          </button>
        </div>
      </div>

      <!-- Modes -->
      <div class="filter-group">
        <label class="filter-label">Üzemmód:</label>
        <div class="filter-buttons">
          <button 
            v-for="mode in modes" 
            :key="`mode-${mode}`"
            :class="['filter-btn', { active: selectedModes.includes(mode) }]"
            @click="toggleFilter(selectedModes, mode)"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="filter-group">
        <div class="filter-options">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="validatedOnly"
            />
            Csak validált spotok
          </label>
          
          <div class="page-length-selector">
            <label>Spotok száma:</label>
            <select v-model="pageLength">
              <option v-for="length in pageLengthOptions" :key="length" :value="length">
                {{ length }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Spots List -->
    <div class="dx-cluster-content">
      <div v-if="loading" class="loading">
        Betöltés...
      </div>
      
      <div v-else-if="error" class="error">
        Hiba: {{ error }}
        <button @click="fetchSpots" class="retry-btn">Újrapróbálás</button>
      </div>
      
      <div v-else-if="spots.length === 0" class="no-spots">
        Nincsenek spotok a kiválasztott szűrőkkel.
      </div>
      
      <div v-else class="spots-list">
        <div class="spots-header">
          <div class="header-cell">Frekvencia</div>
          <div class="header-cell">Üzemmód</div>
          <div class="header-cell">Hívójel</div>
          <div class="header-cell">CDX</div>
          <div class="header-cell">CDE</div>
          <div class="header-cell">Idő</div>
          <div class="header-cell">Jel</div>
        </div>
        
        <div 
          v-for="(spot, index) in spots" 
          :key="index"
          :class="['spot-row', { validated: spot.validated }]"
        >
          <div class="spot-cell frequency">{{ formatFrequency(spot.frequency) }}</div>
          <div class="spot-cell mode">{{ spot.mode }}</div>
          <div class="spot-cell callsign">{{ spot.callsign }}</div>
          <div class="spot-cell cdx">{{ spot.cdx }}</div>
          <div class="spot-cell cde">{{ spot.cde }}</div>
          <div class="spot-cell time">{{ formatTime(spot.time) }}</div>
          <div class="spot-cell signal">{{ spot.signal || '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dx-cluster {
  height: 100%;
  width: 50rem;
  display: flex;
  flex-direction: column;
  background: var(--bg-lighter);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  padding: 1rem;
}

.section-title {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.filters-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-darker);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.filter-group {
  margin-bottom: 0.75rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.filter-btn:hover {
  background: var(--bg-darker);
  border-color: var(--accent-color);
}

.filter-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.page-length-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.page-length-selector select {
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-primary);
  border-radius: var(--border-radius);
}

.dx-cluster-content {
  flex: 1;
  overflow-y: auto;
  color: var(--text-primary);
}

.loading, .error, .no-spots {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
  font-style: italic;
}

.error {
  flex-direction: column;
  gap: 1rem;
  color: var(--error-color);
}

.retry-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent-color);
  background: var(--accent-color);
  color: white;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.spots-list {
  display: flex;
  flex-direction: column;
}

.spots-header {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 0.6fr 0.6fr 0.8fr 0.6fr;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background: var(--bg-darker);
  border-bottom: 2px solid var(--border-color);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.spot-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 0.6fr 0.6fr 0.8fr 0.6fr;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.spot-row:hover {
  background: var(--bg-darker);
}

.spot-row.validated {
  background: rgba(34, 197, 94, 0.1);
  border-left: 3px solid #22c55e;
}

.header-cell, .spot-cell {
  padding: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spot-cell.frequency {
  font-weight: 600;
  color: var(--accent-color);
}

.spot-cell.callsign {
  font-weight: 600;
  color: var(--text-primary);
}

.spot-cell.mode {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.spot-cell.time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .filter-buttons {
    gap: 0.25rem;
  }
  
  .filter-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .spots-header, .spot-row {
    grid-template-columns: 1fr 0.7fr 1fr 0.5fr 0.5fr 0.7fr 0.5fr;
    font-size: 0.8rem;
  }
}
</style>
