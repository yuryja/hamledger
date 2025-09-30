<script lang="ts">
import { useRigStore } from '../../store/rig';

export default {
  name: 'RigControl',
  data() {
    return {
      rigStore: useRigStore(),
    };
  },
  computed: {
    modes() {
      return this.rigStore.modes;
    },
    selectedMode: {
      get() {
        return this.rigStore.selectedMode;
      },
      set(newMode: string) {
        this.rigStore.setMode(newMode);
      },
    },
    rigModel() {
      return this.rigStore.rigModel;
    },
    splitActive() {
      return this.rigStore.splitActive;
    },
  },
  methods: {
    handleReconnect() {
      this.rigStore.handleReconnect();
    },
    handleDisconnect() {
      this.rigStore.handleDisconnect();
    },
  },
};
</script>

<template>
  <div class="header-left rig-control-section">
    <h2 class="section-title">RIG CONTROL</h2>
    <div class="rig-control-content">
      <div class="rig-info">
        <div class="rig-title">
          {{ rigModel }}
          <span class="port-badge">COM5</span>
        </div>
      </div>

      <div class="rig-buttons">
        <button class="reconnect" @click="handleReconnect">Reconnect</button>
        <button class="stop-btn" @click="handleDisconnect">Disconnect</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Just a container to keep the content below the title */
.rig-control-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rig-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.rig-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.port-badge {
  font-size: 0.8rem;
  background: #555;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: var(--gray-color);
}

.rig-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Reconnect (orange) */
.reconnect {
  background: orange;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
}

/* Disconnect (red) */
.stop-btn {
  background: #d83838;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
}
</style>
