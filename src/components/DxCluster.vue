<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

interface DxSpot {
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

const spots = ref<DxSpot[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filter states
const selectedCdx = ref<string[]>(['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'])
const selectedCde = ref<string[]>(['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN'])
const selectedBand = ref<string>('40') // Single band selection
const selectedModes = ref<string[]>(['PHONE'])
const validatedOnly = ref(true)
const pageLength = ref(65)

// Available options
const continents = ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN']
const bands = ['10', '15', '20', '40', '80', '160']
const modes = ['PHONE', 'CW', 'FT8', 'FT4', 'RTTY', 'PSK31']
const pageLengthOptions = [25, 50, 65, 100, 200]

// Band frequency ranges in kHz
const bandRanges: { [key: string]: { min: number, max: number } } = {
  '10': { min: 28000, max: 29700 },
  '15': { min: 21000, max: 21450 },
  '20': { min: 14000, max: 14350 },
  '40': { min: 7000, max: 7300 },
  '80': { min: 3500, max: 4000 },
  '160': { min: 1800, max: 2000 }
}

const fetchSpots = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    params.append('a', pageLength.value.toString())
    
    params.append('b', selectedBand.value) // Single band
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ismeretlen hiba történt'
    console.error('DX Cluster fetch error:', err)
  } finally {
    loading.value = false
  }
}

const formatFrequency = (freqStr: string) => {
  const freq = parseFloat(freqStr)
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(3)} MHz`
  }
  return `${freq} kHz`
}

const formatTime = (timeStr: string, dateStr: string) => {
  try {
    // Format: "21:19" and "29/09/25"
    const [day, month, year] = dateStr.split('/')
    const fullYear = `20${year}` // Assuming 21st century
    const isoDate = `${fullYear}-${month}-${day}T${timeStr}:00Z`
    const date = new Date(isoDate)
    
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    }) + 'Z'
  } catch {
    return `${timeStr}Z`
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

const selectBand = (band: string) => {
  selectedBand.value = band
}

const getSpotPosition = (frequency: string) => {
  const freq = parseFloat(frequency)
  const range = bandRanges[selectedBand.value]
  if (!range) return 0
  
  const percentage = ((freq - range.min) / (range.max - range.min)) * 100
  return Math.max(0, Math.min(100, percentage))
}

const getSpotOpacity = (timeStr: string, dateStr: string) => {
  try {
    const [day, month, year] = dateStr.split('/')
    const fullYear = `20${year}`
    const isoDate = `${fullYear}-${month}-${day}T${timeStr}:00Z`
    const spotTime = new Date(isoDate)
    const now = new Date()
    const ageInHours = (now.getTime() - spotTime.getTime()) / (1000 * 60 * 60)
    
    // Fade from 1.0 to 0.3 over 24 hours
    const opacity = Math.max(0.3, 1.0 - (ageInHours / 24) * 0.7)
    return opacity
  } catch {
    return 0.5
  }
}

const generateScaleTicks = () => {
  const range = bandRanges[selectedBand.value]
  if (!range) return { major: [], minor: [] }
  
  const majorTicks = []
  const minorTicks = []
  const step = (range.max - range.min) / 10
  
  for (let i = 0; i <= 10; i++) {
    const freq = range.min + (step * i)
    const position = (i / 10) * 100
    
    if (i % 2 === 0) {
      majorTicks.push({
        frequency: freq,
        position: position,
        label: `${(freq / 1000).toFixed(3)}`
      })
    } else {
      minorTicks.push({
        frequency: freq,
        position: position
      })
    }
  }
  
  return { major: majorTicks, minor: minorTicks }
}

const scaleTicks = computed(() => generateScaleTicks())

// Watch for filter changes and refetch
watch([selectedCdx, selectedCde, selectedBand, selectedModes, validatedOnly, pageLength], 
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
    <h2 class="section-title">DX Cluster - {{ selectedBand }}m sáv</h2>
    
    <div class="dx-cluster-main">
      <!-- Frequency Scale and Spots -->
      <div class="spots-column">
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
        
        <div v-else class="frequency-scale">
          <!-- Scale -->
          <div class="scale-container">
            <div class="scale-line"></div>
            
            <!-- Major ticks -->
            <div 
              v-for="tick in scaleTicks.major" 
              :key="`major-${tick.frequency}`"
              class="major-tick"
              :style="{ top: `${100 - tick.position}%` }"
            >
              <div class="tick-mark major"></div>
              <div class="tick-label">{{ tick.label }}</div>
            </div>
            
            <!-- Minor ticks -->
            <div 
              v-for="tick in scaleTicks.minor" 
              :key="`minor-${tick.frequency}`"
              class="minor-tick"
              :style="{ top: `${100 - tick.position}%` }"
            >
              <div class="tick-mark minor"></div>
            </div>
            
            <!-- Spots -->
            <div 
              v-for="spot in spots" 
              :key="spot.Nr"
              class="spot-label"
              :style="{ 
                top: `${100 - getSpotPosition(spot.Frequency)}%`,
                opacity: getSpotOpacity(spot.Time, spot.Date)
              }"
              :class="{
                validated: spot.Valid,
                lotw: spot.LOTW,
                eqsl: spot.EQSL
              }"
              :title="`${spot.DXCall} - ${formatFrequency(spot.Frequency)} - ${spot.Comment}`"
            >
              {{ spot.DXCall }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filters Column -->
      <div class="filters-column">
        <!-- Band Selection -->
        <div class="filter-group">
          <label class="filter-label">Sáv:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="band in bands" 
              :key="`band-${band}`"
              :class="['filter-btn-small', { active: selectedBand === band }]"
              @click="selectBand(band)"
            >
              {{ band }}m
            </button>
          </div>
        </div>

        <!-- Remote Country (CDX) -->
        <div class="filter-group">
          <label class="filter-label">CDX:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="continent in continents" 
              :key="`cdx-${continent}`"
              :class="['filter-btn-small', { active: selectedCdx.includes(continent) }]"
              @click="toggleFilter(selectedCdx, continent)"
            >
              {{ continent }}
            </button>
          </div>
        </div>

        <!-- Spotter Country (CDE) -->
        <div class="filter-group">
          <label class="filter-label">CDE:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="continent in continents" 
              :key="`cde-${continent}`"
              :class="['filter-btn-small', { active: selectedCde.includes(continent) }]"
              @click="toggleFilter(selectedCde, continent)"
            >
              {{ continent }}
            </button>
          </div>
        </div>

        <!-- Modes -->
        <div class="filter-group">
          <label class="filter-label">Üzemmód:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="mode in modes" 
              :key="`mode-${mode}`"
              :class="['filter-btn-small', { active: selectedModes.includes(mode) }]"
              @click="toggleFilter(selectedModes, mode)"
            >
              {{ mode }}
            </button>
          </div>
        </div>

        <!-- Additional Options -->
        <div class="filter-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="validatedOnly"
            />
            Validált
          </label>
          
          <div class="page-length-selector">
            <label>Spotok:</label>
            <select v-model="pageLength">
              <option v-for="length in pageLengthOptions" :key="length" :value="length">
                {{ length }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dx-cluster {
  height: 100%;
  width: auto;
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

.dx-cluster-main {
  display: flex;
  flex: 1;
  gap: 1rem;
  overflow: hidden;
}

.spots-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filters-column {
  width: 200px;
  background: var(--bg-darker);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  padding: 1rem;
  overflow-y: auto;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
}

.filter-buttons-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-btn-small {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  text-align: center;
}

.filter-btn-small:hover {
  background: var(--bg-darker);
  border-color: var(--main-color);
}

.filter-btn-small.active {
  background: var(--main-color);
  color: white;
  border-color: var(--main-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.page-length-selector {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.page-length-selector select {
  padding: 0.25rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-primary);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
}

.frequency-scale {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.scale-container {
  position: relative;
  height: 100%;
  width: 100%;
  padding: 20px 60px 20px 20px;
}

.scale-line {
  position: absolute;
  left: 50px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: var(--border-color);
}

.major-tick, .minor-tick {
  position: absolute;
  left: 50px;
}

.tick-mark {
  position: absolute;
  background: var(--text-secondary);
}

.tick-mark.major {
  width: 20px;
  height: 2px;
  left: -10px;
}

.tick-mark.minor {
  width: 10px;
  height: 1px;
  left: -5px;
}

.tick-label {
  position: absolute;
  left: 25px;
  top: -8px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.spot-label {
  position: absolute;
  left: 80px;
  background: var(--bg-darker);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  transform: translateY(-50%);
}

.spot-label:hover {
  background: var(--bg-lighter);
  z-index: 10;
}

.spot-label.validated {
  border-left: 3px solid #22c55e;
}

.spot-label.lotw {
  border-right: 3px solid #3b82f6;
}

.spot-label.eqsl {
  border-right: 3px solid #f59e0b;
}

.spot-label.lotw.eqsl {
  border-right: 3px solid #3b82f6;
  box-shadow: inset -3px 0 0 #f59e0b;
}

.loading, .error, .no-spots {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-style: italic;
}

.error {
  flex-direction: column;
  gap: 1rem;
  color: var(--main-color);
}

.retry-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--main-color);
  background: var(--main-color);
  color: white;
  border-radius: var(--border-radius);
  cursor: pointer;
}

@media (max-width: 768px) {
  .dx-cluster-main {
    flex-direction: column;
  }
  
  .filters-column {
    width: auto;
    height: auto;
    max-height: 200px;
  }
  
  .filter-buttons-column {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
