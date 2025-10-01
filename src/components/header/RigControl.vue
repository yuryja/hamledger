<script lang="ts">
import { useRigStore } from '../../store/rig';
import { configHelper } from '../../utils/configHelper';

export default {
  name: 'RigControl',
  data() {
    return {
      rigStore: useRigStore(),
      rigModel: '',
      rigPort: '',
      showConnectionDialog: false,
      connectionForm: {
        host: 'localhost',
        port: 4532,
        model: undefined as number | undefined,
        device: undefined as string | undefined,
      },
    };
  },
  async mounted() {
    await this.loadRigConfig();
    // Auto-connect if configuration exists
    if (this.connectionForm.host && this.connectionForm.port) {
      await this.handleConnect();
    }
  },
  computed: {
    modes() {
      return this.rigStore.modes;
    },
    selectedMode: {
      get() {
        return this.rigStore.currentMode;
      },
      set(newMode: string) {
        this.rigStore.setMode(newMode);
      },
    },
    splitActive() {
      return this.rigStore.rigState.split;
    },
    isConnected() {
      return this.rigStore.isConnected;
    },
    connectionStatus() {
      if (this.rigStore.isLoading) return 'Connecting...';
      if (this.rigStore.isConnected) return 'Connected';
      return 'Disconnected';
    },
    connectionStatusClass() {
      if (this.rigStore.isLoading) return 'status-connecting';
      if (this.rigStore.isConnected) return 'status-connected';
      return 'status-disconnected';
    },
    currentFrequency() {
      return this.rigStore.currentFrequency();
    },
    splitFrequency() {
      return this.rigStore.splitFrequency();
    },
  },
  methods: {
    async loadRigConfig() {
      await configHelper.initSettings();
      this.rigModel = configHelper.getSetting(['rig'], 'model') || this.rigStore.rigModel;
      this.rigPort = configHelper.getSetting(['rig'], 'port') || 'localhost:4532';
      
      // Load connection settings
      this.connectionForm.host = configHelper.getSetting(['rig'], 'host') || 'localhost';
      this.connectionForm.port = configHelper.getSetting(['rig'], 'port') || 4532;
      this.connectionForm.model = configHelper.getSetting(['rig'], 'rigModel');
      this.connectionForm.device = configHelper.getSetting(['rig'], 'device');
    },
    
    async handleConnect() {
      try {
        await this.rigStore.connect(
          this.connectionForm.host,
          this.connectionForm.port,
          this.connectionForm.model,
          this.connectionForm.device
        );
        
        if (this.rigStore.isConnected) {
          this.showConnectionDialog = false;
          // Start polling for rig state updates
          this.rigStore.startPolling(2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Connection failed:', error);
      }
    },
    
    async handleReconnect() {
      await this.rigStore.handleReconnect();
      if (this.rigStore.isConnected) {
        this.rigStore.startPolling(2000);
      }
    },
    
    async handleDisconnect() {
      this.rigStore.stopPolling();
      await this.rigStore.handleDisconnect();
    },
    
    showConnectionSettings() {
      this.showConnectionDialog = true;
    },
    
    closeConnectionDialog() {
      this.showConnectionDialog = false;
    },
    
    async saveConnectionSettings() {
      // Save to config
      await configHelper.updateSetting(['rig'], 'host', this.connectionForm.host);
      await configHelper.updateSetting(['rig'], 'port', this.connectionForm.port);
      if (this.connectionForm.model) {
        await configHelper.updateSetting(['rig'], 'rigModel', this.connectionForm.model);
      }
      if (this.connectionForm.device) {
        await configHelper.updateSetting(['rig'], 'device', this.connectionForm.device);
      }
      
      // Connect with new settings
      await this.handleConnect();
    },
  },
  
  beforeUnmount() {
    // Stop polling when component is destroyed
    this.rigStore.stopPolling();
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
          <span class="port-badge">{{ rigPort }}</span>
        </div>
        <div class="connection-status" :class="connectionStatusClass">
          {{ connectionStatus }}
        </div>
        <div v-if="isConnected" class="rig-state">
          <div class="frequency-display">
            <span class="freq-label">RX:</span>
            <span class="frequency">{{ currentFrequency }} MHz</span>
          </div>
          <div v-if="splitActive" class="frequency-display">
            <span class="freq-label">TX:</span>
            <span class="frequency">{{ splitFrequency }} MHz</span>
          </div>
          <div class="mode-display">
            <span class="mode-label">Mode:</span>
            <span class="mode">{{ selectedMode }}</span>
          </div>
        </div>
        <div v-if="rigStore.error" class="error-message">
          {{ rigStore.error }}
        </div>
      </div>

      <div class="rig-buttons">
        <button v-if="!isConnected" class="connect-btn" @click="handleConnect" :disabled="rigStore.isLoading">
          {{ rigStore.isLoading ? 'Connecting...' : 'Connect' }}
        </button>
        <button v-if="isConnected" class="reconnect" @click="handleReconnect" :disabled="rigStore.isLoading">
          Reconnect
        </button>
        <button v-if="isConnected" class="stop-btn" @click="handleDisconnect" :disabled="rigStore.isLoading">
          Disconnect
        </button>
        <button class="settings-btn" @click="showConnectionSettings">
          Settings
        </button>
      </div>
    </div>

    <!-- Connection Settings Dialog -->
    <div v-if="showConnectionDialog" class="connection-dialog-overlay" @click="closeConnectionDialog">
      <div class="connection-dialog" @click.stop>
        <h3>Rigctld Connection Settings</h3>
        <form @submit.prevent="saveConnectionSettings">
          <div class="form-group">
            <label for="host">Host:</label>
            <input
              id="host"
              v-model="connectionForm.host"
              type="text"
              placeholder="localhost"
              required
            />
          </div>
          <div class="form-group">
            <label for="port">Port:</label>
            <input
              id="port"
              v-model.number="connectionForm.port"
              type="number"
              placeholder="4532"
              required
            />
          </div>
          <div class="form-group">
            <label for="model">Rig Model (optional):</label>
            <input
              id="model"
              v-model.number="connectionForm.model"
              type="number"
              placeholder="e.g. 1025"
            />
          </div>
          <div class="form-group">
            <label for="device">Device (optional):</label>
            <input
              id="device"
              v-model="connectionForm.device"
              type="text"
              placeholder="e.g. /dev/ttyUSB0"
            />
          </div>
          <div class="dialog-buttons">
            <button type="button" @click="closeConnectionDialog">Cancel</button>
            <button type="submit" class="connect-btn">Connect</button>
          </div>
        </form>
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
  gap: 0.3rem;
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

.connection-status {
  font-size: 0.9rem;
  font-weight: bold;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  text-align: center;
}

.status-connected {
  background: #28a745;
  color: white;
}

.status-disconnected {
  background: #dc3545;
  color: white;
}

.status-connecting {
  background: #ffc107;
  color: black;
}

.rig-state {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.9rem;
}

.frequency-display,
.mode-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.freq-label,
.mode-label {
  color: var(--gray-color);
  font-weight: bold;
}

.frequency,
.mode {
  color: white;
  font-family: monospace;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  background: rgba(220, 53, 69, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.rig-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Connect (green) */
.connect-btn {
  background: #28a745;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
}

.connect-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Reconnect (orange) */
.reconnect {
  background: orange;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
}

.reconnect:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Disconnect (red) */
.stop-btn {
  background: #d83838;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
}

.stop-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Settings (blue) */
.settings-btn {
  background: #007bff;
  border: none;
  padding: 0.2rem 0.5rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
}

/* Connection Dialog */
.connection-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.connection-dialog {
  background: #2c2c2c;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 400px;
  max-width: 500px;
}

.connection-dialog h3 {
  color: white;
  margin: 0 0 1rem 0;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: white;
  margin-bottom: 0.3rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #555;
  border-radius: 4px;
  background: #1a1a1a;
  color: white;
  font-size: 0.9rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.dialog-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.dialog-buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.dialog-buttons button[type="button"] {
  background: #6c757d;
  color: white;
}

.dialog-buttons .connect-btn {
  background: #28a745;
  color: white;
}
</style>
