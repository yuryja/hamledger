<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useDxClusterStore, type DxSpot } from '../store/dxCluster'
import { useQsoStore } from '../store/qso'

const dxStore = useDxClusterStore()
const qsoStore = useQsoStore()

// Get reactive data from store
const spots = computed(() => dxStore.spots)
const loading = computed(() => dxStore.loading)
const error = computed(() => dxStore.error)
const filters = computed(() => dxStore.filters)

// Magnifier window state
const magnifierVisible = ref(false)
const magnifierSpots = ref<DxSpot[]>([])
const magnifierPosition = ref({ x: 0, y: 0 })
const magnifierFrequency = ref('')
let magnifierTimeout: NodeJS.Timeout | null = null


// Available options
const continents = ['EU', 'NA', 'SA', 'AS', 'AF', 'OC', 'AN']
const bands = ['10', '15', '20', '40', '80', '160']
const modes = ['PHONE', 'CW', 'FT8', 'FT4', 'RTTY', 'PSK31']
const pageLengthOptions = [25, 50, 65, 100, 200]


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

const selectBand = (band: string) => {
  dxStore.selectBand(band)
}

const toggleCdxFilter = (value: string) => {
  dxStore.toggleFilter('selectedCdx', value)
}

const toggleCdeFilter = (value: string) => {
  dxStore.toggleFilter('selectedCde', value)
}

const toggleModeFilter = (value: string) => {
  dxStore.toggleFilter('selectedModes', value)
}

const updateValidatedOnly = (value: boolean) => {
  dxStore.updateFilters({ validatedOnly: value })
}

const updatePageLength = (value: number) => {
  dxStore.updateFilters({ pageLength: value })
}

const getSpotPosition = (frequency: string) => {
  const freq = parseFloat(frequency)
  const range = dxStore.actualFrequencyRange
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

const isSpotWorked = (callsign: string) => {
  return qsoStore.currentSession.some(qso => 
    qso.callsign.toUpperCase() === callsign.toUpperCase()
  )
}

const getSpotLayout = () => {
  // Sort spots by age (newest first)
  const sortedSpots = [...spots.value].sort((a, b) => {
    const timeA = new Date(`20${a.Date.split('/')[2]}-${a.Date.split('/')[1]}-${a.Date.split('/')[0]}T${a.Time}:00Z`)
    const timeB = new Date(`20${b.Date.split('/')[2]}-${b.Date.split('/')[1]}-${b.Date.split('/')[0]}T${b.Time}:00Z`)
    return timeB.getTime() - timeA.getTime() // Newest first
  })

  const layoutSpots = [] as any
  const halfPoint = Math.ceil(sortedSpots.length / 2)

  for (let i = 0; i < sortedSpots.length; i++) {
    const spot = sortedSpots[i]
    const position = getSpotPosition(spot.Frequency)
    
    // First half goes to column 0, second half to column 1
    const column = i < halfPoint ? 0 : 1
    const leftOffset = 35 + (column * 90) // Base position + column spacing
    
    // Calculate opacity for second column based on age within that column
    let opacity = getSpotOpacity(spot.Time, spot.Date)
    if (column === 1) {
      const indexInSecondColumn = i - halfPoint
      const totalInSecondColumn = sortedSpots.length - halfPoint
      // Linear interpolation from normal opacity to 15% for oldest
      const ageFactor = indexInSecondColumn / (totalInSecondColumn - 1)
      opacity = Math.max(0.15, opacity * (1 - ageFactor * 0.85))
    }
    
    layoutSpots.push({
      ...spot,
      position,
      leftOffset,
      column,
      customOpacity: opacity,
      worked: isSpotWorked(spot.DXCall)
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
  const range = dxStore.actualFrequencyRange
  if (!range) return
  
  // Find all spots within ±5 kHz range
  const nearbySpots = spots.value.filter(spot => {
    const spotFreq = parseFloat(spot.Frequency)
    return Math.abs(spotFreq - freq) <= 5
  }).sort((a, b) => {
    // Sort by age (newest first)
    const timeA = new Date(`20${a.Date.split('/')[2]}-${a.Date.split('/')[1]}-${a.Date.split('/')[0]}T${a.Time}:00Z`)
    const timeB = new Date(`20${b.Date.split('/')[2]}-${b.Date.split('/')[1]}-${b.Date.split('/')[0]}T${b.Time}:00Z`)
    return timeB.getTime() - timeA.getTime()
  })
  
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

const generateScaleTicks = () => {
  const range = dxStore.actualFrequencyRange
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

onMounted(() => {
  dxStore.startAutoRefresh()
})

onUnmounted(() => {
  dxStore.stopAutoRefresh()
})
</script>

<template>
  <div class="dx-cluster">
    <h2 class="section-title">DX Cluster - {{ filters.selectedBand }}m band</h2>
    
    <div class="dx-cluster-main">
      <!-- Frequency Scale and Spots -->
      <div class="spots-column">       
        <div v-if="error" class="error">
          Error: {{ error }}
          <button @click="dxStore.fetchSpots" class="retry-btn">Try again!</button>
        </div>
        
        <div v-else-if="spots.length === 0" class="no-spots">
          No spots available.
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
                opacity: spot.customOpacity,
                zIndex: spot.column + 1
              }"
              :class="{
                worked: spot.worked,
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
              worked: isSpotWorked(spot.DXCall),
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
              <span v-if="isSpotWorked(spot.DXCall)" class="badge worked">✓</span>
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
          <label class="filter-label">Band:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="band in bands" 
              :key="`band-${band}`"
              :class="['filter-btn-small', { active: filters.selectedBand === band }]"
              @click="selectBand(band)"
            >
              {{ band }}m
            </button>
          </div>
        </div>

        <!-- Remote Country (CDX) -->
        <div class="filter-group">
          <label class="filter-label">DX:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="continent in continents" 
              :key="`cdx-${continent}`"
              :class="['filter-btn-small', { active: filters.selectedCdx.includes(continent) }]"
              @click="toggleCdxFilter(continent)"
            >
              {{ continent }}
            </button>
          </div>
        </div>

        <!-- Spotter Country (CDE) -->
        <div class="filter-group">
          <label class="filter-label">DE:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="continent in continents" 
              :key="`cde-${continent}`"
              :class="['filter-btn-small', { active: filters.selectedCde.includes(continent) }]"
              @click="toggleCdeFilter(continent)"
            >
              {{ continent }}
            </button>
          </div>
        </div>

        <!-- Modes -->
        <div class="filter-group">
          <label class="filter-label">Mode:</label>
          <div class="filter-buttons-column">
            <button 
              v-for="mode in modes" 
              :key="`mode-${mode}`"
              :class="['filter-btn-small', { active: filters.selectedModes.includes(mode) }]"
              @click="toggleModeFilter(mode)"
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
              :checked="filters.validatedOnly"
              @change="updateValidatedOnly($event.target.checked)"
            />
            Valid
          </label>
          
          <div class="page-length-selector">
            <label>Spots:</label>
            <select :value="filters.pageLength" @change="updatePageLength(parseInt($event.target.value))">
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
  overflow-x: none;
  min-width: 400px;
}

.scale-line {
  position: absolute;
  left: 0px;
  top: 0px;
  bottom: 0px;
  width: 1px;
  background: var(--main-color);
}

.major-tick, .minor-tick {
  position: absolute;
  left: 0px;
}

.tick-mark {
  position: absolute;
  background: var(--main-color);
}

.tick-mark.major {
  width: 20px;
  height: 1px;
  left: 0px;
}

.tick-mark.minor {
  width: 10px;
  height: 1px;
  left: 0px;
}

.tick-label {
  position: absolute;
  left: 0px;
  top: -15px;
  font-size: 0.7rem;
  color: var(--main-color);
  white-space: nowrap;
  text-align: center;
  width: 40px;
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
  background: var(--bg-darker);
}

.spot-label.worked {
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

.magnifier-spot.worked {
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

.badge.worked {
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
