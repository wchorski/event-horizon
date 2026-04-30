export type TableRow = Record<string, any> & { id: number };

export type TableContext = {
  config: FieldConfig;
  crud: CrudRegistryType;
  endpoint: string;
  headers: string[];
};
