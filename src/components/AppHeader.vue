<script lang="ts">
import RigControl from './header/RigControl.vue'
import FreqSMeter from './header/FreqSMeter.vue'
import PropClockWeather from './header/PropClockWeather.vue'

export default {
  name: 'AppHeader',
  components: {
    RigControl,
    FreqSMeter,
    PropClockWeather
  }
}
</script>

<template>
  <header class="app-header">
    <RigControl />
    <FreqSMeter />
    <PropClockWeather />
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: 1fr minmax(400px, 1fr) 1fr;
  background: #333;
  padding: 1rem;
  border-radius: 5px;
  gap: 1rem;
}

/* Left side: rig control */
.header-left.rig-control-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}
</style>