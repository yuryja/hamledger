export interface ConfigField {
  key: string;
  path: string[];
  value: string | number | boolean | string[];
  type: string;
  description?: string;
}

export interface ConfigCategory {
  name: string;
  fields: ConfigField[];
}
