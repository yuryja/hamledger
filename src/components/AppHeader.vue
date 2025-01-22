<script setup lang="ts">
import { ref, onMounted } from 'vue'
import RigControl from './header/RigControl.vue'
import FreqSMeter from './header/FreqSMeter.vue'
import PropClockWeather from './header/PropClockWeather.vue'

</script>

<template>
  <header class="app-header">
    <RigControl />
    <FreqSMeter />
    <PropClockWeather />
  </header>
</template>
