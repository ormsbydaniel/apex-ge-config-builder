
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

// Simplified service schema that allows optional sourceType and format
export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: urlOrRelativePathSchema,
  sourceType: z.enum(['s3', 'service', 'stac']).optional(),
  format: z.enum(['wms', 'wmts', 'xyz', 'wfs', 'cog', 'geojson', 'flatgeobuf', 's3', 'stac']).optional(),
  capabilities: ServiceCapabilitiesSchema.optional(),
});

// Enhanced DataSourceItem schema with position field and zoom levels
export const DataSourceItemSchema = z.object({
  url: urlOrRelativePathSchema.optional(),
  format: z.string(),
  zIndex: z.number(),
  isBaseLayer: z.boolean().optional(), // Keep for backward compatibility during import
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
  // Position field for comparison layers
  position: z.enum(['left', 'right', 'background', 'spotlight']).optional(),
  // Zoom level constraints
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
  // Temporal fields for data items
  timestamps: z.array(z.number()).optional(),
  // Opacity support (0-1 range)  
  opacity: z.number().min(0).max(1).optional(),
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

// Temporal configuration schema
const TemporalConfigSchema = z.object({
  timeframe: z.enum(['None', 'Days', 'Months', 'Years']),
  defaultTimestamp: z.number().optional(),
});

// Enhanced meta schema with additional fields including swipe config and temporal
const MetaSchema = z.object({
  description: z.string(),
  attribution: z.object({
    text: z.string(),
    url: z.string().optional(),
  }),
  categories: z.array(CategorySchema).optional(),
  colormaps: z.array(z.object({
    min: z.number(),
    max: z.number(),
    steps: z.number(),
    name: z.string(),
    reverse: z.boolean(),
  })).optional(),
  units: z.string().optional(),
  // Additional fields for color ramps and statistics
  min: z.number().optional(),
  max: z.number().optional(),
  startColor: z.string().optional(),
  endColor: z.string().optional(),
  // Swipe layer configuration
  swipeConfig: SwipeConfigSchema.optional(),
  // Temporal configuration
  temporal: TemporalConfigSchema.optional(),
});

// Enhanced layout schema with proper controls validation
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
        zoomToCenter: z.boolean().optional(),
        download: z.string().optional(),
        temporalControls: z.boolean().optional(),
        constraintSlider: z.boolean().optional(),
      }),
      z.array(z.string()), // Support controls as array of strings for backward compatibility
    ]).optional(),
    showStatistics: z.boolean().optional(),
  }).optional(),
});

// Base object schema without refinements (so it can be extended)
const BaseDataSourceObjectSchema = z.object({
  name: z.string(),
  isActive: z.boolean(),
  data: DataFieldSchema,
  statistics: StatisticsFieldSchema.optional(), // Add optional statistics array
  hasFeatureStatistics: z.boolean().optional(),
  isBaseLayer: z.boolean().optional(), // Add optional isBaseLayer for new format
  exclusivitySets: z.array(z.string()).optional(), // Array of exclusivity set names
  // New layer type flags
  isSwipeLayer: z.boolean().optional(),
  isMirrorLayer: z.boolean().optional(),
  isSpotlightLayer: z.boolean().optional(),
  // Temporal configuration fields
  timeframe: z.enum(['None', 'Days', 'Months', 'Years']).optional(),
  defaultTimestamp: z.number().optional(),
});

// Apply refinement to create the actual BaseDataSourceSchema
const BaseDataSourceSchema = BaseDataSourceObjectSchema.refine(
  (data) => {
    // Only one layer type flag can be true
    const flags = [data.isSwipeLayer, data.isMirrorLayer, data.isSpotlightLayer];
    const trueFlags = flags.filter(Boolean);
    return trueFlags.length <= 1;
  },
  {
    message: "Only one layer type flag (isSwipeLayer, isMirrorLayer, isSpotlightLayer) can be true",
  }
);

// Schema for base layers (isBaseLayer: true at top level, meta and layout are optional)
const BaseLayerSchema = BaseDataSourceObjectSchema.extend({
  isBaseLayer: z.literal(true), // Must be true for base layers
  meta: MetaSchema.optional(),
  layout: LayoutSchema.optional(),
}).refine(
  (data) => {
    // Base layers cannot have comparison layer flags
    return !data.isSwipeLayer && !data.isMirrorLayer && !data.isSpotlightLayer;
  },
  {
    message: "Base layers cannot have comparison layer type flags",
  }
);

// Schema for layer cards (no isBaseLayer, meta and layout are required)
const LayerCardSchema = BaseDataSourceObjectSchema.extend({
  meta: MetaSchema,
  layout: LayoutSchema,
}).refine(
  (data) => {
    return !data.isBaseLayer; // Layer cards cannot have isBaseLayer: true
  },
  {
    message: "Layer cards cannot have isBaseLayer: true",
  }
);

// Schema for swipe layers (meta with swipeConfig and layout are required)
const SwipeLayerSchema = BaseDataSourceObjectSchema.extend({
  meta: MetaSchema.refine(
    (meta) => meta.swipeConfig !== undefined,
    {
      message: "Swipe layers must have swipeConfig in meta",
      path: ['swipeConfig'],
    }
  ),
  layout: LayoutSchema,
}).refine(
  (data) => {
    return !data.isBaseLayer; // Swipe layers cannot have isBaseLayer: true
  },
  {
    message: "Swipe layers cannot have isBaseLayer: true",
  }
);

// Comparison layer schema for new layer types
const ComparisonLayerSchema = BaseDataSourceObjectSchema.extend({
  meta: MetaSchema,
  layout: LayoutSchema,
}).refine(
  (data) => {
    // Comparison layers must have one of the layer type flags
    return data.isSwipeLayer || data.isMirrorLayer || data.isSpotlightLayer;
  },
  {
    message: "Comparison layers must have one layer type flag",
  }
).refine(
  (data) => {
    return !data.isBaseLayer; // Comparison layers cannot have isBaseLayer: true
  },
  {
    message: "Comparison layers cannot have isBaseLayer: true",
  }
);

// Updated DataSource schema that handles all layer types
export const DataSourceSchema = z.union([
  // Base layer: has isBaseLayer: true at top level
  BaseLayerSchema,
  // Swipe layer: has swipeConfig in meta
  SwipeLayerSchema,
  // Comparison layers: have layer type flags
  ComparisonLayerSchema,
  // Layer card: has required meta and layout, no isBaseLayer
  LayerCardSchema,
  // Flexible schema for backward compatibility
  BaseDataSourceObjectSchema.extend({
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
  mapConstraints: z.object({
    zoom: z.number().min(0).max(28),
    center: z.array(z.number()).length(2), // [longitude, latitude]
  }).optional(),
});

export type ValidatedConfiguration = z.infer<typeof ConfigurationSchema>;
export type ValidationError = z.ZodError;
