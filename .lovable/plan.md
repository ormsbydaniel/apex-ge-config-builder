
# Unify workflow item schema with source schema (canonical SourceShape)

## Goal

Make every `workflows[]` entry validate against the same field set as a top-level `sources[]` entry (meta, data, statistics, constraints, charts, layout, timeframe, layer-type flags, etc.). Shape A and Shape B become identical except Shape B additionally carries `serviceDetails`. A single canonical `SourceShape` is the only place these fields are defined.

## Canonical `SourceShape`

In `src/schemas/configSchema.ts`, define one plain object of Zod fields that both the source schema and the workflow schema consume:

```ts
const SourceShape = {
  name: z.string(),
  isActive: z.boolean(),
  data: DataFieldSchema,
  statistics: StatisticsFieldSchema.optional(),
  constraints: z.array(ConstraintSourceItemSchema).optional(),
  charts: z.array(ChartConfigSchema).optional(),
  meta: MetaSchema.optional(),
  layout: LayoutSchema.optional(),
  hasFeatureStatistics: z.boolean().optional(),
  isBaseLayer: z.boolean().optional(),
  exclusivitySets: z.array(z.string()).optional(),
  isSwipeLayer: z.boolean().optional(),
  isMirrorLayer: z.boolean().optional(),
  isSpotlightLayer: z.boolean().optional(),
  timeframe: z.enum(['None','Time','Days','Months','Years']).optional(),
  defaultTimestamp: z.number().optional(),
} as const;
```

Note: `workflows` is intentionally **not** part of `SourceShape` to avoid recursion. Sources add it themselves; workflow entries do not nest further workflows.

### Source schema reuses `SourceShape`

```ts
const BaseDataSourceObjectSchema = z.object({
  ...SourceShape,
  workflows: z.array(WorkflowItemSchema).optional(),
});
```

All existing refinements (`BaseDataSourceSchema`, `BaseLayerSchema`, `SwipeLayerSchema`, `LayerCardSchema`, `ComparisonLayerSchema`, the `DataSourceSchema` union) continue to extend `BaseDataSourceObjectSchema` exactly as today — behaviour and error messages unchanged.

### Workflow schema reuses `SourceShape`

```ts
const ServiceDetailsSchema = z.object({
  endpoint: z.string(),
  namespace: z.string().optional(),
  application: z.string().optional(),
}).passthrough();

// Make every source field optional inside a workflow entry,
// since workflow entries populate only a subset.
const OptionalSourceShape = Object.fromEntries(
  Object.entries(SourceShape).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()])
) as { [K in keyof typeof SourceShape]: z.ZodOptional<typeof SourceShape[K]> };

const WorkflowItemSchema = z.object({
  serviceId: z.string(),
  serviceProvider: z.string(),
  serviceDetails: ServiceDetailsSchema.optional(),
  // legacy fields kept for back-compat with existing configs
  zIndex: z.number().optional(),
  service: z.string().optional(),
  label: z.string().optional(),
  // full source surface, all optional
  ...OptionalSourceShape,
}).passthrough();
```

### Why this works as the single source of truth

- Any future field added to `SourceShape` is automatically valid inside a workflow entry — zero second-place updates.
- The `WorkflowItemSchema` declaration is created before `BaseDataSourceObjectSchema` references it (standard hoisting via `const` ordering — declare `WorkflowItemSchema` first since it does not reference the source schema).
- No circular type, because workflows do not contain `workflows`.

## Type changes (`src/types/dataSource.ts`)

Update `WorkflowItem` to mirror the schema. It keeps the existing legacy fields optional and gains the full optional source surface plus `serviceId`, `serviceProvider`, and `serviceDetails`. `[key: string]: any` stays for passthrough.

## Preservation through import / export / JSON editor

- `processSourceArrays` in `src/utils/importTransformations/utils/sourceHelpers.ts` already passes `workflows` through verbatim — no change needed.
- Audit `src/utils/importTransformations/**` for any helper that iterates `source.data` / `source.meta` and confirm none recurse into `workflows[].data` / `workflows[].meta`. If one does, scope it to the top-level source only.
- Export path: workflows are part of the source object and serialised as-is — no change.
- JSON editor: uses `ConfigurationSchema` for validation, so the broader workflow shape is accepted automatically.

## Validation

1. New test: parse the user's `config_workflow_execution.json` workflows array and assert no Zod errors for both Shape A (with `meta` + `data`) and Shape B (with `serviceDetails`).
2. Round-trip test: parse → re-serialise → re-parse equals original (ensures nothing is stripped from a workflow entry that carries `meta`, `data`, `statistics`, etc.).
3. Run existing schema tests to confirm no regression on sources/base layers/swipe/comparison layers.

## Out of scope (later phase)

- UI to edit `workflows[].meta`, `workflows[].data`, `serviceDetails`, etc.
- Migration of legacy `{ zIndex, service, label }`-only workflow entries into the new shape.
