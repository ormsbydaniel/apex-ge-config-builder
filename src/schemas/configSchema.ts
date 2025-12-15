
import { z } from 'zod';

export const CategorySchema = z.object({
  color: z.string(),
  label: z.string(),
  value: z.number().optional(), // Add optional value field
});

// ============= Chart Schemas =============

// Chart source schema
const ChartSourceSchema = z.object({
  type: z.enum(['externalURL', 'lookupURL']).optional(),  // Optional for flexibility
  url: z.string().optional(),
  field: z.string().optional(),
  format: z.enum(['csv', 'json']).optional(),
  label: z.string().optional(),
}).passthrough();

// Chart trace line schema
const TraceLineSchema = z.object({
  color: z.string().optional(),
  width: z.number().optional(),
  dash: z.string().optional(),
  shape: z.string().optional(),
}).passthrough();

// Chart trace marker schema
const TraceMarkerSchema = z.object({
  size: z.number().optional(),
  color: z.string().optional(),
  symbol: z.string().optional(),
}).passthrough();

// Chart trace schema
const ChartTraceSchema = z.object({
  y: z.string(),
  name: z.string().optional(),
  type: z.enum(['scatter', 'bar', 'histogram', 'pie']).optional(),
  mode: z.enum(['lines', 'markers', 'lines+markers']).optional(),
  fill: z.enum(['none', 'tozeroy', 'tonexty']).optional(),
  fillcolor: z.string().optional(),
  line: TraceLineSchema.optional(),
  marker: TraceMarkerSchema.optional(),
  showlegend: z.boolean().optional(),
}).passthrough();

// Chart font schema
const ChartFontSchema = z.object({
  size: z.number().optional(),
  color: z.string().optional(),
  family: z.string().optional(),
}).passthrough();

// Chart axis schema
const ChartAxisSchema = z.object({
  title: z.string().optional(),
  titleFont: ChartFontSchema.optional(),
  tickfont: ChartFontSchema.optional(),
  tickformat: z.string().optional(),
  ticksuffix: z.string().optional(),
  tickprefix: z.string().optional(),
  type: z.enum(['date', 'linear', 'category', '-']).optional(),
  tickangle: z.number().optional(),
  showgrid: z.boolean().optional(),
  range: z.array(z.any()).length(2).optional(),
}).passthrough();

// Chart legend schema
const ChartLegendSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  xanchor: z.string().optional(),
  yanchor: z.string().optional(),
  orientation: z.enum(['h', 'v']).optional(),
}).passthrough();

// Chart layout schema
const ChartLayoutSchema = z.object({
  height: z.number().optional(),
  showlegend: z.boolean().optional(),
  legend: ChartLegendSchema.optional(),
  barmode: z.enum(['group', 'stack', 'overlay', 'relative']).optional(),
}).passthrough();

// Pie chart schema
const ChartPieSchema = z.object({
  labels: z.string().optional(),  // Optional for flexibility
  values: z.string().optional(),  // Optional for flexibility
  hole: z.number().optional(),
  textinfo: z.string().optional(),
  colors: z.array(z.string()).optional(),
}).passthrough();

// Main chart config schema
const ChartConfigSchema = z.object({
  chartType: z.enum(['xy', 'pie']).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  x: z.string().optional(),  // Optional to support pie charts
  xaxis: ChartAxisSchema.optional(),
  yaxis: ChartAxisSchema.optional(),
  traces: z.array(ChartTraceSchema).optional(),  // Optional for pie charts
  layout: ChartLayoutSchema.optional(),
  pie: ChartPieSchema.optional(),
  sources: z.array(ChartSourceSchema).optional(),
}).passthrough();

// ============= End Chart Schemas =============

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
}).passthrough() // Allow arbitrary additional properties (e.g., env, styles, time, transparent)
.refine(
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

// Constraint source schema
const ConstraintSourceItemSchema = z.object({
  url: urlOrRelativePathSchema,
  format: z.literal('cog'),
  label: z.string(),
  type: z.enum(['continuous', 'categorical', 'combined']),
  interactive: z.boolean(),
  // Continuous fields
  min: z.number().optional(),
  max: z.number().optional(),
  units: z.string().optional(),
  // Categorical and combined fields
  constrainTo: z.union([
    z.array(z.object({
      label: z.string(),
      value: z.number()
    })),
    z.array(z.object({
      label: z.string(),
      min: z.number(),
      max: z.number()
    }))
  ]).optional(),
  // Band selection
  bandIndex: z.number().int().optional()
}).refine(
  (data) => {
    // Continuous constraints require min and max
    if (data.type === 'continuous') {
      return data.min !== undefined && data.max !== undefined;
    }
    // Categorical constraints require constrainTo array with value
    if (data.type === 'categorical') {
      return data.constrainTo && data.constrainTo.length > 0;
    }
    // Combined constraints require constrainTo array with min/max
    if (data.type === 'combined') {
      return data.constrainTo && data.constrainTo.length > 0;
    }
    return true;
  },
  {
    message: "Continuous constraints require min/max, categorical/combined constraints require constrainTo array",
  }
);

// Workflow schema
const WorkflowItemSchema = z.object({
  zIndex: z.number(),
  service: z.string(),
  label: z.string(),
}).passthrough(); // Allow arbitrary additional properties

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
  timeframe: z.enum(['None', 'Time', 'Days', 'Months', 'Years']),
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
}).superRefine((meta, ctx) => {
  // Conditional validation: startColor and endColor required for gradient legends WITHOUT colormaps
  // This validation only applies when used with a DataSource that has a gradient legend
  // The actual legend type check happens at the DataSource level
  // Here we just ensure that if startColor/endColor are present without colormaps, they're valid
  const hasColormaps = meta.colormaps && meta.colormaps.length > 0;
  
  // If there are no colormaps and startColor is present but empty, that's an error
  if (!hasColormaps && meta.startColor !== undefined && meta.startColor.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start color cannot be empty when using gradient legend without colormaps",
      path: ['startColor'],
    });
  }
  
  // If there are no colormaps and endColor is present but empty, that's an error
  if (!hasColormaps && meta.endColor !== undefined && meta.endColor.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End color cannot be empty when using gradient legend without colormaps",
      path: ['endColor'],
    });
  }
});

// Legend schema (reusable)
const LegendSchema = z.object({
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
);

// Controls schema (reusable)
const ControlsSchema = z.union([
  z.object({
    opacitySlider: z.boolean().optional(),
    zoomToCenter: z.boolean().optional(),
    download: z.string().optional(),
    temporalControls: z.boolean().optional(),
    constraintSlider: z.boolean().optional(),
    blendControls: z.boolean().optional(),
  }),
  z.array(z.string()), // Support controls as array of strings for backward compatibility
]);

// Enhanced layout schema with support for both layerCard and infoPanel
// NOTE: layerCard is REQUIRED and always contains toggleable
// Only legend and controls move between layerCard and infoPanel based on contentLocation
const LayoutSchema = z.object({
  interfaceGroup: z.string().optional(),
  contentLocation: z.enum(['layerCard', 'infoPanel']).optional(),
  layerCard: z.object({
    toggleable: z.boolean().optional(), // Always lives here
    legend: LegendSchema.optional(),
    controls: ControlsSchema.optional(),
    showStatistics: z.boolean().optional(),
  }), // REQUIRED - not optional
  infoPanel: z.object({
    legend: LegendSchema.optional(),
    controls: ControlsSchema.optional(),
  }).optional(),
}).refine(
  (data) => {
    // Validation: Only legend and controls cannot be in both locations simultaneously
    const hasLayerCardContent = data.layerCard && (data.layerCard.legend || data.layerCard.controls);
    const hasInfoPanelContent = data.infoPanel && (data.infoPanel.legend || data.infoPanel.controls);
    
    if (hasLayerCardContent && hasInfoPanelContent) {
      return false;
    }
    return true;
  },
  {
    message: "Legend and controls cannot be in both layerCard and infoPanel simultaneously",
  }
);

// Base object schema without refinements (so it can be extended)
const BaseDataSourceObjectSchema = z.object({
  name: z.string(),
  isActive: z.boolean(),
  data: DataFieldSchema,
  statistics: StatisticsFieldSchema.optional(), // Add optional statistics array
  constraints: z.array(ConstraintSourceItemSchema).optional(), // Add optional constraints array
  workflows: z.array(WorkflowItemSchema).optional(), // Add optional workflows array
  charts: z.array(ChartConfigSchema).optional(), // Add optional charts array
  hasFeatureStatistics: z.boolean().optional(),
  isBaseLayer: z.boolean().optional(), // Add optional isBaseLayer for new format
  exclusivitySets: z.array(z.string()).optional(), // Array of exclusivity set names
  // New layer type flags
  isSwipeLayer: z.boolean().optional(),
  isMirrorLayer: z.boolean().optional(),
  isSpotlightLayer: z.boolean().optional(),
  // Temporal configuration fields
  timeframe: z.enum(['None', 'Time', 'Days', 'Months', 'Years']).optional(),
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
  preview: z.string().url().optional(), // Preview image URL for base layers
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
  version: z.string().optional(),
  layout: z.object({
    navigation: z.object({
      logo: urlOrRelativePathSchema,
      title: z.string().min(1, 'Title is required'),
    }),
    theme: z.object({
      'primary-color': z.string().optional(),
      'secondary-color': z.string().optional(),
      'tertiary-color': z.string().optional(),
      'accent-color': z.string().optional(),
      'background-color': z.string().optional(),
      'foreground-color': z.string().optional(),
      'text-color-primary': z.string().optional(),
      'text-color-secondary': z.string().optional(),
      'disabled-color': z.string().optional(),
      'border-color': z.string().optional(),
      'success-color': z.string().optional(),
      'text-color-on-success': z.string().optional(),
      'error-color': z.string().optional(),
      'text-color-on-error': z.string().optional(),
      'warning-color': z.string().optional(),
      'text-color-on-warning': z.string().optional(),
    }).optional(),
  }),
  interfaceGroups: z.array(z.string()),
  exclusivitySets: z.array(z.string()),
  services: z.array(ServiceSchema).optional().default([]), // Make services optional for backwards compatibility
  sources: z.array(DataSourceSchema),
  mapConstraints: z.object({
    zoom: z.number().min(0).max(28),
    center: z.array(z.number()).length(2), // [longitude, latitude]
    projection: z.string().optional(), // EPSG projection code
  }).optional(),
});

export type ValidatedConfiguration = z.infer<typeof ConfigurationSchema>;
export type ValidationError = z.ZodError;
