import { ConfigField, ConfigCategory } from "../types/config";
import settings from "../settings.json";
import schema from "../settings.schema.json";

export class ConfigHelper {
  private schema: any;
  private settings: any;

  constructor(settings = settings, schema = schema) {
    this.settings = settings;
    this.schema = schema;
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
