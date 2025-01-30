<script lang="ts">
import { usePropagationStore } from '../../store/propagation'
import { useWeatherStore } from '../../store/weather'
import { DateHelper } from '../../utils/dateHelper'

export default {
  name: 'PropClockWeather',
  setup() {
    const propStore = usePropagationStore()
    const weatherStore = useWeatherStore()
    return { propStore, weatherStore }
  },
  data() {
    return {
      utcTime: '00:00:00',
      clockInterval: 0
    }
  },
  mounted() {
    this.updateUTCClock()
    this.clockInterval = window.setInterval(this.updateUTCClock, 1000)
    this.propStore.updatePropagationData()
  },
  beforeUnmount() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval)
    }
  },
  methods: {
    updateUTCClock() {
      this.utcTime = DateHelper.getCurrentUTCTime()
    }
  }
}
</script>

<template>
  <div class="header-right prop-clock-weather">
    <h2 class="section-title">Propagation, Clock & WX</h2>
    <div class="prop-clock-weather-content">
      <div class="propagation-info">
        <div class="prop-item">
          <span class="prop-label">SFI</span>
          <span class="prop-value">{{ propStore.propData.sfi }}</span>
        </div>
        <div class="prop-item">
          <span class="prop-label">A</span>
          <span class="prop-value">{{ propStore.propData.aIndex }}</span>
        </div>
        <div class="prop-item">
          <span class="prop-label">K</span>
          <span class="prop-value">{{ propStore.propData.kIndex }}</span>
        </div>
      </div>

      <div class="clock-weather-block">
        <div class="utc-clock">
          <span class="clock-label">UTC:</span>
          <span class="clock-value">{{ utcTime }}</span>
        </div>
        <div class="local-weather">
          <span class="weather-label">Local WX:</span>
          <span class="weather-value">{{ weatherStore.weatherInfo }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Right: Prop, clock & WX */
.header-right.prop-clock-weather {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

/* Additional container to keep content below the title */
.prop-clock-weather-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

/* Prop info */
.propagation-info {
  display: flex;
  gap: 1.5rem;
}

.prop-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.prop-label {
  font-size: 0.75rem;
  color: #ccc;
}

.prop-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--main-color);
}

/* Clock & weather */
.clock-weather-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.utc-clock,
.local-weather {
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
}

.clock-label,
.weather-label {
  font-size: 0.8rem;
  color: #ccc;
}

.clock-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

.weather-value {
  font-size: 0.9rem;
  color: #eee;
}
</style>
