
## Implementation Plan: Make meta attribution completion work for both base layers and regular layer cards

### What I found (root cause)
1. `metaCompletionNeeded` is detected, but **meta completion is never executed** in the active import flow.
   - `src/utils/importTransformations/iterativeOrchestrator.ts` imports `reverseMetaCompletionTransformation` but does not call it.
   - `src/utils/importTransformations/orchestrator.ts` does not import/call it either.
2. `src/utils/importTransformations/transformers/metaCompletionTransformer.ts` currently **skips base layers early**, so base layers with partial `meta` are never fixed.
3. `src/utils/importTransformations/detection/metaCompletionDetector.ts` currently **skips base layers early**, so base-layer meta gaps are never flagged.

That combination explains why you still see failures for both:
- regular layer cards (transformer not executed),
- base layers (even if transformer were executed, they were skipped).

---

## Design goals
- Keep changes minimal and localized to existing import-transformation pipeline.
- Support both source classes:
  - base layers: only fix `meta` **if `meta` exists**,
  - regular layer cards: fix missing mandatory attribution as before.
- Preserve existing data wherever possible (especially `attribution.url`).
- No schema/type changes unless strictly needed.

---

## File-by-file change plan

### 1) `src/utils/importTransformations/iterativeOrchestrator.ts`
Add execution of meta completion in the iterative pass.

- In the transformation sequence inside the loop, add:
  - `if (detected.metaCompletionNeeded) currentConfig = reverseMetaCompletionTransformation(currentConfig, true);`
- Keep it after structural transforms (type/single/base/swipe), before final comparison.
- Reason: iterative normalization is the primary import path; this is the missing execution point causing regular layer failures.

### 2) `src/utils/importTransformations/orchestrator.ts`
Wire the same transformer into fallback linear path for parity and resilience.

- Import `reverseMetaCompletionTransformation`.
- Add it into the ordered pipeline (near other data-normalization transforms, before final cleanup).
- Prefer conditional execution via `detectedTransforms.metaCompletionNeeded` to stay consistent with existing orchestrator style.

### 3) `src/utils/importTransformations/transformers/metaCompletionTransformer.ts`
Adjust logic to accommodate base layers and regular layers.

- Remove/replace the blanket early-return:
  - current: `if (source.isBaseLayer === true) return source;`
- New behavior:
  - Base layers are processed **only if they already have a `meta` object** that is incomplete.
  - Do **not** create `meta` for base layers that do not have it.
- Keep/extend existing attribution completion rule:
  - if `meta.description` exists but `meta.attribution.text` missing/empty => inject default attribution text.
  - preserve `meta.attribution.url` if present.
- Keep existing layer-card completion behavior (`layout` + missing `meta` => build complete meta) restricted to non-base layers.

### 4) `src/utils/importTransformations/detection/metaCompletionDetector.ts`
Update detection so both layer classes can trigger the transformer.

- Remove/replace blanket base-layer skip.
- Detect as “needs meta completion” when any source with `meta` has:
  - missing description, or
  - missing/empty `meta.attribution.text`, or
  - empty `meta` object.
- Keep “layout but no meta” detection restricted to non-base layers.

---

## Expected behavior after implementation

```text
Import config
  -> detectTransformations() sets metaCompletionNeeded when needed
  -> iterative orchestrator runs reverseMetaCompletionTransformation
  -> missing attribution text is auto-filled
  -> base layers with no meta remain untouched
  -> schema validation passes for both base and regular layers
```

---

## Technical details
- No changes needed in:
  - `src/schemas/configSchema.ts` (already requires `meta.attribution.text` inside `MetaSchema`)
  - `src/types/config.ts` / `useValidatedConfig.ts` (no new fields introduced)
- This is an execution-path and conditional-logic fix, not a schema evolution.
- Keep logging targeted (import-time only); avoid adding broad per-iteration noisy logs beyond current pattern.

---

## Validation checklist (end-to-end)
1. Import a config containing:
   - a base layer with `meta.description` but no `meta.attribution`,
   - a regular layer card with `meta.description` but no `meta.attribution`.
2. Confirm both are normalized and pass `ConfigurationSchema.parse`.
3. Verify base layer with no `meta` remains valid and unchanged.
4. Verify `meta.attribution.url` is preserved when present.
5. Test both import paths:
   - file upload,
   - URL import (`importConfigFromUrl`).

---

## Risks and mitigations
- Risk: accidental meta creation on base layers with no meta.
  - Mitigation: keep base-layer “create missing meta” path disabled.
- Risk: order-dependent behavior if other transforms introduce meta changes.
  - Mitigation: run meta completion in orchestrators after structural transforms.
- Risk: regression in fallback flow.
  - Mitigation: wire transformer in both iterative and linear orchestrators.

<lov-actions>
<lov-suggestion message="Test the config import flow end-to-end with one base layer and one regular layer card missing meta.attribution.text, and confirm both pass validation after normalization.">Verify import flow end-to-end</lov-suggestion>
<lov-suggestion message="Implement the orchestrator wiring so reverseMetaCompletionTransformation runs in both iterativeOrchestrator and fallback orchestrator using the metaCompletionNeeded flag.">Wire meta completion into orchestrators</lov-suggestion>
<lov-suggestion message="Update metaCompletionTransformer and metaCompletionDetector to process base layers only when meta exists and is incomplete, while preserving existing non-base layer completion behavior.">Support base and regular layers</lov-suggestion>
</lov-actions>
