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

// Magnifier window state
const magnifierVisible = ref(false)
const magnifierSpots = ref<DxSpot[]>([])
const magnifierPosition = ref({ x: 0, y: 0 })
const magnifierFrequency = ref('')
let magnifierTimeout: NodeJS.Timeout | null = null

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
  const range = getActualFrequencyRange()
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

const getSpotLayout = () => {
  const sortedSpots = [...spots.value].sort((a, b) => {
    const freqA = parseFloat(a.Frequency)
    const freqB = parseFloat(b.Frequency)
    return freqA - freqB
  })

  const layoutSpots = [] as any
  const minDistance = 3 // Minimum distance between spots in percentage
  const maxColumns = 4 // Maximum number of columns for overlapping spots

  for (let i = 0; i < sortedSpots.length; i++) {
    const spot = sortedSpots[i]
    const position = getSpotPosition(spot.Frequency)
    
    // Find overlapping spots
    const overlapping = layoutSpots.filter(layoutSpot => 
      Math.abs(layoutSpot.position - position) < minDistance
    )
    
    // Calculate column offset
    const column = overlapping.length % maxColumns
    const leftOffset = 35 + (column * 80) // Base position + column spacing
    
    layoutSpots.push({
      ...spot,
      position,
      leftOffset,
      column
    })
  }
  
  return layoutSpots
}

const layoutSpots = computed(() => getSpotLayout())

const showMagnifier = (event: MouseEvent, frequency: string) => {
  // Clear any pending hide timeout
  if (magnifierTimeout) {
    clearTimeout(magnifierTimeout)
    magnifierTimeout = null
  }
  
  const freq = parseFloat(frequency)
  const range = getActualFrequencyRange()
  if (!range) return
  
  // Find all spots within ±5 kHz range
  const nearbySpots = spots.value.filter(spot => {
    const spotFreq = parseFloat(spot.Frequency)
    return Math.abs(spotFreq - freq) <= 5
  }).sort((a, b) => parseFloat(a.Frequency) - parseFloat(b.Frequency))
  
  if (nearbySpots.length <= 1) return
  
  magnifierSpots.value = nearbySpots
  magnifierFrequency.value = `${(freq / 1000).toFixed(3)} MHz környéke`
  
  // Position magnifier near mouse but keep it in viewport
  magnifierPosition.value = {
    x: Math.min(event.clientX + 20, window.innerWidth - 300),
    y: Math.max(event.clientY - 100, 20)
  }
  
  magnifierVisible.value = true
}

const hideMagnifier = () => {
  // Delay hiding to prevent flickering
  magnifierTimeout = setTimeout(() => {
    magnifierVisible.value = false
    magnifierSpots.value = []
  }, 100)
}

const keepMagnifierVisible = () => {
  // Clear hide timeout when mouse enters magnifier
  if (magnifierTimeout) {
    clearTimeout(magnifierTimeout)
    magnifierTimeout = null
  }
}

const getActualFrequencyRange = () => {
  if (spots.value.length === 0) {
    // Fallback to band ranges if no spots
    return bandRanges[selectedBand.value] || { min: 14000, max: 14350 }
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
}

const generateScaleTicks = () => {
  const range = getActualFrequencyRange()
  if (!range) return { major: [], minor: [] }
  
  const majorTicks = [] as any
  const minorTicks = [] as any
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
              v-for="spot in layoutSpots" 
              :key="spot.Nr"
              class="spot-label"
              :style="{ 
                top: `${100 - spot.position}%`,
                left: `${spot.leftOffset}px`,
                opacity: getSpotOpacity(spot.Time, spot.Date),
                zIndex: spot.column + 1
              }"
              :class="{
                validated: spot.Valid,
                lotw: spot.LOTW,
                eqsl: spot.EQSL,
                [`column-${spot.column}`]: true
              }"
              :title="`${spot.DXCall} - ${formatFrequency(spot.Frequency)} - ${spot.Comment}`"
              @mouseenter="showMagnifier($event, spot.Frequency)"
              @mouseleave="hideMagnifier"
            >
              {{ spot.DXCall }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Magnifier Window -->
      <div 
        v-if="magnifierVisible"
        class="magnifier-window"
        :style="{
          left: `${magnifierPosition.x}px`,
          top: `${magnifierPosition.y}px`
        }"
        @mouseenter="keepMagnifierVisible"
        @mouseleave="hideMagnifier"
      >
        <div class="magnifier-header">
          <h4>{{ magnifierFrequency }}</h4>
          <span class="spot-count">{{ magnifierSpots.length }} spot</span>
        </div>
        <div class="magnifier-content">
          <div 
            v-for="spot in magnifierSpots" 
            :key="`mag-${spot.Nr}`"
            class="magnifier-spot"
            :class="{
              validated: spot.Valid,
              lotw: spot.LOTW,
              eqsl: spot.EQSL
            }"
          >
            <div class="spot-info">
              <div class="spot-call">{{ spot.DXCall }}</div>
              <div class="spot-freq">{{ formatFrequency(spot.Frequency) }}</div>
              <div class="spot-details">
                <span class="spot-mode">{{ spot.Mode }}</span>
                <span class="spot-time">{{ formatTime(spot.Time, spot.Date) }}</span>
                <span class="spot-spotter">{{ spot.Spotter }}</span>
              </div>
              <div class="spot-comment" v-if="spot.Comment">{{ spot.Comment }}</div>
            </div>
            <div class="spot-badges">
              <span v-if="spot.Valid" class="badge valid">✓</span>
              <span v-if="spot.LOTW" class="badge lotw">L</span>
              <span v-if="spot.EQSL" class="badge eqsl">E</span>
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
  width: 60px;
  background: var(--bg-darker);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  padding: 0.2rem;
  overflow-y: auto;
}

.filter-group {
  margin-bottom: 0.5rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--text-secondary);
  font-size: 0.65rem;
  font-weight: 600;
}

.filter-buttons-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-btn-small {
  padding: 0.2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.6rem;
  text-align: center;
  font-weight: 600;
  min-height: 24px;
  width: 100%;
  aspect-ratio: 1;
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
  gap: 0.3rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.65rem;
  margin-bottom: 0.3rem;
}

.page-length-selector {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  color: var(--text-secondary);
  font-size: 0.65rem;
}

.page-length-selector select {
  padding: 0.2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-primary);
  border-radius: var(--border-radius);
  font-size: 0.65rem;
  width: 100%;
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
  padding: 20px 20px 20px 25px;
  overflow-x: auto;
  min-width: 400px;
}

.scale-line {
  position: absolute;
  left: 25px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: var(--main-color);
}

.major-tick, .minor-tick {
  position: absolute;
  left: 25px;
}

.tick-mark {
  position: absolute;
  background: var(--main-color);
}

.tick-mark.major {
  width: 20px;
  height: 2px;
  left: 0px;
}

.tick-mark.minor {
  width: 10px;
  height: 1px;
  left: 0px;
}

.tick-label {
  position: absolute;
  left: 5px;
  top: -15px;
  font-size: 0.7rem;
  color: var(--main-color);
  white-space: nowrap;
  text-align: center;
  width: 20px;
}

.spot-label {
  position: absolute;
  left: 35px;
  background: var(--bg-darker);
  color: var(--text-primary);
  padding: 0.2rem 0.4rem;
  border-radius: var(--border-radius);
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  transform: translateY(-50%);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-label:hover {
  background: var(--bg-lighter);
  z-index: 100 !important;
  max-width: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.spot-label.column-0 {
  background: var(--bg-darker);
}

.spot-label.column-1 {
  background: rgba(255, 165, 0, 0.1);
}

.spot-label.column-2 {
  background: rgba(0, 123, 255, 0.1);
}

.spot-label.column-3 {
  background: rgba(40, 167, 69, 0.1);
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

.magnifier-window {
  position: fixed;
  background: var(--bg-darker);
  border: 2px solid var(--main-color);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 280px;
  max-width: 400px;
  max-height: 300px;
  overflow: hidden;
}

.magnifier-header {
  background: var(--main-color);
  color: white;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.magnifier-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.spot-count {
  font-size: 0.8rem;
  opacity: 0.9;
}

.magnifier-content {
  max-height: 240px;
  overflow-y: auto;
  padding: 0.5rem;
}

.magnifier-spot {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--bg-lighter);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.magnifier-spot:hover {
  background: var(--bg-dark);
}

.magnifier-spot:last-child {
  margin-bottom: 0;
}

.magnifier-spot.validated {
  border-left: 3px solid #22c55e;
}

.magnifier-spot.lotw {
  border-right: 3px solid #3b82f6;
}

.magnifier-spot.eqsl {
  border-right: 3px solid #f59e0b;
}

.spot-info {
  flex: 1;
}

.spot-call {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.spot-freq {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--main-color);
  margin-bottom: 0.3rem;
}

.spot-details {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.spot-mode {
  background: var(--bg-dark);
  padding: 0.1rem 0.3rem;
  border-radius: var(--border-radius-sm);
}

.spot-comment {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.2rem;
  word-break: break-word;
}

.spot-badges {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-left: 0.5rem;
}

.badge {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  text-align: center;
  line-height: 18px;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge.valid {
  background: #22c55e;
  color: white;
}

.badge.lotw {
  background: #3b82f6;
  color: white;
}

.badge.eqsl {
  background: #f59e0b;
  color: white;
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
  
  .magnifier-window {
    min-width: 250px;
    max-width: 90vw;
  }
}
</style>
