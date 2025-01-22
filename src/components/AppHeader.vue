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
