<script setup lang="ts">
import { useRigStore } from '../../store/rig'
const rigStore = useRigStore()
</script>

<template>
  <div class="header-left rig-control-section">
    <h2 class="section-title">RIG CONTROL</h2>
    <div class="rig-control-content">
      <div class="rig-info">
        <div class="rig-title">{{ rigStore.rigModel }}</div>
      </div>

      <div class="rig-buttons">
        <button class="reconnect" @click="rigStore.handleReconnect">Reconnect</button>
        <button class="stop-btn" @click="rigStore.handleDisconnect">Disconnect</button>
      </div>

      <div class="rig-mode-badges">
        <template v-for="mode in rigStore.modes" :key="mode.value">
          <input 
            type="radio" 
            :id="'mode-' + mode.value.toLowerCase()" 
            :value="mode.value"
            v-model="rigStore.selectedMode"
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
