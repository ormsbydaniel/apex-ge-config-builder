export interface CatalogueRecord {
  id: string;
  type?: string;
  conformsTo?: string[];
  properties?: {
    title?: string;
    description?: string;
    [k: string]: any;
  };
  links?: Array<{ rel: string; href: string; type?: string; title?: string }>;
  [k: string]: any;
}

export interface CatalogueEntry {
  provider: string;
  algorithmId: string;
  name: string;
  description: string;
  path: string;
  thumbnail?: string;
  record: CatalogueRecord;
}

export interface MappedWorkflowFields {
  serviceId: string;
  serviceProvider: string;
  serviceDetails?: {
    endpoint: string;
    namespace?: string;
    application?: string;
  };
  /** Catalogue-derived metadata, available when selected from the catalogue browser. */
  description?: string;
  providerLabel?: string;
}
