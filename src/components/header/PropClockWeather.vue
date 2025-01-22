<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface PropData {
  sfi: number;
  aIndex: number;
  kIndex: number;
}

const propData = ref<PropData>({
  sfi: 153,
  aIndex: 6,
  kIndex: 2
});

const utcTime = ref('00:00:00');
const weatherInfo = ref('28°C Sunny');

const updateUTCClock = () => {
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, "0");
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0");
  const utcSeconds = String(now.getUTCSeconds()).padStart(2, "0");
  utcTime.value = `${utcHours}:${utcMinutes}:${utcSeconds}`;
};

let clockInterval: number;

onMounted(() => {
  updateUTCClock();
  clockInterval = window.setInterval(updateUTCClock, 1000);
});

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
});
</script>

<template>
  <div class="header-right prop-clock-weather">
    <h2 class="section-title">Propagation, Clock & WX</h2>
    <div class="prop-clock-weather-content">
      <div class="propagation-info">
        <div class="prop-item">
          <span class="prop-label">SFI</span>
          <span class="prop-value">{{ propData.sfi }}</span>
        </div>
        <div class="prop-item">
          <span class="prop-label">A</span>
          <span class="prop-value">{{ propData.aIndex }}</span>
        </div>
        <div class="prop-item">
          <span class="prop-label">K</span>
          <span class="prop-value">{{ propData.kIndex }}</span>
        </div>
      </div>

      <div class="clock-weather-block">
        <div class="utc-clock">
          <span class="clock-label">UTC:</span>
          <span class="clock-value">{{ utcTime }}</span>
        </div>
        <div class="local-weather">
          <span class="weather-label">Local WX:</span>
          <span class="weather-value">{{ weatherInfo }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
