<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import settings from '../settings.json'
import schema from '../settings.schema.json'
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
          description: getFieldDescription({key, path, value, type: typeof value})
        }]
      }, [])
    }

    function getFieldDescription(field: ConfigField): string {
      // Navigate the schema to find the field's description
      let current = schema
      for (const pathPart of field.path) {
        if (current.properties && current.properties[pathPart]) {
          current = current.properties[pathPart]
        }
      }
      
      if (current.properties && current.properties[field.key]) {
        return current.properties[field.key].description || ''
      }
      
      return ''
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

