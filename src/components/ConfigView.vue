<script lang="ts">
import { ref, onMounted } from 'vue'
import settings from '../settings.json'

interface ConfigField {
  key: string
  path: string[]
  value: any
  type: string
}

export default {
  name: 'ConfigView',
  setup() {
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
          type: Array.isArray(value) ? 'array' : typeof value
        }]
      }, [])
    }

    onMounted(() => {
      configFields.value = flattenConfig(settings)
    })

    function getFieldId(field: ConfigField): string {
      return [...field.path, field.key].join('-')
    }

    function getFieldLabel(field: ConfigField): string {
      return [...field.path, field.key].join(' > ')
    }

    function handleChange(field: ConfigField, event: Event) {
      const target = event.target as HTMLInputElement
      let value: any = target.value
      
      // Convert value based on field type
      switch(field.type) {
        case 'number':
          value = Number(value)
          break
        case 'boolean':
          value = target.checked
          break
      }

      // Here you would update the config
      console.log(`Updating ${getFieldLabel(field)} to:`, value)
    }

    return {
      configFields,
      getFieldId,
      getFieldLabel,
      handleChange
    }
  }
}
</script>

<template>
  <main class="config-container">
    <h2 class="section-title">Configuration</h2>
    
    <div class="config-grid">
      <div v-for="field in configFields" 
           :key="getFieldId(field)" 
           class="config-field">
        <label :for="getFieldId(field)">{{ getFieldLabel(field) }}</label>
        
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

        <!-- Array (as select if it contains primitives) -->
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
  </main>
</template>

<style scoped>
.config-container {
  background: #333;
  border-radius: 5px;
  padding: 1rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #2b2b2b;
  border-radius: 4px;
  border: 1px solid var(--main-color);
}

.config-field label {
  color: var(--gray-color);
  font-size: 0.9rem;
}

.config-field input[type="text"],
.config-field input[type="number"],
.config-field select {
  background: #444;
  border: 1px solid #555;
  padding: 0.5rem;
  color: #fff;
  border-radius: 3px;
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
