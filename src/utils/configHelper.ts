import { ConfigField, ConfigCategory } from "../types/config";
import schema from "../settings.schema.json";
import { join } from 'path';
import { app } from '@electron/remote';
import fs from 'fs';

export class ConfigHelper {
  private schema: any;
  private settings: any;
  private settingsPath: string;

  constructor(schema = schema) {
    this.schema = schema;
    this.settingsPath = join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): any {
    try {
      // First try to load from user data directory
      if (fs.existsSync(this.settingsPath)) {
        const userSettings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
        return userSettings;
      }

      // If no user settings exist, load default settings from the app
      const defaultSettings = JSON.parse(fs.readFileSync(join(__dirname, '../settings.json'), 'utf8'));
      // Save default settings to user directory
      this.saveSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  public saveSettings(newSettings: any): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(newSettings, null, 2));
      this.settings = newSettings;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  public updateSetting(path: string[], key: string, value: any): void {
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
    this.saveSettings(this.settings);
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

  public flattenConfig(
    obj: any = this.settings,
    path: string[] = []
  ): ConfigField[] {
    return Object.entries(obj).reduce((acc: ConfigField[], [key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return [...acc, ...this.flattenConfig(value, [...path, key])];
      }
      return [
        ...acc,
        {
          key,
          path,
          value,
          type: Array.isArray(value) ? "array" : typeof value,
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
      return current.properties[field.key].description || "";
    }

    return "";
  }

  public getFieldId(field: ConfigField): string {
    return [...field.path, field.key].join("-");
  }

  public getFieldLabel(field: ConfigField): string {
    return (
      field.key.charAt(0).toUpperCase() +
      field.key.slice(1).replace(/([A-Z])/g, " $1")
    );
  }

  public processConfigValue(field: ConfigField, value: string): any {
    switch (field.type) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      default:
        return value;
    }
  }

  public getCategorizedFields(configFields: ConfigField[]): ConfigCategory[] {
    const categoriesMap = new Map<string, ConfigField[]>();

    configFields.forEach((field) => {
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

// Get the entire settings object
public getSettings(): any {
  return this.settings;
}
