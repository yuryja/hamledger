export interface ConfigField {
  key: string;
  path: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  type: string;
  description?: string;
}

export interface ConfigCategory {
  name: string;
  fields: ConfigField[];
}
