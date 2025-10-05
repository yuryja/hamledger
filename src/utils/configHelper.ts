/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigField, ConfigCategory } from '../types/config';
import schema_json from '../settings.schema.json';
import defaultSettings from '../settings.json';
import '../types/electron';
import { IARURegion } from './bands';

export class ConfigHelper {
  private schema: any;
  private settings: any;

  constructor(schema = schema_json) {
    this.schema = schema;
    this.settings = defaultSettings;
  }

  public async initSettings(): Promise<void> {
    try {
      const settings = await window.electronAPI.loadSettings();
      if (settings) {
        this.settings = settings;
        // Migrate settings to add any new defaults from schema
        await this.migrateSettings();
      } else {
        // No settings found, throw error to trigger setup wizard
        throw new Error('No settings found');
      }
    } catch (error) {
      console.debug('Error loading settings:', error);
      // Re-throw the error so App.vue can catch it and show setup wizard
      throw error;
    }
  }

  public async saveSettings(newSettings: any): Promise<void> {
    try {
      await window.electronAPI.saveSettings(newSettings);
      this.settings = newSettings;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  public async updateSetting(path: string[], key: string, value: string | number | boolean | string[]): Promise<void> {
    let current = this.settings;

    // Navigate to the correct nested object
    for (const pathPart of path) {
      if (!current[pathPart]) {
        current[pathPart] = {};
      }
      current = current[pathPart];
    }

    // Update the value
    current[key] = value;

    // Save the entire settings object
    await this.saveSettings(this.settings);
  }

  public getSetting(path: string[], key: string): string | number | boolean | string[] | undefined {
    let current = this.settings;

    for (const pathPart of path) {
      if (!current[pathPart]) {
        // Generate default value from schema if path doesn't exist
        return this.getDefaultFromSchema(path, key);
      }
      current = current[pathPart];
    }

    return current[key] !== undefined ? current[key] : this.getDefaultFromSchema(path, key);
  }

  public getIARURegion(): IARURegion {
    const region = this.getSetting(['station'], 'iaruRegion') as IARURegion;
    return region || 'IARU1' as IARURegion;
  }

  public flattenConfig(obj: any = this.settings, path: string[] = []): ConfigField[] {
    return Object.entries(obj).reduce((acc: ConfigField[], [key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return [...acc, ...this.flattenConfig(value, [...path, key])];
      }
      
      // Type guard to ensure value is compatible with ConfigField
      const typedValue = this.ensureValidValue(value);
      
      return [
        ...acc,
        {
          key,
          path,
          value: typedValue,
          type: Array.isArray(value) ? 'array' : typeof value,
          description: this.getFieldDescription({
            key,
            path,
            value: typedValue,
            type: typeof value,
          }),
        },
      ];
    }, []);
  }

  private ensureValidValue(value: unknown): string | number | boolean | string[] {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      // Ensure all array elements are strings
      return value.map(item => String(item));
    }
    // Fallback for any other type
    return String(value);
  }

  public getFieldDescription(field: ConfigField): string {
    let current = this.schema;
    for (const pathPart of field.path) {
      if (current.properties && current.properties[pathPart]) {
        current = current.properties[pathPart];
      }
    }

    if (current.properties && current.properties[field.key]) {
      return current.properties[field.key].description || '';
    }

    return '';
  }

  public getFieldId(field: ConfigField): string {
    return [...field.path, field.key].join('-');
  }

  public getFieldLabel(field: ConfigField): string {
    return field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/([A-Z])/g, ' $1');
  }

  public processConfigValue(field: ConfigField, value: string): string | number | boolean {
    switch (field.type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }

  public getCategorizedFields(configFields: ConfigField[]): ConfigCategory[] {
    const categoriesMap = new Map<string, ConfigField[]>();

    configFields.forEach(field => {
      const category = field.path[0];
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)?.push(field);
    });

    return Array.from(categoriesMap.entries()).map(([name, fields]) => ({
      name,
      fields,
    }));
  }

  private getDefaultFromSchema(path: string[], key: string): string | number | boolean | string[] | undefined {
    let current = this.schema;

    // Navigate to the correct schema section
    if (current.properties) {
      for (const pathPart of path) {
        if (current.properties && current.properties[pathPart]) {
          current = current.properties[pathPart];
        } else {
          return undefined;
        }
      }

      // Get the property definition
      if (current.properties && current.properties[key]) {
        const property = current.properties[key];
        return this.getDefaultValueFromProperty(property);
      }
    }

    return undefined;
  }

  private getDefaultValueFromProperty(property: any): string | number | boolean | string[] | undefined {
    // If there's an explicit default value, use it
    if (property.default !== undefined) {
      return property.default;
    }

    // Generate sensible defaults based on type
    switch (property.type) {
      case 'boolean':
        return false;
      case 'integer':
      case 'number':
        // Use common default ports or 0
        if (property.description?.toLowerCase().includes('port')) {
          if (property.description.includes('rigctld')) return 4532;
          if (property.description.includes('wsjt-x')) return 2237;
        }
        return 0;
      case 'string':
        // Return empty string for most cases
        if (property.enum && property.enum.length > 0) {
          return property.enum[0]; // First enum value as default
        }
        return '';
      case 'array':
        return [];
      default:
        return undefined;
    }
  }

  /**
   * Migrate settings by adding missing properties from schema with default values
   */
  private async migrateSettings(): Promise<void> {
    const migratedSettings = this.deepClone(this.settings);

    // Generate default settings structure from schema
    const defaultSettings = this.generateDefaultSettingsFromSchema();
    
    // Merge defaults with existing settings
    const mergedSettings = this.deepMerge(defaultSettings, migratedSettings);
    
    // Check if there are any changes
    if (JSON.stringify(this.settings) !== JSON.stringify(mergedSettings)) {
      console.log('Settings migration: Adding new default values from schema');
      
      // Save the migrated settings
      await this.saveSettings(mergedSettings);
      console.log('Settings migration completed successfully');
    }
  }

  /**
   * Generate complete default settings structure from schema
   */
  private generateDefaultSettingsFromSchema(): any {
    return this.generateDefaultsFromSchemaObject(this.schema);
  }

  /**
   * Recursively generate defaults from schema object
   */
  private generateDefaultsFromSchemaObject(schemaObj: any): any {
    if (!schemaObj.properties) {
      return {};
    }

    const defaults: any = {};

    for (const [key, property] of Object.entries(schemaObj.properties)) {
      const prop = property as any;
      
      if (prop.type === 'object' && prop.properties) {
        // Recursively handle nested objects
        defaults[key] = this.generateDefaultsFromSchemaObject(prop);
      } else {
        // Generate default value for primitive types
        defaults[key] = this.getDefaultValueFromProperty(prop);
      }
    }

    return defaults;
  }

  /**
   * Deep merge two objects, with existing values taking precedence
   */
  private deepMerge(defaults: any, existing: any): any {
    const result = this.deepClone(defaults);

    for (const key in existing) {
      if (Object.prototype.hasOwnProperty.call(existing, key)) {
        if (existing[key] && typeof existing[key] === 'object' && !Array.isArray(existing[key])) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(result[key] || {}, existing[key]);
        } else {
          // Use existing value (including arrays and primitives)
          result[key] = existing[key];
        }
      }
    }

    return result;
  }

  /**
   * Deep clone an object
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }
}

export const configHelper = new ConfigHelper();
