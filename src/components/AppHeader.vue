<script lang="ts">
import RigControl from './header/RigControl.vue';
import FreqSMeter from './header/FreqSMeter.vue';
import PropClockWeather from './header/PropClockWeather.vue';
import { configHelper } from '../utils/configHelper';

export default {
  name: 'AppHeader',
  components: {
    RigControl,
    FreqSMeter,
    PropClockWeather,
  },
  data() {
    return {
      catEnabled: false,
    };
  },
  async mounted() {
    await this.loadCatSettings();
  },
  methods: {
    async loadCatSettings() {
      try {
        await configHelper.initSettings();
        this.catEnabled = configHelper.getSetting(['rig'], 'enabled') || false;
      } catch (error) {
        console.error('Error loading CAT settings:', error);
        this.catEnabled = false;
      }
    },
  },
};
</script>

<template>
  <header class="app-header" :class="{ 'no-rig-control': !catEnabled }">
    <RigControl v-if="catEnabled" />
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
  border: 1px solid var(--border-color);
  gap: 1rem;
}

/* When CAT control is disabled, adjust grid layout */
.app-header.no-rig-control {
  grid-template-columns: minmax(400px, 1fr) 1fr;
}

/* Left side: rig control */
.header-left.rig-control-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}
</style>
