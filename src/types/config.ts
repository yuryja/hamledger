export interface ConfigField {
  key: string;
  path: string[];
  value: any;
  type: string;
  description?: string;
}

export interface ConfigCategory {
  name: string;
  fields: ConfigField[];
}
