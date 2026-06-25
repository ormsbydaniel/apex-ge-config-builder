# Deprecated: per-source `source.workflows`

## Status

`BaseDataSource.workflows` is **deprecated** as of the Workflows tab launch.

## Why

Workflows are now a single top-level collection: `config.workflows`. The
Workflows tab (see `src/components/config/workflows/`) is the only place
workflows are created, edited, or removed from the UI. Keeping workflows
attached to individual sources fragmented the data, complicated cross-cutting
features (catalogue browser, sharing, ordering), and duplicated the bookkeeping
already done by the top-level array.

## Backward compatibility

The schema (`src/schemas/configSchema.ts`) still accepts `workflows` on each
source via `BaseDataSourceObjectSchema`, and `useValidatedConfig` /
`useConfigSanitization` / `useConfigExport` continue to pass the field through
unchanged. Existing configs that carry per-source workflows will load and
re-export with the field intact — they simply won't appear in the Workflows
tab.

## Migration

If you want existing per-source workflows to show up in the Workflows tab,
run the helper in `migrate.ts`:

```ts
import { migrateSourceWorkflowsToTopLevel } from '@/utils/deprecated/sourceWorkflows/migrate';

const upgraded = migrateSourceWorkflowsToTopLevel(config);
// upgraded.workflows now contains everything that used to live on individual
// sources; upgraded.sources[*].workflows is removed.
```

The helper is **not** invoked automatically anywhere — it is provided as an
opt-in tool you can run from the JSON Config tab or a one-off script when
upgrading older configs.
