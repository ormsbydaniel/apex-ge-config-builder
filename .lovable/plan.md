
1. Use `DataSourceItem` delete button as the alignment baseline (`h-8 w-8 p-0`, right-aligned action group), then update the remove-all control to match that exact anchor point.
2. In `src/components/layers/components/DataSourceDisplay.tsx`, replace the current icon+label inline-flow wrapper (`gap-0 mr-[-8px]`) with an icon-anchored structure where:
   - the trash `Button` is the only layout-driving element and the only tooltip/dialog trigger,
   - the `"All"` label is visually placed to the right but removed from normal flow (so it no longer shifts icon position).
3. Remove the negative margin and spacing hacks (`mr-[-8px]`, gap tuning) so alignment is deterministic and not pixel-drift prone.
4. Keep button sizing/styling consistent with row actions (`size="sm"`, `h-8 w-8 p-0`, `Trash2 h-3 w-3`) to ensure column consistency.
5. Verify behavior and layout:
   - remove-all trash icon aligns vertically with row trash icons,
   - tooltip still shows “Remove all data sources,”
   - alert dialog still opens from the trash button.

Technical details:
- Primary file: `src/components/layers/components/DataSourceDisplay.tsx`
- Root cause confirmed: the `"All"` label currently participates in right-aligned flex layout, so the icon is offset; `mr-[-8px]` is a brittle compensation.
- Target layout model:
```text
Current: [icon][All] (same flow, right-aligned as a group) -> icon drifts
Target:  [icon] (aligned anchor) + [All] (visual text, out-of-flow/right-positioned)
```
