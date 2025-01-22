<script setup lang="ts">
import { ref } from 'vue'
interface Mode {
  value: string;
  label: string;
}

const modes: Mode[] = [
  { value: 'CW', label: 'CW' },
  { value: 'LSB', label: 'LSB' },
  { value: 'USB', label: 'USB' },
  { value: 'AM', label: 'AM' },
  { value: 'FM', label: 'FM' },
  { value: 'DATA', label: 'DATA' }
];

const selectedMode = ref('CW');

const handleReconnect = () => {
  // Implement reconnect logic
  console.log('Reconnecting...');
};

const handleDisconnect = () => {
  // Implement disconnect logic
  console.log('Disconnecting...');
};
</script>

<template>
  <div class="header-left rig-control-section">
    <h2 class="section-title">RIG CONTROL</h2>
    <div class="rig-control-content">
      <div class="rig-info">
        <div class="rig-title">YAESU FT-450A</div>
      </div>

      <div class="rig-buttons">
        <button class="reconnect" @click="handleReconnect">Reconnect</button>
        <button class="stop-btn" @click="handleDisconnect">Disconnect</button>
      </div>

      <div class="rig-mode-badges">
        <template v-for="mode in modes" :key="mode.value">
          <input 
            type="radio" 
            :id="'mode-' + mode.value.toLowerCase()" 
            :value="mode.value"
            v-model="selectedMode"
            name="rig-mode"
          />
          <label 
            :for="'mode-' + mode.value.toLowerCase()" 
            class="mode-badge"
          >
            {{ mode.label }}
          </label>
        </template>
      </div>
    </div>
  </div>
</template>
