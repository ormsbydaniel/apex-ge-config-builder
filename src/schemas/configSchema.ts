import { z } from 'zod';

export const CategorySchema = z.object({
  color: z.string(),
  label: z.string(),
  value: z.number().optional(), // Add optional value field
});

export const ServiceCapabilitiesSchema = z.object({
  layers: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    abstract: z.string().optional(),
    boundingBox: z.object({
      minX: z.number(),
      minY: z.number(),
      maxX: z.number(),
      maxY: z.number(),
    }).optional(),
  })),
  title: z.string().optional(),
  abstract: z.string().optional(),
});

// Custom URL validation that accepts both absolute URLs and relative paths
const urlOrRelativePathSchema = z.string().refine(
  (value) => {
    // Allow relative paths (starting with / or ./ or ../)
    if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
      return true;
    }
    // Allow absolute URLs
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Must be a valid URL or relative path",
  }
);

// Service schema for serialization (without capabilities)
export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: urlOrRelativePathSchema,
  format: z.enum(['wms', 'wmts', 'xyz', 'wfs', 'cog', 'geojson', 'flatgeobuf']),
  // capabilities are not included in serialized config
});

// Enhanced DataSourceItem schema with optional url and additional fields
export const DataSourceItemSchema = z.object({
  url: urlOrRelativePathSchema.optional(),
  format: z.string(),
  zIndex: z.number(),
  isBaseLayer: z.boolean().optional(),
  layers: z.string().optional(),
  level: z.number().optional(),
  type: z.string().optional(),
  serviceId: z.string().optional(),
  // Additional fields for COG and styled layers
  normalize: z.boolean().optional(),
  style: z.any().optional(), // Allow any style object structure
  images: z.array(z.object({
    url: urlOrRelativePathSchema,
  })).optional(),
}).refine(
  (data) => {
    // Either url or images array must be present
    return data.url || (data.images && data.images.length > 0);
  },
  {
    message: "Either 'url' or 'images' array must be provided",
  }
);

// Simplified - data field is always an array of DataSourceItems
const DataFieldSchema = z.array(DataSourceItemSchema);

// Statistics field schema - array of DataSourceItems with level field
const StatisticsFieldSchema = z.array(DataSourceItemSchema);

// Updated Swipe configuration schema to support multiple base sources
const SwipeConfigSchema = z.object({
  clippedSourceName: z.string().min(1, "Clipped source name is required"),
  baseSourceNames: z.array(z.string().min(1, "Base source name is required"))
    .min(1, "At least one base source is required")
    .refine(
      (names) => new Set(names).size === names.length,
      {
        message: "Base source names must be unique",
      }
    ),
});

// Enhanced meta schema with additional fields including swipe config
const MetaSchema = z.object({
  description: z.string(),
  attribution: z.object({
    text: z.string(),
    url: z.string().optional(),
  }),
  categories: z.array(CategorySchema).optional(),
  units: z.string().optional(),
  // Additional fields for color ramps and statistics
  min: z.number().optional(),
  max: z.number().optional(),
  startColor: z.string().optional(),
  endColor: z.string().optional(),
  // Swipe layer configuration
  swipeConfig: SwipeConfigSchema.optional(),
});

// Enhanced layout schema
const LayoutSchema = z.object({
  interfaceGroup: z.string().optional(),
  layerCard: z.object({
    toggleable: z.boolean().optional(),
    legend: z.object({
      type: z.enum(['swatch', 'gradient', 'image']),
      url: z.string().optional(),
    }).refine(
      (data) => {
        // If type is 'image', url is required
        if (data.type === 'image') {
          return data.url && data.url.trim().length > 0;
        }
        return true;
      },
      {
        message: "URL is required when legend type is 'image'",
        path: ['url'],
      }
    ).optional(),
    controls: z.union([
      z.object({
        opacitySlider: z.boolean().optional(),
      }),
      z.array(z.string()), // Support controls as array of strings
    ]).optional(),
    showStatistics: z.boolean().optional(),
  }).optional(),
});

// Base schema with common required fields including optional statistics
const BaseDataSourceSchema = z.object({
  name: z.string(),
  isActive: z.boolean(),
  data: DataFieldSchema,
  statistics: StatisticsFieldSchema.optional(), // Add optional statistics array
  hasFeatureStatistics: z.boolean().optional(),
});

// Schema for base layers (meta and layout are optional)
const BaseLayerSchema = BaseDataSourceSchema.extend({
  meta: MetaSchema.optional(),
  layout: LayoutSchema.optional(),
});

// Schema for layer cards (meta and layout are required)
const LayerCardSchema = BaseDataSourceSchema.extend({
  meta: MetaSchema,
  layout: LayoutSchema,
});

// Schema for swipe layers (meta with swipeConfig and layout are required)
const SwipeLayerSchema = BaseDataSourceSchema.extend({
  meta: MetaSchema.refine(
    (meta) => meta.swipeConfig !== undefined,
    {
      message: "Swipe layers must have swipeConfig in meta",
      path: ['swipeConfig'],
    }
  ),
  layout: LayoutSchema,
});

// Flexible DataSource schema that handles base layers, layer cards, and swipe layers
export const DataSourceSchema = z.union([
  // Base layer: has at least one data item with isBaseLayer: true
  BaseLayerSchema.refine(
    (data) => {
      return data.data.some(item => item.isBaseLayer === true);
    },
    {
      message: "Base layers must have at least one data item with isBaseLayer: true",
    }
  ),
  // Swipe layer: has swipeConfig in meta
  SwipeLayerSchema.refine(
    (data) => {
      return !data.data.some(item => item.isBaseLayer === true);
    },
    {
      message: "Swipe layers cannot have data items with isBaseLayer: true",
    }
  ),
  // Layer card: doesn't have any items with isBaseLayer: true and no swipeConfig
  LayerCardSchema.refine(
    (data) => {
      return !data.data.some(item => item.isBaseLayer === true) && !data.meta.swipeConfig;
    },
    {
      message: "Layer cards cannot have data items with isBaseLayer: true or swipeConfig",
    }
  ),
  // Flexible schema for layers that don't fit the strict patterns
  BaseDataSourceSchema.extend({
    meta: MetaSchema.optional(),
    layout: LayoutSchema.optional(),
  }),
]);

export const ConfigurationSchema = z.object({
  version: z.string().optional().default('1.0.0'),
  layout: z.object({
    navigation: z.object({
      logo: urlOrRelativePathSchema,
      title: z.string().min(1, 'Title is required'),
    }),
  }),
  interfaceGroups: z.array(z.string()),
  exclusivitySets: z.array(z.string()),
  services: z.array(ServiceSchema).optional().default([]), // Make services optional for backwards compatibility
  sources: z.array(DataSourceSchema),
});

export type ValidatedConfiguration = z.infer<typeof ConfigurationSchema>;
export type ValidationError = z.ZodError;
