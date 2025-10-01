<script lang="ts">
import { ConfigField } from '../types/config';
import { configHelper } from '../utils/configHelper';
import { BAND_RANGES } from '../utils/bands';

export default {
  name: 'ConfigView',
  data() {
    return {
      selectedCategory: 'Station',
      searchQuery: '',
      configFields: [] as ConfigField[],
    };
  },
  computed: {
    categories() {
      const cats = configHelper.getCategorizedFields(this.configFields);
      return cats.map(category => ({
        ...category,
        name: this.getCategoryDisplayName(category.name),
      }));
    },
    filteredFields() {
      if (!this.searchQuery) {
        const category = this.categories.find(cat => cat.name === this.selectedCategory);
        return category?.fields || [];
      }
      return this.configFields.filter(field => {
        const searchStr = this.searchQuery.toLowerCase();
        const fieldPath = [...field.path, field.key].join(' ').toLowerCase();
        return fieldPath.includes(searchStr);
      });
    },
    currentCategoryEnabled() {
      const categoryKey = this.selectedCategory.toLowerCase().replace(' ', '');
      const categoryMap = {
        'station': 'station',
        'catcontrol': 'rig',
        'onlineservices': 'qrz',
        'apis': 'apis',
        'database': 'database',
        'ui': 'ui',
        'logging': 'logging'
      };
      
      const actualKey = categoryMap[categoryKey] || categoryKey;
      const enabledField = this.configFields.find(f => 
        f.path[0] === actualKey && f.key === 'enabled'
      );
      
      return enabledField ? enabledField.value : true;
    },
    hasCategoryEnabler() {
      const categoryKey = this.selectedCategory.toLowerCase().replace(' ', '');
      const categoriesWithEnabler = ['catcontrol', 'onlineservices', 'database'];
      return categoriesWithEnabler.includes(categoryKey);
    }
  },
  async mounted() {
    await configHelper.initSettings();
    this.configFields = configHelper.flattenConfig();
  },
  methods: {
    getCategoryDisplayName(categoryName: string): string {
      const displayNames: { [key: string]: string } = {
        rig: 'CAT Control',
        qrz: 'Online Services',
        apis: 'APIs',
        station: 'Station',
        database: 'Database',
        ui: 'UI',
        logging: 'Logging',
      };
      return displayNames[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    },
    getFieldId(field: ConfigField): string {
      return configHelper.getFieldId(field);
    },
    getFieldLabel(field: ConfigField): string {
      return configHelper.getFieldLabel(field);
    },
    async handleChange(field: ConfigField, event: Event) {
      const target = event.target as HTMLInputElement;
      let value: any;
      
      if (target.type === 'checkbox') {
        value = target.checked;
      } else if (target.type === 'number') {
        value = Number(target.value);
      } else {
        value = target.value;
      }
      
      try {
        await configHelper.updateSetting(field.path, field.key, value);
        
        // Find and update the field in configFields array to trigger reactivity
        const fieldIndex = this.configFields.findIndex(f => 
          f.key === field.key && 
          f.path.join('.') === field.path.join('.')
        );
        
        if (fieldIndex !== -1) {
          this.$set(this.configFields, fieldIndex, {
            ...this.configFields[fieldIndex],
            value: value
          });
        }
      } catch (error) {
        console.error('Error updating setting:', error);
      }
    },
    getAvailableBands() {
      return BAND_RANGES.filter(band =>
        ['160', '80', '60', '40', '30', '20', '17', '15', '12', '10', '6', '2', '70'].includes(
          band.shortName
        )
      );
    },
    async toggleBandInConfig(field: ConfigField, bandShortName: string, event: Event) {
      const target = event.target as HTMLInputElement;
      const currentBands = [...field.value];

      if (target.checked) {
        if (!currentBands.includes(bandShortName)) {
          currentBands.push(bandShortName);
        }
      } else {
        const index = currentBands.indexOf(bandShortName);
        if (index > -1) {
          currentBands.splice(index, 1);
        }
      }

      await configHelper.updateSetting(field.path, field.key, currentBands);
      
      // Update the field in the reactive array
      const fieldIndex = this.configFields.findIndex(f => 
        f.key === field.key && 
        f.path.join('.') === field.path.join('.')
      );
      
      if (fieldIndex !== -1) {
        this.$set(this.configFields, fieldIndex, {
          ...this.configFields[fieldIndex],
          value: currentBands
        });
      }
    },
    async selectAllHFBands(field: ConfigField) {
      const hfBands = ['160', '80', '60', '40', '30', '20', '17', '15', '12', '10'];
      await configHelper.updateSetting(field.path, field.key, hfBands);
      
      const fieldIndex = this.configFields.findIndex(f => 
        f.key === field.key && 
        f.path.join('.') === field.path.join('.')
      );
      
      if (fieldIndex !== -1) {
        this.$set(this.configFields, fieldIndex, {
          ...this.configFields[fieldIndex],
          value: hfBands
        });
      }
    },
    async selectAllVHFUHFBands(field: ConfigField) {
      const vhfUhfBands = ['6', '2', '70'];
      const currentBands = [...field.value];
      const newBands = [
        ...currentBands,
        ...vhfUhfBands.filter(band => !currentBands.includes(band)),
      ];
      await configHelper.updateSetting(field.path, field.key, newBands);
      
      const fieldIndex = this.configFields.findIndex(f => 
        f.key === field.key && 
        f.path.join('.') === field.path.join('.')
      );
      
      if (fieldIndex !== -1) {
        this.$set(this.configFields, fieldIndex, {
          ...this.configFields[fieldIndex],
          value: newBands
        });
      }
    },
    async clearAllBands(field: ConfigField) {
      await configHelper.updateSetting(field.path, field.key, []);
      
      const fieldIndex = this.configFields.findIndex(f => 
        f.key === field.key && 
        f.path.join('.') === field.path.join('.')
      );
      
      if (fieldIndex !== -1) {
        this.$set(this.configFields, fieldIndex, {
          ...this.configFields[fieldIndex],
          value: []
        });
      }
    },
    async toggleCategoryEnabled(enabled: boolean) {
      const categoryKey = this.selectedCategory.toLowerCase().replace(' ', '');
      const categoryMap = {
        'catcontrol': 'rig',
        'onlineservices': 'qrz',
        'database': 'database'
      };
      
      const actualKey = categoryMap[categoryKey];
      if (actualKey) {
        await configHelper.updateSetting([actualKey], 'enabled', enabled);
        
        const fieldIndex = this.configFields.findIndex(f => 
          f.path[0] === actualKey && f.key === 'enabled'
        );
        
        if (fieldIndex !== -1) {
          this.$set(this.configFields, fieldIndex, {
            ...this.configFields[fieldIndex],
            value: enabled
          });
        }
      }
    },
  },
};
</script>

<template>
  <main class="config-panel">
    <div class="config-container">
      <div class="config-header">
        <h2 class="section-title">Configuration</h2>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search settings..."
            class="search-input"
          />
        </div>
      </div>

      <div class="config-layout">
        <!-- Categories sidebar -->
        <nav class="config-sidebar">
          <ul class="category-list">
            <li
              v-for="category in categories"
              :key="category.name"
              :class="['category-item', { active: category.name === selectedCategory }]"
              @click="selectedCategory = category.name"
            >
              {{ category.name.charAt(0).toUpperCase() + category.name.slice(1) }}
            </li>
          </ul>
        </nav>

        <!-- Main config area -->
        <div class="config-main">
          <!-- Category enabler -->
          <div v-if="hasCategoryEnabler" class="category-enabler">
            <div class="enabler-header">
              <h3>{{ selectedCategory }}</h3>
              <div class="boolean-field">
                <div class="toggle-switch">
                  <input
                    type="checkbox"
                    :id="`category-${selectedCategory}-enabled`"
                    :checked="currentCategoryEnabled"
                    @change="toggleCategoryEnabled($event.target.checked)"
                  />
                  <span class="slider"></span>
                </div>
                <span class="toggle-label">{{ currentCategoryEnabled ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>
          </div>

          <div class="config-fields" :class="{ 'disabled': hasCategoryEnabler && !currentCategoryEnabled }">
            <div v-for="field in filteredFields" :key="getFieldId(field)" class="config-field">
              <div class="field-header">
                <label :for="getFieldId(field)">{{ getFieldLabel(field) }}</label>
                <span v-if="field.description" class="field-description">{{
                  field.description
                }}</span>
              </div>

              <!-- Boolean (skip enabled field if it's the category enabler) -->
              <div v-if="field.type === 'boolean' && !(hasCategoryEnabler && field.key === 'enabled')" class="boolean-field">
                <div class="toggle-switch">
                  <input
                    type="checkbox"
                    :id="getFieldId(field)"
                    :checked="!!field.value"
                    @change="handleChange(field, $event)"
                  />
                  <span class="slider"></span>
                </div>
                <span class="toggle-label">{{ field.value ? 'Enabled' : 'Disabled' }}</span>
              </div>

              <!-- Number -->
              <input
                v-else-if="field.type === 'number'"
                type="number"
                :id="getFieldId(field)"
                :value="field.value"
                @input="handleChange(field, $event)"
              />

              <!-- Band selection (special case for selectedBands) -->
              <div v-else-if="field.key === 'selectedBands'" class="band-selection">
                <div class="band-selection-controls">
                  <button type="button" @click="selectAllHFBands(field)" class="btn btn-small">
                    All HF
                  </button>
                  <button type="button" @click="selectAllVHFUHFBands(field)" class="btn btn-small">
                    VHF/UHF
                  </button>
                  <button type="button" @click="clearAllBands(field)" class="btn btn-small">
                    Clear All
                  </button>
                </div>
                <div class="band-grid">
                  <label
                    v-for="band in getAvailableBands()"
                    :key="band.shortName"
                    class="band-checkbox"
                  >
                    <input
                      type="checkbox"
                      :value="band.shortName"
                      :checked="field.value.includes(band.shortName)"
                      @change="toggleBandInConfig(field, band.shortName, $event)"
                    />
                    <span class="band-label">{{ band.name }} ({{ band.shortName }}m)</span>
                  </label>
                </div>
              </div>

              <!-- Array (as select) -->
              <select
                v-else-if="
                  field.type === 'array' &&
                  field.value.every((v: any) => typeof v !== 'object') &&
                  field.key !== 'selectedBands'
                "
                :id="getFieldId(field)"
                @change="handleChange(field, $event)"
              >
                <option v-for="option in field.value" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>

              <!-- String -->
              <input
                v-else
                type="text"
                :id="getFieldId(field)"
                :value="field.value"
                @input="handleChange(field, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.config-panel {
  display: flex;
  width: 100%;
  height: calc(100vh - 2rem);
}

.config-container {
  background: #333;
  border-radius: 5px;
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 0;
  min-height: 0;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.search-box {
  flex: 0 1 300px;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  background: #444;
  border: 1px solid #555;
  color: #fff;
  border-radius: 3px;
}

.config-layout {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.config-sidebar {
  flex: 0 0 200px;
  min-width: 200px;
  background: #2b2b2b;
  border-radius: 4px;
  overflow-y: auto;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  padding: 0.75rem 1rem;
  color: var(--gray-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-item:hover {
  background: #3b3b3b;
}

.category-item.active {
  background: var(--main-color);
  color: #000;
}

.config-main {
  flex: 1;
  overflow-y: auto;
  background: #2b2b2b;
  border-radius: 4px;
  padding: 1rem;
  min-width: 0;
  min-height: 0;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #333;
  border-radius: 4px;
  border: 1px solid #444;
  width: 100%;
}

.field-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.config-field label {
  color: var(--gray-color);
  font-size: 0.9rem;
  font-weight: bold;
}

.field-description {
  font-size: 0.8rem;
  color: #666;
}

.config-field input[type='text'],
.config-field input[type='number'],
.config-field select {
  background: #444;
  border: 1px solid #555;
  padding: 0.5rem;
  color: #fff;
  border-radius: 3px;
  width: 100%;
}

.boolean-field {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Toggle switch styling */
.toggle-switch {
  position: relative;
  width: 60px;
  height: 34px;
  flex-shrink: 0;
}

.toggle-switch input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
  z-index: 1;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: 0.4s;
  border-radius: 34px;
  pointer-events: none;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--main-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-label {
  color: var(--gray-color);
  font-size: 0.9rem;
  font-weight: normal;
}

.band-selection {
  width: 100%;
}

.band-selection-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  background: #555;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #666;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.band-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.band-checkbox {
  display: flex !important;
  align-items: center;
  padding: 0.5rem;
  background: #444;
  border: 1px solid #555;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.band-checkbox:hover {
  background: #555;
}

.band-checkbox input[type='checkbox'] {
  margin-right: 0.5rem;
  width: auto;
}

.band-label {
  font-size: 0.85rem;
  color: var(--gray-color);
}

.category-enabler {
  background: #333;
  border: 2px solid var(--main-color);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.enabler-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.enabler-header h3 {
  margin: 0;
  color: var(--gray-color);
  font-size: 1.2rem;
}

.config-fields.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.config-fields.disabled .config-field {
  background: #2a2a2a;
}
</style>
