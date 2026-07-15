## Goal

In the storymap step editor dialogs that pick layers, group the dropdown options by interface group and sub-group so users can see each layer's placement in the app hierarchy.

## Scope

Three pickers in `src/components/config/storymaps/actions/ActionEditors.tsx`, all fed by the `layerOptions` array (already carries `interfaceGroup` and `subinterfaceGroup` from `ActionsAndLayersSection.tsx`):

1. **NavigationEditor** — "Fit to layer" Select (~line 234)
2. **ActiveLayersEditor** — "Add layer" Select (~line 506)
3. **PanelStateEditor** — "Focus layer" Select (~line 635, limited to currently-active layers)

## Approach

- Add a small helper (co-located in `ActionEditors.tsx`) that takes `LayerOption[]` and returns a grouped structure:
  ```
  [{ group: 'Soils', subGroups: [
      { name: null, layers: [...] },     // layers directly under the group
      { name: 'Greece', layers: [...] }, // layers under a sub-group
    ]},
    ...,
    { group: '__ungrouped__', subGroups: [{ name: null, layers: [...] }] } // layers with no interface group
  ]
  ```
  Preserve the incoming layer order within each bucket (matches the current flat order used elsewhere).

- Replace each of the three `<SelectContent>` bodies with a rendering that uses shadcn's `SelectGroup` + `SelectLabel` for the interface group, and a nested indented `SelectLabel` for each sub-group. Layer `SelectItem`s under a sub-group get a small left padding (e.g. `pl-6`) so the tree is visible; layers directly under a group use the normal padding. Ungrouped layers render under a muted "Ungrouped" label.

- Keep the trigger unchanged — still shows just the layer name (via existing `optionLabel`). No changes to selected values, IDs, or persisted data.

- PanelStateEditor's focus dropdown keeps its `None` item at the top, then renders the grouped active layers below using the same helper (filtered list is passed in).

## Out of scope

- No change to what data is stored on the step.
- No change to `ActionsAndLayersSection.tsx` beyond what it already provides (it already passes `interfaceGroup` / `subinterfaceGroup` on each option — verified).
- No change to non-storymap layer pickers.

## Technical notes

- `Select` from `@/components/ui/select` supports `SelectGroup` and `SelectLabel` (shadcn/Radix). Use them for headings; they are non-selectable, matching the "tree" reading without breaking keyboard nav.
- Indentation via Tailwind classes on `SelectItem` (`pl-6` for sub-group children, `pl-4` for group-only children). Group and sub-group labels use `text-xs uppercase text-muted-foreground` / a slightly lighter variant to distinguish levels.
- Sub-group ordering: alphabetical within a group (matches `useGroupPlacementOptions` convention).
- Interface-group ordering: order of first appearance in `layerOptions` (which itself reflects the config's source order), so the picker mirrors the Layers tab.