# Tutorial 4-2: expand "Experiment with layer controls"

Keep 4-2 as a single page, but restructure it into a short section per control, each with a
one- or two-line explainer of what the control does in the Explorer, followed by short
numbered steps to try it out. Where a control has options (notably Zoom to), give steps for
both variants.

## Page structure

Intro (2 sentences): the **Layer controls** section of a layer card decides which interactive
controls the Explorer shows for that layer. Open your *AGB* layer card, find the **Controls**
section, and click the pencil to open **Edit Controls**. After each change, **Save** the card
and open **GE Preview** to see the effect.

Then one `###` section per control, in the order they appear in the Edit Controls dialog:

1. **Toggleable** — lets users switch the layer on and off from the layer card. Steps: enable,
   save, preview, toggle the layer off and on.
2. **Zoom to Center** — adds a zoom button that moves the map to the layer. Two options:
   - *Layer bounds* — zooms to the layer's own extent. Steps: choose Layer bounds, save,
     preview, pan away, click zoom.
   - *Custom extent* — zooms to coordinates you supply as `xmin, ymin, xmax, ymax`. Steps:
     switch to Custom extent, paste a sample extent, save, preview, compare with the
     bounds behaviour.
   Note that an invalid or incomplete extent falls back to layer bounds.
3. **Opacity Slider** — lets users fade the layer to see what is underneath. Steps: enable,
   preview, drag the slider over the base map.
4. **Blend Controls** — exposes blend modes (multiply, overlay, etc.) for combining the layer
   with layers below it. Steps: enable, preview, try a couple of modes.
5. **Constraint Slider** — surfaces a slider for filtering by a configured constraint. Note it
   only does something once constraints are defined, with a pointer to Tutorial 7.
6. **Temporal Controls** — shows the time picker; the **Time picker** dropdown
   (None / Time / Days / Months / Years) sets the granularity. Keep the existing "we cover
   this in the Time Series tutorial" note and link to Tutorial 6.
7. **Download** — adds a download button; the optional URL field controls the target. Keep
   the existing tip about pointing at the COG URL or the dataset's STAC record on the PRR.

Close with the existing "Did you remember to export?" reminder.

## Notes

- No screenshots added in this pass; the page stays text-only apart from the existing tip.
- Only `docs/workshops/04-fine-tuning/02-layer-controls.md` changes; nav and other tutorials
  are untouched.
- After editing, run `mkdocs build --strict` to regenerate `public/guide/`.
