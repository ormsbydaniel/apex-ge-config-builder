

## Investigation Results

The import failure is **not** about missing meta/attribution fields. It's caused by **chart schema mismatches** in `src/schemas/configSchema.ts`. Because the source schema uses a `z.union()`, when chart validation fails, Zod tries all union branches and surfaces misleading errors from other branches (like missing meta from `BaseLayerSchema`).

There are three specific mismatches between your chart JSON and the current Zod schemas:

1. **`ChartSourceSchema.type`** only allows `'externalURL' | 'lookupURL'` — your config uses `"pixelValues"` which is rejected
2. **`ChartConfigSchema.x`** is typed as `z.string().optional()` — your config passes an array `["red", "green", "blue"]`
3. **`ChartTraceSchema.y`** is required (`z.string()`) — your traces don't have a `y` field (pixel-value charts derive Y from the data)

## Plan

Update the chart schemas in `src/schemas/configSchema.ts` to accept these valid chart configurations:

1. **`ChartSourceSchema`** — add `'pixelValues'` to the `type` enum (line 14)
2. **`ChartConfigSchema`** — change `x` from `z.string().optional()` to `z.union([z.string(), z.array(z.string())]).optional()` to accept both a single field name and an array of band labels (line 103)
3. **`ChartTraceSchema`** — make `y` optional (`z.string().optional()`) since pixel-value charts don't use a named Y field (line 38)

These are three small, targeted changes to the schema file. No other files need modification.

