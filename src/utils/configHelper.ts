/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigField, ConfigCategory } from '../types/config';
import schema_json from '../settings.schema.json';
import defaultSettings from '../settings.json';
import '../types/electron';

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

  public async updateSetting(path: string[], key: string, value: any): Promise<void> {
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

  public getSetting(path: string[], key: string): any {
    let current = this.settings;

    for (const pathPart of path) {
      if (!current[pathPart]) {
        return undefined;
      }
      current = current[pathPart];
    }

    return current[key];
  }

  public getIARURegion(): 'IARU1' | 'IARU2' | 'IARU3' {
    const region = this.getSetting(['station'], 'iaruRegion');
    return region || 'IARU1';
  }

  public flattenConfig(obj: any = this.settings, path: string[] = []): ConfigField[] {
    return Object.entries(obj).reduce((acc: ConfigField[], [key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return [...acc, ...this.flattenConfig(value, [...path, key])];
      }
      return [
        ...acc,
        {
          key,
          path,
          value,
          type: Array.isArray(value) ? 'array' : typeof value,
          description: this.getFieldDescription({
            key,
            path,
            value,
            type: typeof value,
          }),
        },
      ];
    }, []);
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

  public processConfigValue(field: ConfigField, value: string): any {
    switch (field.type) {
      case 'number':
        return Number(value);
      case 'boolean':
        ##AI! This comparison appears to be unintentional because the types 'string' and 'boolean' have no overlap.
        return value === 'true' || value === true;
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
}

export const configHelper = new ConfigHelper();
