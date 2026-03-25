

## Fine-Tune Modal Title and Format Dropdown Labels

### Problem
The modal always says "Select Data Source" and the format dropdown says "All formats" regardless of context.

### Approach
Derive a `sourceContext` label from the `allowedFormats` prop (already threaded through) and use it to customize the title and dropdown text.

### Changes

**1. `src/components/layers/components/ServiceSelectionModals.tsx`**
- Add a prop `sourceContext?: 'data' | 'chart' | 'statistics' | 'constraint'` (default `'data'`)
- Use it in the `DialogTitle`: `Select ${contextLabel} Source` where contextLabel maps to `Data | Chart | Statistics | Constraint`
- Pass `sourceContext` down to `S3LayerSelector`

**2. `src/components/form/S3LayerSelector.tsx`**
- Add prop `sourceContext?: string`
- Change the `<option value="all">` from `"All formats"` to `"All supported ${sourceContext} formats"` (e.g. "All supported chart formats")

**3. Callers — pass `sourceContext`**
- `DataSourceForm.tsx`: pass `sourceContext={isAddingStatistics ? 'statistics' : 'data'}`
- `ChartSourceForm.tsx`: pass `sourceContext="chart"`
- `ConstraintSourceForm.tsx`: pass `sourceContext="constraint"`

### Files modified
1. `src/components/layers/components/ServiceSelectionModals.tsx`
2. `src/components/form/S3LayerSelector.tsx`
3. `src/components/layers/DataSourceForm.tsx`
4. `src/components/layers/components/ChartSourceForm.tsx`
5. `src/components/layers/components/ConstraintSourceForm.tsx`

