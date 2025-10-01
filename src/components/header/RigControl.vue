<script lang="ts">
import { useRigStore } from '../../store/rig';
import { configHelper } from '../../utils/configHelper';
import type { RigModel } from '../../types/rig';

export default {
  name: 'RigControl',
  data() {
    return {
      rigStore: useRigStore(),
      rigModel: '',
      rigPort: '',
      showConnectionDialog: false,
      rigModels: [] as RigModel[],
      loadingModels: false,
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
    await this.loadRigModels();
    // Auto-connect if configuration exists
    if (this.connectionForm.host && this.connectionForm.port) {
      await this.handleConnect();
    }
  },
  computed: {
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
    groupedModels() {
      const grouped = new Map();
      
      for (const model of this.rigModels) {
        if (!grouped.has(model.manufacturer)) {
          grouped.set(model.manufacturer, {
            name: model.manufacturer,
            models: []
          });
        }
        grouped.get(model.manufacturer).models.push(model);
      }
      
      // Sort manufacturers and models within each group
      const result = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
      result.forEach(group => {
        group.models.sort((a, b) => a.model.localeCompare(b.model));
      });
      
      return result;
    },
  },
  methods: {
    async loadRigConfig() {
      await configHelper.initSettings();
      
      // Get rig model number from config
      const rigModelNumber = configHelper.getSetting(['rig'], 'rigModel');
      
      // Find rig name from the loaded models list
      if (rigModelNumber && this.rigModels.length > 0) {
        const rigModel = this.rigModels.find(model => model.id === rigModelNumber);
        this.rigModel = rigModel ? `${rigModel.manufacturer} ${rigModel.model}` : `Model ${rigModelNumber}`;
      } else {
        this.rigModel = this.rigStore.rigModel;
      }
      
      this.rigPort = configHelper.getSetting(['rig'], 'port') || 'localhost:4532';
      
      // Load connection settings
      this.connectionForm.host = configHelper.getSetting(['rig'], 'host') || 'localhost';
      this.connectionForm.port = configHelper.getSetting(['rig'], 'port') || 4532;
      this.connectionForm.model = rigModelNumber;
      this.connectionForm.device = configHelper.getSetting(['rig'], 'device');
    },

    async loadRigModels() {
      this.loadingModels = true;
      try {
        const response = await window.electronAPI.executeCommand('rigctld -l');
        if (response.success && response.data) {
          this.rigModels = this.parseRigModels(response.data);
          // Reload rig config after models are loaded to get the correct name
          await this.loadRigConfig();
        } else {
          console.error('Failed to load rig models:', response.error);
        }
      } catch (error) {
        console.error('Error loading rig models:', error);
      } finally {
        this.loadingModels = false;
      }
    },

    parseRigModels(output: string): RigModel[] {
      const lines = output.split('\n');
      const models = [];
      
      for (const line of lines) {
        // Skip header and empty lines
        if (line.trim() === '' || line.includes('Rig #') || line.includes('---')) {
          continue;
        }
        
        // Parse each line: "  1025  Yaesu                  MARK-V Field FT-1000MP  20210318.0      Stable      RIG_MODEL_FT1000MPMKVFLD"
        const match = line.match(/^\s*(\d+)\s+([^\s]+)\s+(.+?)\s+\d{8}\.\d+\s+(Alpha|Beta|Stable|Untested)\s+/);
        if (match) {
          const [, id, manufacturer, model, status] = match;
          models.push({
            id: parseInt(id),
            manufacturer: manufacturer.trim(),
            model: model.trim(),
            status: status.trim()
          });
        }
      }
      
      return models;
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
      // Check if model changed
      const currentModel = configHelper.getSetting(['rig'], 'rigModel');
      const modelChanged = currentModel !== this.connectionForm.model;
      
      // Save to config (only save the model number, not the name)
      await configHelper.updateSetting(['rig'], 'host', this.connectionForm.host);
      await configHelper.updateSetting(['rig'], 'port', this.connectionForm.port);
      if (this.connectionForm.model) {
        await configHelper.updateSetting(['rig'], 'rigModel', this.connectionForm.model);
      }
      if (this.connectionForm.device) {
        await configHelper.updateSetting(['rig'], 'device', this.connectionForm.device);
      }
      
      // Update the displayed rig model name
      if (this.connectionForm.model) {
        const rigModel = this.rigModels.find(model => model.id === this.connectionForm.model);
        if (rigModel) {
          this.rigModel = `${rigModel.manufacturer} ${rigModel.model}`;
        }
      }
      
      // If model changed, restart rigctld
      if (modelChanged) {
        console.log('Rig model changed, restarting rigctld...');
        try {
          const response = await window.electronAPI.rigctldRestart();
          if (!response.success) {
            console.error('Failed to restart rigctld:', response.error);
          }
        } catch (error) {
          console.error('Error restarting rigctld:', error);
        }
        
        // Wait a moment for rigctld to restart
        await new Promise(resolve => setTimeout(resolve, 2000));
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
            <select
              id="model"
              v-model.number="connectionForm.model"
              :disabled="loadingModels"
            >
              <option :value="undefined">Select a rig model...</option>
              <optgroup v-for="manufacturer in groupedModels" :key="manufacturer.name" :label="manufacturer.name">
                <option 
                  v-for="model in manufacturer.models" 
                  :key="model.id" 
                  :value="model.id"
                  :title="`Status: ${model.status}`"
                >
                  {{ model.model }} ({{ model.id }}) - {{ model.status }}
                </option>
              </optgroup>
            </select>
            <div v-if="loadingModels" class="loading-text">Loading rig models...</div>
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

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
}

.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #555;
  border-radius: 4px;
  background: #1a1a1a;
  color: white;
  font-size: 0.9rem;
}

.form-group select:disabled {
  background: #333;
  color: #999;
  cursor: not-allowed;
}

.loading-text {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.2rem;
  font-style: italic;
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
