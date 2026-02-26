

## Problem

Old configuration files have sources with `meta.description` present but **missing `meta.attribution`** entirely. The Zod schema (`MetaSchema`) requires `attribution.text` as a mandatory string field. Currently, the `metaCompletionDetector` and `metaCompletionTransformer` only detect/fix:
- Missing `description`
- Empty `meta` objects
- Missing `meta` when `layout` exists

They do **not** detect or fix the case where `description` exists but `attribution` is absent.

## Approach

Extend the **existing** detector and transformer rather than creating new files. This keeps the attribution completion logically grouped with the other meta completion logic.

## Changes

### 1. `src/utils/importTransformations/detection/metaCompletionDetector.ts`

Add a new check after the existing "meta but missing description" block:

- If `source.meta` exists and has `description` but is missing `attribution` or `attribution.text`, return `true` (needs completion).

### 2. `src/utils/importTransformations/transformers/metaCompletionTransformer.ts`

Add a new handling block for sources that have `meta.description` but are missing `attribution`:

- If `source.meta` exists and `source.meta.description` exists but `source.meta.attribution?.text` is missing/empty, add a default `attribution` object:
  ```ts
  attribution: {
    text: 'Data attribution not specified',
    ...(source.meta.attribution?.url && { url: source.meta.attribution.url })
  }
  ```
- This block should be placed **before** the existing "meta but missing description" block so that sources with description but no attribution are caught specifically, rather than falling through to the broader case.

### 3. No other files need changes

- `types.ts` — `metaCompletionNeeded` flag already exists in `DetectedTransformations`.
- `iterativeOrchestrator.ts` — does not currently call `reverseMetaCompletionTransformation` in its loop (it's only in the linear orchestrator). This is an existing gap but is out of scope for this change; the linear orchestrator already wires it correctly.
- Schema and TypeScript types — no changes needed; `attribution` is already defined.

## Summary of Logic

```text
Detector:
  source.meta exists?
    → has description but missing attribution.text? → needs completion ✓

Transformer:
  source has meta.description but no meta.attribution.text?
    → add default attribution { text: 'Data attribution not specified' }
```

Two small, targeted additions to existing files following the established pattern.

