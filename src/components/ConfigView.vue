<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import settings from '../settings.json'
import { useRigStore } from '../store/rig'

interface ConfigField {
  key: string
  path: string[]
  value: any
  type: string
  description?: string
}

interface ConfigCategory {
  name: string
  fields: ConfigField[]
}

export default {
  name: 'ConfigView',
  setup() {
    const selectedCategory = ref('station')
    const searchQuery = ref('')
    const configFields = ref<ConfigField[]>([])

    function flattenConfig(obj: any, path: string[] = []): ConfigField[] {
      return Object.entries(obj).reduce((acc: ConfigField[], [key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return [...acc, ...flattenConfig(value, [...path, key])]
        }
        return [...acc, {
          key,
          path,
          value,
          type: Array.isArray(value) ? 'array' : typeof value,
          description: getFieldDescription(key)
        }]
      }, [])
    }

    function getFieldDescription(key: string): string {
      const descriptions: { [key: string]: string } = {
        callsign: 'Your station callsign',
        operator: 'Name of the operator',
        qth: 'Your station location',
        grid: 'Maidenhead grid locator',
        timezone: 'Your local timezone',
        model: 'Radio model',
        port: 'Serial port for rig control',
        baudRate: 'Serial port baud rate',
        pollInterval: 'Rig polling interval in ms',
        username: 'QRZ.com username',
        password: 'QRZ.com password',
        theme: 'UI color theme',
        defaultBand: 'Default band for new QSOs',
        defaultMode: 'Default mode for new QSOs',
        defaultRst: 'Default RST report',
        level: 'Logging detail level',
        maxSize: 'Maximum log file size in bytes',
        maxFiles: 'Number of log files to keep'
      }
      return descriptions[key] || ''
    }

    const categories = computed(() => {
      const cats = new Map<string, ConfigField[]>()
      configFields.value.forEach(field => {
        const category = field.path[0]
        if (!cats.has(category)) {
          cats.set(category, [])
        }
        cats.get(category)?.push(field)
      })
      return Array.from(cats.entries()).map(([name, fields]) => ({
        name,
        fields
      }))
    })

    const filteredFields = computed(() => {
      if (!searchQuery.value) {
        return categories.value.find(cat => cat.name === selectedCategory.value)?.fields || []
      }
      return configFields.value.filter(field => {
        const searchStr = searchQuery.value.toLowerCase()
        const fieldPath = [...field.path, field.key].join(' ').toLowerCase()
        return fieldPath.includes(searchStr)
      })
    })

    onMounted(() => {
      configFields.value = flattenConfig(settings)
    })

    function getFieldId(field: ConfigField): string {
      return [...field.path, field.key].join('-')
    }

    function getFieldLabel(field: ConfigField): string {
      return field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/([A-Z])/g, ' $1')
    }

    function handleChange(field: ConfigField, event: Event) {
      const target = event.target as HTMLInputElement
      let value: any = target.value
      
      switch(field.type) {
        case 'number':
          value = Number(value)
          break
        case 'boolean':
          value = target.checked
          break
      }

      console.log(`Updating ${[...field.path, field.key].join('.')} to:`, value)
    }

    return {
      selectedCategory,
      searchQuery,
      categories,
      filteredFields,
      getFieldId,
      getFieldLabel,
      handleChange
    }
  }
}
</script>

<template>
  <main class="config-container">
    <div class="config-header">
      <h2 class="section-title">Configuration</h2>
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search settings..."
          class="search-input"
        >
      </div>
    </div>
    
    <div class="config-layout">
      <!-- Categories sidebar -->
      <nav class="config-sidebar">
        <ul class="category-list">
          <li v-for="category in categories" 
              :key="category.name"
              :class="['category-item', { active: category.name === selectedCategory }]"
              @click="selectedCategory = category.name">
            {{ category.name.charAt(0).toUpperCase() + category.name.slice(1) }}
          </li>
        </ul>
      </nav>

      <!-- Main config area -->
      <div class="config-main">
        <div class="config-fields">
          <div v-for="field in filteredFields" 
               :key="getFieldId(field)" 
               class="config-field">
            <div class="field-header">
              <label :for="getFieldId(field)">{{ getFieldLabel(field) }}</label>
              <span v-if="field.description" class="field-description">{{ field.description }}</span>
            </div>
            
            <!-- Boolean -->
            <div v-if="field.type === 'boolean'" class="toggle-switch">
              <input type="checkbox"
                     :id="getFieldId(field)"
                     :checked="field.value"
                     @change="handleChange(field, $event)">
              <span class="slider"></span>
            </div>

            <!-- Number -->
            <input v-else-if="field.type === 'number'"
                   type="number"
                   :id="getFieldId(field)"
                   :value="field.value"
                   @input="handleChange(field, $event)">

            <!-- Array (as select) -->
            <select v-else-if="field.type === 'array' && field.value.every((v: any) => typeof v !== 'object')"
                    :id="getFieldId(field)"
                    @change="handleChange(field, $event)">
              <option v-for="option in field.value" 
                      :key="option" 
                      :value="option">
                {{ option }}
              </option>
            </select>

            <!-- String -->
            <input v-else
                   type="text"
                   :id="getFieldId(field)"
                   :value="field.value"
                   @input="handleChange(field, $event)">
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.config-container {
  background: #333;
  border-radius: 5px;
  padding: 1rem;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-right: 1rem;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-box {
  flex: 0 0 300px;
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
  overflow: hidden;
  width: 100%;
  height: 100%;
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
  width: 100%;
  min-width: 0; /* Prevents flex item from overflowing */
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
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

input:checked + .slider {
  background-color: var(--main-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
