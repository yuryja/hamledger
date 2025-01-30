<script lang="ts">
import { ConfigField } from '../types/config'
import { configHelper } from '../utils/configHelper'

export default {
  name: 'ConfigView',
  data() {
    return {
      selectedCategory: 'station',
      searchQuery: '',
      configFields: [] as ConfigField[],
    }
  },
  computed: {
    categories() {
      return configHelper.getCategorizedFields(this.configFields)
    },
    filteredFields() {
      if (!this.searchQuery) {
        return this.categories.find(cat => cat.name === this.selectedCategory)?.fields || []
      }
      return this.configFields.filter(field => {
        const searchStr = this.searchQuery.toLowerCase()
        const fieldPath = [...field.path, field.key].join(' ').toLowerCase()
        return fieldPath.includes(searchStr)
      })
    }
  },
  mounted() {
    this.configFields = configHelper.flattenConfig()
  },
  methods: {
    getFieldId(field: ConfigField): string {
      return configHelper.getFieldId(field)
    },
    getFieldLabel(field: ConfigField): string {
      return configHelper.getFieldLabel(field)
    },
    handleChange(field: ConfigField, event: Event) {
      const target = event.target as HTMLInputElement
      const value = configHelper.processConfigValue(
        field, 
        target.type === 'checkbox' ? String(target.checked) : target.value
      )
      configHelper.updateSetting(field.path, field.key, value)
  }
}
</script>

<template>
  <main class="config-panel">
    <div class="config-container">
      <div class="config-header">
        <h2 class="section-title">Configuration</h2>
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="Search settings..." class="search-input">
        </div>
      </div>

      <div class="config-layout">
        <!-- Categories sidebar -->
        <nav class="config-sidebar">
          <ul class="category-list">
            <li v-for="category in categories" :key="category.name"
              :class="['category-item', { active: category.name === selectedCategory }]"
              @click="selectedCategory = category.name">
              {{ category.name.charAt(0).toUpperCase() + category.name.slice(1) }}
            </li>
          </ul>
        </nav>

        <!-- Main config area -->
        <div class="config-main">
          <div class="config-fields">
            <div v-for="field in filteredFields" :key="getFieldId(field)" class="config-field">
              <div class="field-header">
                <label :for="getFieldId(field)">{{ getFieldLabel(field) }}</label>
                <span v-if="field.description" class="field-description">{{ field.description }}</span>
              </div>

              <!-- Boolean -->
              <div v-if="field.type === 'boolean'" class="toggle-switch">
                <input type="checkbox" :id="getFieldId(field)" :checked="field.value"
                  @change="handleChange(field, $event)">
                <span class="slider"></span>
              </div>

              <!-- Number -->
              <input v-else-if="field.type === 'number'" type="number" :id="getFieldId(field)" :value="field.value"
                @input="handleChange(field, $event)">

              <!-- Array (as select) -->
              <select v-else-if="field.type === 'array' && field.value.every((v: any) => typeof v !== 'object')"
                :id="getFieldId(field)" @change="handleChange(field, $event)">
                <option v-for="option in field.value" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>

              <!-- String -->
              <input v-else type="text" :id="getFieldId(field)" :value="field.value"
                @input="handleChange(field, $event)">
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

.config-field input[type="text"],
.config-field input[type="number"],
.config-field select {
  background: #444;
  border: 1px solid #555;
  padding: 0.5rem;
  color: #fff;
  border-radius: 3px;
  width: 100%;
}

/* Toggle switch styling */
.toggle-switch {
  position: relative;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: var(--main-color);
}

input:checked+.slider:before {
  transform: translateX(26px);
}
</style>
